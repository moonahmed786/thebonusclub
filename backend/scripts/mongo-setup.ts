import 'dotenv/config';
import { MongoClient, MongoServerError } from 'mongodb';

// Creates MongoDB collections with JSON-schema validators and indexes. Safe to re-run.
const AUDIT_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['action', 'actorType', 'subjectType', 'subjectId', 'at', 'data'],
    additionalProperties: true,
    properties: {
      action: { bsonType: 'string', maxLength: 64 },
      actorType: { enum: ['member', 'admin', 'partner', 'system'] },
      actorId: { bsonType: ['string', 'null'] },
      subjectType: { enum: ['user', 'voucher', 'partner', 'offer', 'verification_code'] },
      subjectId: { bsonType: 'string' },
      requestId: { bsonType: 'string' },
      at: { bsonType: 'date' },
      data: { bsonType: 'object', maxProperties: 20 },
    },
  },
};

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  const client = new MongoClient(uri);
  try {
    const db = client.db(process.env.MONGODB_DB ?? 'bonusclub');
    const existing = await db.listCollections({ name: 'audit_events' }).next();
    if (!existing) {
      await db.createCollection('audit_events', { validator: AUDIT_VALIDATOR, validationLevel: 'strict' });
    } else {
      const current = (existing as { options?: { validator?: unknown } }).options?.validator;
      if (JSON.stringify(current) !== JSON.stringify(AUDIT_VALIDATOR)) {
        try {
          await db.command({ collMod: 'audit_events', validator: AUDIT_VALIDATOR, validationLevel: 'strict' });
        } catch (err) {
          // collMod needs the dbAdmin role; an app user with readWrite cannot update validators.
          if (err instanceof MongoServerError && err.code === 13) {
            process.stderr.write('WARNING: audit_events validator is out of date and this user cannot update it (needs dbAdmin)\n');
          } else {
            throw err;
          }
        }
      }
    }
    const audit = db.collection('audit_events');
    await audit.createIndex({ subjectType: 1, subjectId: 1, at: -1 });
    await audit.createIndex({ action: 1, at: -1 });
    await audit.createIndex({ actorId: 1, at: -1 });
    process.stdout.write('Mongo collections ready\n');
  } finally {
    await client.close();
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
