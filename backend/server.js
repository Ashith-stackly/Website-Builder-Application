const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const connectDB = require('./src/database/connection');

const port = Number(process.env.PORT) || 5000;

async function start() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Stackly backend listening on http://localhost:${port}`);
  });
}

start();
