const nodemailer = require('nodemailer');

const sendMail = async (to, subject, text, html = null) => {
    let transporter;

    // Check if SMTP credentials are provided in environment
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use real SMTP (Gmail or other)
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('📧 Using configured SMTP service');
    } else {
        // Use Ethereal for testing if no real credentials provided
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('📧 Using Ethereal test email service');
    }

    // Send mail with defined transport object
    try {
        let info = await transporter.sendMail({
            from: process.env.SMTP_USER || '"SwahiliPot Hub" <noreply@swahilipothub.co.ke>',
            to: to,
            subject: subject,
            text: text,
            html: html || `<div style="font-family: Arial, sans-serif; padding: 20px;">${text}</div>`,
        });

        console.log("✅ Message sent: %s", info.messageId);

        // Preview only available when sending through an Ethereal account
        if (!process.env.SMTP_USER) {
            console.log("📬 Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = sendMail;
