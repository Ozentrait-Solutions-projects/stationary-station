const nodemailer = require('nodemailer');

// Create the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Send an OTP to user's email
 * @param {string} email 
 * @param {string} otp 
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"NexCart Support" <${process.env.SMTP_USER || 'no-reply@nexcart.com'}>`,
    to: email,
    subject: 'NexCart Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366F1; margin: 0;">NexCart</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Your Email Verification Code</p>
        </div>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #4b5563; margin-top: 0;">Please use the following verification code to complete your signup process. This code is valid for 10 minutes.</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #111827; margin: 10px 0; font-weight: 800;">${otp}</h1>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
          If you did not request this code, please ignore this email.
        </p>
      </div>
    `
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n----------------------------------------');
    console.log(`[MOCK EMAIL SERVICE] To: ${email}`);
    console.log(`[MOCK EMAIL SERVICE] OTP: ${otp}`);
    console.log('To send real emails, set SMTP_USER and SMTP_PASS in backend/.env');
    console.log('----------------------------------------\n');
    return true;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
