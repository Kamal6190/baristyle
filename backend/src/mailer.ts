import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  resetToken: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'BariStyle <noreply@baristyle.de>',
    to: toEmail,
    subject: 'Reset Your BariStyle Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Reset Password</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:#111625;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
                      Bari<span style="color:#10b981;">Style</span>
                    </h1>
                    <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">Luxury Fragrance Wholesale</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">Hello, <strong style="color:#111625;">${userName}</strong></p>
                    <h2 style="color:#111625;font-size:20px;font-weight:700;margin:0 0 16px;">Password Reset Request</h2>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 32px;">
                      We received a request to reset your password for your BariStyle account.
                      Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
                    </p>
                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${resetLink}"
                        style="display:inline-block;background:#111625;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                        Reset My Password
                      </a>
                    </div>
                    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
                      If you did not request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
                    <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">
                      This link expires in 1 hour &nbsp;·&nbsp; BariStyle GmbH &nbsp;·&nbsp; baristyle.de
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};
