const nodemailer = require('nodemailer');

const sendMail = async (to, subject, text) => {
    // Use Ethereal for testing if no real credentials provided
    let testAccount = await nodemailer.createTestAccount();

    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Auth System" <foo@example.com>', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: `<b>${text}</b>`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

module.exports = sendMail;
