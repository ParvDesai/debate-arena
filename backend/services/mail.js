const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, username, code) => {
    // 1. Check if Resend API Key is configured (Best for production / Render HTTPS)
    if (process.env.RESEND_API_KEY) {
        try {
            const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: email,
                    subject: 'Verify Your Debate Arena Account 🏛️',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 40px;">🏛️</span>
                                <h1 style="color: #7c3aed; margin-top: 10px;">DEBATE ARENA</h1>
                            </div>
                            <p style="font-size: 16px; color: #334155;">Hello <strong>${username}</strong>,</p>
                            <p style="font-size: 16px; color: #334155;">Welcome to the battlefield of ideas! Please confirm your email address to claim your seat in the arena.</p>
                            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
                                <span style="font-size: 14px; color: #64748b; letter-spacing: 1px; display: block; margin-bottom: 8px;">YOUR VERIFICATION CODE</span>
                                <strong style="font-size: 32px; color: #0f172a; letter-spacing: 4px;">${code}</strong>
                            </div>
                            <p style="font-size: 14px; color: #64748b;">This verification code will expire in 15 minutes.</p>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                            <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not sign up for an account, you can safely ignore this email.</p>
                        </div>
                    `
                })
            });

            if (response.ok) {
                return true;
            } else {
                const errorData = await response.json();
                console.error('Resend API returned an error:', errorData);
            }
        } catch (err) {
            console.error('Failed to send verification email via Resend API:', err.message);
        }
    }

    // 2. Check if SMTP configuration is set (Alternate production/local SMTP)
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    if (hasSmtpConfig) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: process.env.SMTP_FROM || '"Debate Arena" <noreply@debatearena.com>',
                to: email,
                subject: 'Verify Your Debate Arena Account 🏛️',
                text: `Hello ${username},\n\nWelcome to the Debate Arena! Verify your account by entering the code below:\n\nVerification Code: ${code}\n\nThis code will expire in 15 minutes.\n\nProve your worth on the battlefield of ideas!\n`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 40px;">🏛️</span>
                            <h1 style="color: #7c3aed; margin-top: 10px;">DEBATE ARENA</h1>
                        </div>
                        <p style="font-size: 16px; color: #334155;">Hello <strong>${username}</strong>,</p>
                        <p style="font-size: 16px; color: #334155;">Welcome to the battlefield of ideas! Please confirm your email address to claim your seat in the arena.</p>
                        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 14px; color: #64748b; letter-spacing: 1px; display: block; margin-bottom: 8px;">YOUR VERIFICATION CODE</span>
                            <strong style="font-size: 32px; color: #0f172a; letter-spacing: 4px;">${code}</strong>
                        </div>
                        <p style="font-size: 14px; color: #64748b;">This verification code will expire in 15 minutes.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not sign up for an account, you can safely ignore this email.</p>
                    </div>
                `,
            };

            await transporter.sendMail(mailOptions);
            return true;
        } catch (err) {
            console.error('Failed to send verification email via SMTP:', err.message);
        }
    }

    // 3. Fallback to console output logging (Local development fallback)
    console.log('\n=============================================================');
    console.log(`✉️  [DEVELOPMENT EMAIL FALLBACK]`);
    console.log(`To: ${email} (${username})`);
    console.log(`Subject: Verify Your Debate Arena Account`);
    console.log(`Verification Code: ${code}`);
    console.log(`This code will expire in 15 minutes.`);
    console.log('=============================================================\n');
    return true;
};

module.exports = { sendVerificationEmail };
