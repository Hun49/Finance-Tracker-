import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, name: string, code: string) {
  if (!resend) {
    console.log(`[dev-email] Verification code for ${email}: ${code}`);
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Verify your Finance Tracker account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1>Your verification code</h1>
        <p>Hi ${name}, use this code to verify your Finance Tracker account:</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 8px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
