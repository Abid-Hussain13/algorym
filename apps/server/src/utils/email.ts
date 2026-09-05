import { Resend } from 'resend'
import { getVerificationEmail, getPasswordResetEmail } from './email-templates/index.js'

function getResendClient() {
    return new Resend(process.env.RESEND_API_KEY)
}

interface SendEmailOptions {
    to: string
    subject: string
    html: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
    const resend = getResendClient()
    const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Algorym <noreply@algorym.com>',
        to,
        subject,
        html,
    })

    if (error) {
        console.error('Resend error:', error)
        throw new Error(error.message || 'Failed to send email')
    }
}

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
    const template = getVerificationEmail({
        name: '',
        token,
        clientUrl: process.env.CLIENT_URL!,
    })

    await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
    })
}

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
    const template = getPasswordResetEmail({
        name: '',
        token,
        clientUrl: process.env.CLIENT_URL!,
    })

    await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
    })
}
