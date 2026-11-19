import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// Built once per function instance and reused across warm invocations.
let cached: Promise<Handler> | undefined;

async function createHandler(): Promise<Handler> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { bufferLogs: true });
  configureApp(app);
  await app.init();
  return server as unknown as Handler;
}

export async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  cached ??= createHandler().catch((err: unknown) => {
    cached = undefined;
    throw err;
  });
  const app = await cached;
  app(req, res);
}
