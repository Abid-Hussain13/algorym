import { Request, Response } from 'express';

import { generateResetToken, resetPassword } from '../services/passwordReset.service.js';

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    await generateResetToken(email);

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent' });
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await resetPassword(token, password);

    res.json({ success: true, message: 'Password has been reset successfully' });
};
