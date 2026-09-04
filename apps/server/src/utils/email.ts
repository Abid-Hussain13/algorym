import { Resend } from 'resend';

function getResendClient() {
    return new Resend(process.env.RESEND_API_KEY);
}

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Algorym <noreply@algorym.com>',
        to,
        subject,
        html,
    });

    if (error) {
        console.error('Resend error:', error);
        throw new Error(error.message || 'Failed to send email');
    }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await sendEmail({
        to: email,
        subject: 'Verify your Algorym account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <div style="background:#f4702c;padding:32px;text-align:center;">
                        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">Algorym</h1>
                    </div>
                    <div style="padding:32px;">
                        <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">Verify your email</h2>
                        <p style="color:#52525b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                            Thanks for signing up! Click the button below to verify your email address.
                        </p>
                        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#f4702c;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">
                            Verify Email
                        </a>
                        <p style="color:#a1a1aa;margin:24px 0 0;font-size:13px;line-height:1.6;">
                            This link expires in ${process.env.VERIFY_TOKEN_EXPIRY_HOURS || 24} hours.<br>
                            If you didn't create an account, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
    });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
        to: email,
        subject: 'Reset your Algorym password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <div style="background:#f4702c;padding:32px;text-align:center;">
                        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">Algorym</h1>
                    </div>
                    <div style="padding:32px;">
                        <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">Reset your password</h2>
                        <p style="color:#52525b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                            Click the button below to reset your password. If you didn't request this, you can safely ignore this email.
                        </p>
                        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#f4702c;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">
                            Reset Password
                        </a>
                        <p style="color:#a1a1aa;margin:24px 0 0;font-size:13px;line-height:1.6;">
                            This link expires in ${process.env.RESET_TOKEN_EXPIRY_MINUTES || 15} minutes.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
    });
};
