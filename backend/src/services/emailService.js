const ApiError = require('../utils/ApiError');
const {
  getEmailDeliveryMode,
  getFromAddress,
  getTransporter,
  isSmtpConfigured,
} = require('../config/email');

async function sendOtpEmail(to, otp) {
  const deliveryMode = getEmailDeliveryMode();

  if (deliveryMode === 'console') {
    console.warn(`Email delivery is in console mode. OTP for ${to}: ${otp}`);
    return { deliveryMode };
  }

  if (deliveryMode !== 'smtp') {
    throw ApiError.internal(`Unsupported email delivery mode: ${deliveryMode}`);
  }

  if (!isSmtpConfigured()) {
    throw ApiError.internal('Email OTP delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: 'Your Stackly verification code',
    text: `Your Stackly verification code is ${otp}. It expires in 60 seconds.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Stackly verification code</h2>
        <p style="margin: 0 0 16px;">Use this code to verify your email address:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 0 0 16px;">${otp}</p>
        <p style="margin: 0; color: #4b5563;">This code expires in 60 seconds.</p>
      </div>
    `,
  });

  return { deliveryMode, messageId: info.messageId };
}

module.exports = { sendOtpEmail };
