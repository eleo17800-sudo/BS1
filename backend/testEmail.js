require('dotenv').config();
const sendMail = require('./mailer');

async function testEmail() {
    console.log('Testing email service...');
    console.log('Using SMTP User:', process.env.SMTP_USER);

    try {
        // sending to the same email as seen in the previous file
        const result = await sendMail(
            'anthonymuhati52@gmail.com',
            'SwahiliPot Hub Test Email',
            'This is a verification email from the unified mailer system.',
            '<h1>SwahiliPot Hub Test</h1><p>This is a verification email from the <strong>unified mailer system</strong>.</p>'
        );

        if (result.success) {
            console.log('✅ Test email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.log('❌ Test email failed:', result.error);
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

testEmail();