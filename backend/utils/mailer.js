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

const sendResetPasswordEmail = async (email, otp) => {
  const mailOptions = {
    from: `"NexCart Support" <${process.env.SMTP_USER || 'no-reply@nexcart.com'}>`,
    to: email,
    subject: 'NexCart Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366F1; margin: 0;">NexCart</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Password Reset Request</p>
        </div>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #4b5563; margin-top: 0;">You requested to reset your password. Please use the verification code below to reset it. This code is valid for 10 minutes.</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #111827; margin: 10px 0; font-weight: 800;">${otp}</h1>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n----------------------------------------');
    console.log(`[MOCK EMAIL SERVICE] To: ${email}`);
    console.log(`[MOCK EMAIL SERVICE] Reset Password OTP: ${otp}`);
    console.log('To send real emails, set SMTP_USER and SMTP_PASS in backend/.env');
    console.log('----------------------------------------\n');
    return true;
  }

  return transporter.sendMail(mailOptions);
};

const sendOrderSuccessEmail = async (email, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image_url}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: contain; margin-right: 10px; vertical-align: middle; border-radius: 4px;" />
        <span style="font-size: 14px; font-weight: 600; color: #374151; vertical-align: middle;">${item.title}</span>
      </td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-size: 14px; color: #6b7280;">x${item.quantity}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600; color: #374151;">₹${(item.price_at_purchase || item.price) * item.quantity}</td>
    </tr>
  `).join('');

  const shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

  const mailOptions = {
    from: `"NexCart Store" <${process.env.SMTP_USER || 'orders@nexcart.com'}>`,
    to: email,
    subject: `Your NexCart Order Confirmation - #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #6366F1; margin: 0; font-size: 28px; font-weight: 800;">NexCart</h2>
          <p style="color: #10b981; font-size: 16px; margin: 5px 0 0 0; font-weight: 750;">Order Placed Successfully!</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Hi,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Thank you for your order! We are preparing it for shipment. Here are your order details:</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Order ID: <strong style="color: #111827;">#${order.id}</strong></p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Payment Method: <strong style="color: #111827;">${order.payment_method || 'Card/UPI'}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Delivery Address: <strong style="color: #111827;">${shipping.address}, ${shipping.city}, ${shipping.postal_code || shipping.zip}</strong></p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; font-size: 13px; color: #4b5563;">Item</th>
              <th style="padding: 10px; text-align: center; font-size: 13px; color: #4b5563;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: 13px; color: #4b5563;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="width: 50%; margin-left: auto; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span style="font-weight: 600; color: #374151;">₹${order.total_price}</span>
          </div>
          ${order.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #ef4444; margin-bottom: 5px;">
            <span>Discount:</span>
            <span style="font-weight: 600;">-₹${order.discount}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 1px solid #e5e7eb; padding-top: 5px; color: #111827;">
            <span>Grand Total:</span>
            <span>₹${order.final_price}</span>
          </div>
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          If you have any questions, reply to this email or contact support.
        </p>
      </div>
    `
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n----------------------------------------');
    console.log(`[MOCK EMAIL SERVICE] To: ${email}`);
    console.log(`[MOCK EMAIL SERVICE] Order Confirmation: #${order.id}`);
    console.log(`[MOCK EMAIL SERVICE] Items Count: ${order.items.length}`);
    console.log(`[MOCK EMAIL SERVICE] Final Price: ₹${order.final_price}`);
    console.log('To send real emails, set SMTP_USER and SMTP_PASS in backend/.env');
    console.log('----------------------------------------\n');
    return true;
  }

  return transporter.sendMail(mailOptions);
};

const sendOrderStatusEmail = async (email, order) => {
  const statusInfo = {
    pending: { color: '#f59e0b', text: 'Order is Pending' },
    confirmed: { color: '#6366F1', text: 'Order Confirmed!' },
    processing: { color: '#3b82f6', text: 'Order is being Processed' },
    shipped: { color: '#8b5cf6', text: 'Order Shipped!' },
    delivered: { color: '#10b981', text: 'Order Delivered!' },
    cancelled: { color: '#ef4444', text: 'Order Cancelled' }
  };

  const currentStatus = order.status || 'pending';
  const info = statusInfo[currentStatus] || { color: '#6b7280', text: `Order Status: ${currentStatus}` };

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image_url}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: contain; margin-right: 10px; vertical-align: middle; border-radius: 4px;" />
        <span style="font-size: 14px; font-weight: 600; color: #374151; vertical-align: middle;">${item.title}</span>
      </td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-size: 14px; color: #6b7280;">x${item.quantity}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600; color: #374151;">₹${(item.price_at_purchase || item.price) * item.quantity}</td>
    </tr>
  `).join('');

  const shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

  const mailOptions = {
    from: `"NexCart Store" <${process.env.SMTP_USER || 'orders@nexcart.com'}>`,
    to: email,
    subject: `Update on NexCart Order #${order.id} - ${info.text}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #6366F1; margin: 0; font-size: 28px; font-weight: 800;">NexCart</h2>
          <p style="color: ${info.color}; font-size: 18px; margin: 5px 0 0 0; font-weight: 750;">${info.text}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Hi,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">The status of your order <strong>#${order.id}</strong> has been updated to <strong>${currentStatus.toUpperCase()}</strong>.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Order ID: <strong style="color: #111827;">#${order.id}</strong></p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Status: <strong style="color: ${info.color};">${currentStatus.toUpperCase()}</strong></p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Payment Method: <strong style="color: #111827;">${order.payment_method || 'Card/UPI'}</strong></p>
            ${shipping ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Delivery Address: <strong style="color: #111827;">${shipping.address}, ${shipping.city}, ${shipping.postal_code || shipping.zip}</strong></p>` : ''}
          </div>
        </div>

        ${order.items && order.items.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; font-size: 13px; color: #4b5563;">Item</th>
              <th style="padding: 10px; text-align: center; font-size: 13px; color: #4b5563;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: 13px; color: #4b5563;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        ` : ''}

        <div style="width: 50%; margin-left: auto; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span style="font-weight: 600; color: #374151;">₹${order.total_price}</span>
          </div>
          ${order.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #ef4444; margin-bottom: 5px;">
            <span>Discount:</span>
            <span style="font-weight: 600;">-₹${order.discount}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 1px solid #e5e7eb; padding-top: 5px; color: #111827;">
            <span>Grand Total:</span>
            <span>₹${order.final_price}</span>
          </div>
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          If you have any questions, reply to this email or contact support.
        </p>
      </div>
    `
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n----------------------------------------');
    console.log(`[MOCK EMAIL SERVICE] To: ${email}`);
    console.log(`[MOCK EMAIL SERVICE] Order Status Update: #${order.id} -> ${currentStatus.toUpperCase()}`);
    if (order.items) console.log(`[MOCK EMAIL SERVICE] Items Count: ${order.items.length}`);
    console.log(`[MOCK EMAIL SERVICE] Final Price: ₹${order.final_price}`);
    console.log('To send real emails, set SMTP_USER and SMTP_PASS in backend/.env');
    console.log('----------------------------------------\n');
    return true;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendResetPasswordEmail, sendOrderSuccessEmail, sendOrderStatusEmail };
