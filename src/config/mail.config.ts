export default () => ({
    mail: {
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_user: process.env.SMTP_USER,
        smtp_pass: process.env.SMTP_PASS,
        smtp_from: process.env.SMTP_FROM,
        mail_encryption: process.env.MAIL_ENCRYPTION,
    },
});
