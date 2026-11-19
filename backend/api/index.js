// Vercel Serverless Function entry. All routes are rewritten here (see vercel.json).
// The Nest app is compiled to dist/ by `npm run build` and cached across warm invocations.
const { handler } = require('../dist/vercel');

module.exports = handler;
