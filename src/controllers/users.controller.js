import { usersService } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import upload from '../routes/middlewares/upload.middleware.js';
import config from '../config/config.js';
import transporter from '../utils/email.js';

export default class userscontroller {
    /* Si bien en las ppt dice que el endpoint debería ser "api/users/premium/:id", yo consideré
    que es mucho más seguro obtener el id desde la sesión propia, sin que el usuario deba ingresar 
    su propio id. Esto con el objetivo de que el usuario solo pueda modificar su propio rol, ya que 
    con saber el email o el id de cualquier usuario, un usuario cualquiera podría modificar un rol 
    ajeno con simplemente acceder a este endpoint por la URL. Para actualizar el rol de otro usuario
    específico, usé el endpoint "/admin-forced-role-change", que está resguardado por el
    middleware autenticador para que solo pueda acceder un admin */
    controllerChangeRole = async (req, res) => {
        try {
            const userSession = req.session.user
            const user = await usersService.findUserByEmail(userSession.email)
        
            if (user.role === "premium") {
                await usersService.updateUserRole(user.email,"user")
                req.session.user.role = "user"
                logger.debug(req.session.user.role)
            
                return res.send(
                    `<html>
                        <body>
                            <center>
                                <h4>Role cambiado a user</h4>
                                <h4><a href="${config.railwayUrl}">Volver al menu</a></h4>
                            </center>
                        </body>
                    </html>`
                )
            };
        
            const requiredDocuments = [
                { name: `${user.email}-identificacion.pdf`, reference: `/public/documents/identificacion/${user.email}-identificacion.pdf` },
                { name: `${user.email}-comprobante-de-domicilio.pdf`, reference: `/public/documents/comprobante-de-domicilio/${user.email}-comprobante-de-domicilio.pdf` },
                { name: `${user.email}-comprobante-de-estado-de-cuenta.pdf`, reference: `/public/documents/comprobante-de-estado-de-cuenta/${user.email}-comprobante-de-estado-de-cuenta.pdf` }
            ];
        
            if (user.documents.length < 3) return res.send(
                `<html>
                    <body>
                        <center>
                            <h3>Para procesar tu solicitud de cuenta premium necesitamos que cargues todos los datos requeridos</h3>
                            <p>Datos cargados:</p>
                            <ul>
                                ${user.documents.map(doc => `<li>${doc.name}</li>`).join('')}
                            </ul>
                            <a href="${config.railwayUrl}/api/users/upload-documents">Cargar datos personales</a>
                            <a href="${config.railwayUrl}">Volver al menu</a>
                        </center>
                    </body>
                </html>`
            );
        
            for (const requiredDoc of requiredDocuments) {
                const exists = user.documents.some(doc => doc.name === requiredDoc.name && doc.reference === requiredDoc.reference);
                if (!exists) {
                    return res.send(
                        `<html>
                            <body>
                                <center>
                                    <h3>Para procesar tu solicitud de cuenta premium necesitamos que cargues todos los datos requeridos</h3>
                                    <p>Datos cargados:</p>
                                    <ul>
                                        ${user.documents.map(doc => `<li>${doc.name}</li>`).join('')}
                                    </ul>
                                    <a href="${config.railwayUrl}/api/users/upload-documents">Cargar datos personales</a>
                                    <a href="${config.railwayUrl}">Volver al menu</a>
                                </center>
                            </body>
                        </html>`
                    );
                }
            }
        
            if (user.role === "user") {
                const result = await usersService.updateUserRole(user.email,"premium")
                req.session.user.role = "premium"
                logger.debug(req.session.user.role)
            
                return res.send(
                    `<html>
                        <body>
                            <center>
                                <h4>Role cambiado a premium</h4>
                                <h4><a href="${config.railwayUrl}">Volver al menu</a></h4>
                            </center>
                        </body>
                    </html>`
                )
            };
        
            if (user.role !== "user" && user.role !== "premium") return res.send("No deberías poder cambiar tu rol ¿Cómo llegaste aquí?")
            
        } catch (error) {
            logger.error("Error en /premium endpoint", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
    controllerRenderUploadDocuments = async (req, res) => {
        try {
            const user = req.session.user
            if (user.role === "premium") return res.redirect(`${config.railwayUrl}/api/users/premium`)
            res.render('upload-documents', { user });
        } catch (error) {
            logger.error("Error en get /upload-documents endpoint", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
    controllerUploadDocuments = async (req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
        
            try {
                const user = req.session.user;
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
            
                const documents = {};
            
                if (req.files['identificacion']) {
                    documents.identificacion = req.files['identificacion'][0].filename;
                    await usersService.updateUserDocuments(user.email,'identificacion');
                }
                if (req.files['comprobante-de-domicilio']) {
                    documents.comprobanteDeDomicilio = req.files['comprobante-de-domicilio'][0].filename;
                    await usersService.updateUserDocuments(user.email,'comprobante-de-domicilio');
                }
                if (req.files['comprobante-de-estado-de-cuenta']) {
                    documents.comprobanteDeEstadoDeCuenta = req.files['comprobante-de-estado-de-cuenta'][0].filename;
                    await usersService.updateUserDocuments(user.email,'comprobante-de-estado-de-cuenta');
                }
            
                res.send(
                    `<html>
                        <body>
                            <center>
                                <a href="${config.railwayUrl}">Volver al menu</a><br>
                                <a href="${config.railwayUrl}/api/users/upload-documents">Cargar más datos personales</a><br>
                                <a href="${config.railwayUrl}/api/users/premium">Solicitar cuenta premium</a>
                            </center>
                        </body>
                    </html>`
                );
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    };
    
    controllerGetUsers = async (req, res) => {
        try {
            const users = await usersService.getAllUsers();
            logger.debug(users)
            res.render('users', { users });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
    controllerDeleteUsersByDate = async (req, res) => {
        try {
            const { date } = req.body;
            if (!date) {
                return res.status(400).json({ error: 'Fecha requerida' });
            }
            logger.debug(date)
            await usersService.deleteUsersMasterFunction([], date)
            res.redirect("/api/users");
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
    controllerAdminForcedRoleChange = async (req, res) => {
        try {
            const { email } = req.body
        
            const user = await usersService.findUserByEmail(email)
        
            if (user.role === "premium") {
                const result = await usersService.updateUserRole(user.email,"user")
                return res.redirect("/api/users");
            };
        
            if (user.role === "user") {
                const result = await usersService.updateUserRole(email,"premium")
                return res.redirect("/api/users");
            };
                
            res.redirect("/api/users");
        } catch (error) {
            logger.error("Error en /admin-forced-role-change endpoint", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
    controllerAdminForcedUserDelete = async (req, res) => {
        try {
            const { email } = req.body
            logger.debug(email)    
            const response = await usersService.deleteUsersMasterFunction([email], undefined);
            const deletedUsers = response.result
            // Incluí un mensaje de aclaración porque me di cuenta de que le estaba llenando la casilla de correos al dueño de test@gmail.com
            for (const user of deletedUsers){
                await transporter.sendMail({
                    from: `Coder Tests ${config.informativeEmail}`,
                    to: user.email,
                    subject: `Su cuenta de Matias Delorenzini Ecommerce fue eliminada`,
                    html: `
                    <h1>Notificación de eliminación de cuenta</h1>
                    <p>Estimado ${user.first_name}, tu cuenta, junto con cualquier dato relacionado a ella, fueron eliminados por nuestra administración.</p>
                    <br>
                    <h1>Este email fue enviado a una cuenta aleatoria (que de casualidad fue la tuya), y forma parte de un proyecto de programación, sin ningún tipo de objetivo malicioso, que le envía correos a correos electrónicos aleatórios 😊 Si lo recibiste, fue por pura casualidad, solo ignóralo. Disculpa las molestias</h1>
                    <br>
                    <h1>This email was sent to a random account (it happened to be yours by chance) as part of a programming project, without any type of malicious intents, which sends emails to random accounts 😊 If you received it, it was purely by chance, just ignore it. Sorry for the inconveniences</h1>`,
                    attachments: []
                });
            }
            res.redirect("/api/users");
        } catch (error) {
            logger.error("Error en /admin-forced-user-delete", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};