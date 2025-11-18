// Wrapper to start compiled TypeScript app if available.
// Prefer `dist/server.js`. If missing, print instructions and exit.
try {
  require('./dist/server.js');
} catch (e) {
  console.error('Compiled server not found. Run `npm run build` then `npm start` to run the TypeScript build.');
  console.error(e && e.message ? e.message : e);
  process.exit(1);
}
