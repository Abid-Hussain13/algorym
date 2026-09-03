import { Request, Response } from 'express';

import { verifyEmail, generateVerificationToken } from '../services/emailVerification.service.js';

export const verifyEmailHandler = async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }

    await verifyEmail(token);

    res.json({ success: true, message: 'Email verified successfully' });
};

export const resendVerification = async (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string };

    if (!user?.id || !user?.email) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    await generateVerificationToken(user.id, user.email);

    res.json({ success: true, message: 'Verification email sent' });
};
