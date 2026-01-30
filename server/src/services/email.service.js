import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    console.log('📧 [RESET] Sending password reset code to:', email);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 Password Reset Code - ResumeATS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the code below to proceed:</p>
          
          <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px;">
              ${resetCode}
            </div>
          </div>
          
          <p style="color: #6b7280;">
            <strong>This code expires in 15 minutes.</strong>
          </p>
          
          <p style="color: #6b7280;">
            If you didn't request a password reset, you can safely ignore this email. Your account will remain secure.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            ResumeATS - Career Tool<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
    });
    
    console.log('✅ [RESET] Password reset email sent successfully to:', email);
    return { success: true };
  } catch (err) {
    console.error('❌ [RESET] Failed to send reset email:', err.message);
    throw new Error('Failed to send password reset email');
  }
};

export const sendPasswordChangeConfirmation = async (email) => {
  try {
    console.log('📧 [RESET] Sending password change confirmation to:', email);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '✅ Password Changed Successfully - ResumeATS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Password Changed Successfully</h2>
          
          <p>Your password has been successfully updated.</p>
          
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 24px 0;">
            <p style="margin: 0; color: #065f46;">
              ✅ You can now login with your new password.
            </p>
          </div>
          
          <p style="color: #6b7280;">
            <strong>Security tip:</strong> Never share your password with anyone.
          </p>
          
          <p style="color: #6b7280;">
            If you didn't make this change or believe your account has been compromised, 
            please reset your password immediately.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            ResumeATS - Career Tool<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
    });
    
    console.log('✅ [RESET] Confirmation email sent successfully to:', email);
    return { success: true };
  } catch (err) {
    console.error('❌ [RESET] Failed to send confirmation email:', err.message);
    throw new Error('Failed to send confirmation email');
  }
};
