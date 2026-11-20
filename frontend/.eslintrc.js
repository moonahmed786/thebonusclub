module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['src/shared/api/schema.d.ts', 'android/', 'ios/', 'coverage/'],
  rules: {
    // Use src/shared/logger.ts, which strips personal data.
    'no-console': 'error',
  },
};
