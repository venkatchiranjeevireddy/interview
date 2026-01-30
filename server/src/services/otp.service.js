import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const otpStore = new Map();

export const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  console.log('📨 [OTP] Generated OTP');
  return otp;
};

export const storeOtp = (email, otp) => {
  const expiresAt = Date.now() + parseInt(process.env.OTP_EXPIRY || 10) * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });
  console.log('💾 [OTP] Stored OTP for:', email, '| Expires in:', process.env.OTP_EXPIRY || 10, 'minutes');
};

export const verifyOtp = (email, otp) => {
  console.log('✔️  [OTP] Verifying OTP for:', email);
  const record = otpStore.get(email);
  if (!record) {
    console.error('❌ [OTP] OTP not found for:', email);
    return { valid: false, message: 'OTP not found' };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    console.error('❌ [OTP] OTP expired for:', email);
    return { valid: false, message: 'OTP expired' };
  }
  if (record.otp !== otp) {
    console.error('❌ [OTP] Invalid OTP for:', email);
    return { valid: false, message: 'Invalid OTP' };
  }
  otpStore.delete(email);
  console.log('✅ [OTP] OTP verified successfully for:', email);
  return { valid: true };
};

export const sendOtpEmail = async (email, otp) => {
  try {
    console.log('📧 [OTP] Sending OTP email to:', email);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Email Verification',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in ${process.env.OTP_EXPIRY || 10} minutes.</p>
        <p>Do not share this OTP with anyone.</p>
      `,
    });
    console.log('✅ [OTP] Email sent successfully to:', email);
    return { success: true };
  } catch (err) {
    console.error('❌ [OTP] Failed to send email:', err.message);
    throw new Error('Failed to send OTP email');
  }
};
