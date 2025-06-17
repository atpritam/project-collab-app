import { Resend } from "resend";

const resendAPIKey = process.env.RESEND_API_KEY;
if (!resendAPIKey) {
  throw new Error("RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendAPIKey);

const FROM_EMAIL = "Nudge <noreply@pritam.studio>";

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`;
  const subject = "Password Reset Request";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject,
    text: `Your password reset link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If the button doesn't work, copy and paste this link: ${resetUrl}</p>
      </div>
    `,
  });
}

export async function sendDeleteVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  const subject = "Account Deletion Verification";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject,
    text: `Your account deletion code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Deletion Verification</h2>
        <p>Use the following code to confirm deletion:</p>
        <div style="padding:16px;background:#f3f4f6;text-align:center;font-size:24px;font-weight:bold;letter-spacing:3px;border-radius:5px;margin:20px 0;">${code}</div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  verificationCode: string
): Promise<void> {
  const verificationUrl = `${BASE_URL}/auth/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`;
  const subject = "Email Verification";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject,
    text: `Verify your email: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Nudge!</h2>
        <p>Please verify your email address:</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If the button doesn't work, copy and paste this link: ${verificationUrl}</p>
      </div>
    `,
  });
}

export async function sendProjectInvitationEmail(
  email: string,
  token: string,
  projectName: string,
  inviterName: string
): Promise<void> {
  const invitationUrl = `${BASE_URL}/invitations/accept?token=${token}`;
  const subject = `Invitation to join the "${projectName}" project`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject,
    text: `${inviterName} invited you to join "${projectName}" on Nudge. Accept here: ${invitationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Project Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on Nudge.</p>
        <a href="${invitationUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Accept Invitation</a>
        <p>This invitation will expire in 24 hours.</p>
        <p>If the button doesn't work, use this link: ${invitationUrl}</p>
      </div>
    `,
  });
}
