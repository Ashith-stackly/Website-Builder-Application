const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sendOtpEmail } = require('../src/services/emailService');

async function main() {
  const to = process.env.TEST_EMAIL_TO || process.env.SMTP_USER;
  if (!to) {
    throw new Error('Set TEST_EMAIL_TO or SMTP_USER before running npm run test:email');
  }

  const result = await sendOtpEmail(to, '1234');
  console.log(`Test OTP email handled using ${result.deliveryMode} mode.`);
  if (result.messageId) {
    console.log(`Message ID: ${result.messageId}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
