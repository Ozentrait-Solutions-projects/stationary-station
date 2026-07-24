/**
 * Email utility helper.
 * Sends registration OTP emails through Resend.
 */

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM_NAME = 'NexCart';
const DEFAULT_TIMEOUT_MS = 15000;

class EmailDeliveryError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.status = options.status || 502;
    this.cause = options.cause;
  }
}

const isPlaceholder = (value) => {
  const normalized = (value || '').trim().toLowerCase();
  return (
    !normalized ||
    normalized.startsWith('your_') ||
    normalized.startsWith('replace_') ||
    normalized === 'placeholder'
  );
};

const allowConsoleFallback = () => process.env.EMAIL_OTP_FALLBACK_TO_CONSOLE === 'true';

const getRequestTimeoutMs = () => {
  const parsed = Number(process.env.EMAIL_REQUEST_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

const getResendConfig = () => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim();
  const fromName = (process.env.RESEND_FROM_NAME || DEFAULT_FROM_NAME).trim() || DEFAULT_FROM_NAME;

  if (isPlaceholder(apiKey)) {
    throw new EmailDeliveryError('Email service is not configured. Missing RESEND_API_KEY.', { status: 500 });
  }

  if (isPlaceholder(fromEmail)) {
    throw new EmailDeliveryError(
      'Email service is not configured. Set RESEND_FROM_EMAIL to an address on a verified Resend domain.',
      { status: 500 }
    );
  }

  if (/@resend\.dev$/i.test(fromEmail) && process.env.RESEND_ALLOW_TEST_DOMAIN !== 'true') {
    throw new EmailDeliveryError(
      'Email service is not configured for user delivery. RESEND_FROM_EMAIL must use your verified Resend domain.',
      { status: 500 }
    );
  }

  return {
    apiKey,
    from: `${fromName} <${fromEmail}>`,
  };
};

const getResendErrorMessage = (data) =>
  data?.message ||
  data?.error?.message ||
  data?.error ||
  data?.name ||
  'Resend failed to accept the email request';

const buildTextContent = (otp) => (
  `Verify your NexCart email address\n\n` +
  `Your verification code is ${otp}.\n\n` +
  `This code is valid for 10 minutes. If you did not request this email, you can ignore it.`
);

const buildHtmlContent = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Email Address</title>
</head>
<body style="margin:0;padding:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f5f7;color:#1e293b;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1),0 2px 4px -2px rgb(0 0 0 / 0.1);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;">NexCart</h1>
      <p style="color:#bfdbfe;margin:4px 0 0 0;font-size:14px;">Your Premium Stationery Store</p>
    </div>
    <div style="padding:40px 32px;text-align:center;">
      <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:16px;">Verify your Email Address</h2>
      <p style="font-size:15px;line-height:1.6;color:#475569;margin-bottom:32px;">
        Thank you for choosing NexCart. To complete your registration, enter the 6-digit verification code below.
      </p>
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;display:inline-block;min-width:250px;margin-bottom:32px;">
        <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb;display:block;padding-left:8px;">
          ${otp}
        </span>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.5;margin:0;">
        This code is valid for <strong>10 minutes</strong>. If you did not request this email, you can ignore it.
      </p>
    </div>
    <div style="background-color:#f8fafc;border-top:1px solid #f1f5f9;padding:24px;text-align:center;">
      <p style="font-size:12px;color:#94a3b8;margin:0 0 8px 0;">&copy; 2026 NexCart. All rights reserved.</p>
      <p style="font-size:11px;color:#cbd5e1;margin:0;">This is an automated message, please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const logOtpFallback = (email, otp, reason) => {
  console.warn('\n=======================================');
  console.warn('[OTP FALLBACK] Email was not sent.');
  console.warn(`Reason:      ${reason}`);
  console.warn(`Destination: ${email}`);
  console.warn(`OTP Code:    ${otp}`);
  console.warn('=======================================\n');
};

const sendOtpEmail = async (email, otp) => {
  let config;

  try {
    config = getResendConfig();
  } catch (err) {
    if (allowConsoleFallback()) {
      logOtpFallback(email, otp, err.message);
      return { provider: 'console', id: null };
    }
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getRequestTimeoutMs());

  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [email],
        subject: 'Verify your email address - NexCart',
        html: buildHtmlContent(otp),
        text: buildTextContent(otp),
        tags: [{ name: 'category', value: 'registration_otp' }],
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerMessage = getResendErrorMessage(data);
      console.error(`Resend API error (${response.status}) sending OTP to ${email}: ${providerMessage}`);

      if (allowConsoleFallback()) {
        logOtpFallback(email, otp, providerMessage);
        return { provider: 'console', id: null };
      }

      throw new EmailDeliveryError('Could not send verification email. Please try again later.');
    }

    console.log(`Email sent successfully to ${email} (Resend ID: ${data.id || 'unknown'})`);
    return { provider: 'resend', id: data.id || null };
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      throw err;
    }

    const reason = err.name === 'AbortError' ? 'Resend request timed out' : err.message;
    console.error(`Error sending OTP email to ${email}: ${reason}`);

    if (allowConsoleFallback()) {
      logOtpFallback(email, otp, reason);
      return { provider: 'console', id: null };
    }

    throw new EmailDeliveryError('Could not send verification email. Please try again later.', { cause: err });
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { sendOtpEmail, EmailDeliveryError };
