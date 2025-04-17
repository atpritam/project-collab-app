import nodemailer from "nodemailer";

// This file contains the email sending functionality using Nodemailer and SendGrid.

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
    debug: true,
    logger: true,
  });
}

// password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const transporter = createTransporter();

  // reset URL
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Nudge" <nudge-collab@outlook.com>',
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// account deletion verification email
export async function sendDeleteVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: '"Nudge" <nudge-collab@outlook.com>',
    to: email,
    subject: "Account Deletion Verification",
    text: `You have requested to delete your account. Please use the following verification code to confirm: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email and secure your account.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Deletion Verification</h2>
        <p>You have requested to delete your account. Please use the following verification code to confirm:</p>
        <div style="padding: 16px; background-color: #f3f4f6; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border-radius: 5px;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email and secure your account.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
