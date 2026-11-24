/**
 * Integration tests against real Postgres and MongoDB (docker compose up -d).
 * Run via `npm run test:e2e`, which sets NODE_OPTIONS=--experimental-vm-modules: the MongoDB driver
 * loads `os` with a native dynamic import(), which Jest only supports with that flag. Without it the
 * handshake is sent with no client metadata and the server rejects it ("Missing required sub-document 'driver'").
 */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  testTimeout: 30000,
};
