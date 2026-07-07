const nodemailer = require('nodemailer');

let transporter = null;

function getEmailDeliveryMode() {
  return process.env.EMAIL_DELIVERY_MODE || (process.env.NODE_ENV === 'production' ? 'smtp' : 'console');
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Get (or lazily create) the Nodemailer transporter.
 */
function getTransporter() {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT) || 587;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function getFromAddress() {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'Stackly';
  return `"${fromName}" <${fromEmail}>`;
}

module.exports = {
  getEmailDeliveryMode,
  getFromAddress,
  getTransporter,
  isSmtpConfigured,
};
