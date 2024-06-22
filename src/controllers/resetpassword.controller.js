import jwt from 'jsonwebtoken';
import { usersService } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import config from '../config/config.js';
import { isValidPassword, createHash } from '../utils/utils.js';
import transporter from '../utils/email.js';

export default class resetcontroller {
    controllerSendResetEmail = async (req, res) => {
        try {
            const email = req.body.email;
            logger.debug(`Email recibido: ${email}`);
            const user = await usersService.findUserByEmail(email);
            if (!user) {
                logger.info(`El email ${email} no está asociado a ninguna cuenta`);
                return res.redirect('/password-reset');
            }
            logger.debug(`Usuario encontrado: ${user.email}`);
            const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: config.jwtExpiration });
            logger.debug(`Token al ser instanciado: ${token}`)
            const resetUrl = `http://localhost:${config.port}/api/reset/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

            // Incluí un mensaje de aclaración porque me di cuenta de que le estaba llenando la casilla de correos al dueño de test@gmail.com
            await transporter.sendMail({
                from: 'Coder Tests matiasdelorenc@gmail.com',
                to: email,
                subject: `Solicitud de reestablecimiento de contraseña`,
                html: `
                <h2>¡Hola ${user.first_name}! recibimos una solicitud para cambiar tu contraseña</h2>
                <h3><a href=${resetUrl}>Si fuiste tú, cambia tu contraseña</a></h3>
                <p>Si no fuiste tú quien envió la solicitud, alguien intentó reestablecer tu contraseña. Considera tener una contraseña segura y fuerte para evitar inconvenientes a futuro</p>
                <br>
                <h1>Este email fue enviado a una cuenta aleatoria (que de casualidad fue la tuya), y forma parte de un proyecto de programación, sin ningún tipo de objetivo malicioso, que le envía correos a correos electrónicos aleatórios 😊 Si lo recibiste, fue por pura casualidad, solo ignóralo. Disculpa las molestias</h1>
                <br>
                <h1>This email was sent to a random account (it happened to be yours by chance) as part of a programming project, without any type of malicious intents, which sends emails to random accounts 😊 If you received it, it was purely by chance, just ignore it. Sorry for the inconveniences</h1>`,
                attachments: []
            });


            res.send('Correo de recuperación enviado');
        } catch (error) {
            logger.error("Error en /reset endpoint", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    controllerRenderResetPassword = async (req, res) => {
        logger.debug("SE ACCEDIÓ AL GET reset-password")
        const token = req.query.token;
        const email = req.query.email;
        logger.debug(`Token al ser recibido: ${token}`)
        logger.debug(`Email al ser recibido: ${email}`)


        if (!token) {
            return res.status(400).send('Token is missing');
        }

        jwt.verify(token, config.jwtSecret, (err, decoded) => {
            if (err) {
                return res.status(400).send(`
                <html>
                    <body>
                        <p>El enlace ha expirado</p>
                        <a href="/reset">Enviar un nuevo enlace</a>
                    </body>
                </html>
            `);        }

            res.render("reset-password", { token, email });
        });
    };

    controllerResetPassword = async (req, res) => {
        const { token, newPassword, email } = req.body;
        logger.debug(`Token cuando fue recibido la última vez: ${token}`)
        logger.debug(`Email cuando fue recibido la última vez: ${email}`)
        logger.debug(`newPassword WHEN RECEIVED LAST TIME: ${newPassword}`)

        const resetUrl = `http://localhost:${config.port}/api/reset/reset-password?token=${token}&email=${encodeURIComponent(email)}`;


        if (!token || !newPassword) return res.status(400).send('Token or new password is missing');

        const user = await usersService.findUserByEmail(email);

        const newPasswordHashed = createHash(newPassword)

        if(isValidPassword(user, newPassword)) return res.redirect(`${resetUrl}`)

        logger.debug(token)

        jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            if (err) {
                logger.error(err)
                return res.status(400).send(`
                <html>
                    <body>
                        <p>El enlace ha expirado</p>
                        <a href="/reset">Enviar un nuevo enlace</a>
                    </body>
                </html>
            `);
            }

            const { email } = decoded;
            const user = await usersService.findUserByEmail(email);
            if (!user) {
                return res.status(400).send('User not found');
            }

            if (user.password === newPassword) {
                return res.status(400).send('La nueva contraseña no debe ser la misma que la anterior');
            }

            await usersService.updateUserPassword(email, newPasswordHashed);
            res.send('<html><p>Contraseña actualizada correctamente. Puedes cerrar esta ventana</p><a href="/">volver</a></html>');
        });
    }
}