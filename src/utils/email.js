import nodemailer from 'nodemailer';
import config from '../config/config.js';

const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: config.informativeEmail,
        pass: config.informativeEmailPassword
    }
};

const transporter = nodemailer.createTransport(smtpConfig);

export default transporter;