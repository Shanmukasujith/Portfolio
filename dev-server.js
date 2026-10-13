// Local development server. Vercel does not use this file.
require('dotenv').config();
const pool = require('./db');
const app = require('./lib/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Portfolio running on http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => pool.end().finally(() => process.exit(0)));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
