import UsersModel from '../models/users.schema.js';
import { cartsService, productsService } from '../../repositories/index.js';
import UsersDataDTO from '../dtos/usersData.dto.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import __dirname from '../../utils/utils.js';

class Users {
    post = async(user) => {
        try {
            const newUser = new UsersModel(user);
            const savedUser = await newUser.save();
            return savedUser;
        } catch (error) {
            throw error;
        }
    }

    getOne = async(email) => {
        try {
            const user = await UsersModel.findOne({ email });
            return user;
        } catch (error) {
            throw error;
        }
    }

    putPassword = async (email, newPasswordHashed) => {
        try {
          const user = await UsersModel.findOne({ email });      
          user.password = newPasswordHashed;
          await user.save();
      
          return { message: 'Password updated successfully' };
        } catch (error) {
          throw error;
        }
    }

    putRole = async (email, newRole) => {
        try {
          const user = await UsersModel.findOne({ email });
          user.role = newRole;
          await user.save();
      
          return { message: 'Role updated successfully' };
        } catch (error) {
          throw error;
        }
    }

    dateupdate = async (email) => {
        try {
            const user = await UsersModel.findOne({ email });
            user.last_connection = Date.now();
            await user.save();
            return { message: 'last_connection updated successfully' };
        } catch (error) {
            throw error;
        }
    }

    putdocs = async (email, documentType) => {
        try {
            const user = await UsersModel.findOne({ email });
    
            if (!user) {
                throw new Error('User not found');
            }
    
            const existingDocumentIndex = user.documents.findIndex(doc => doc.name.includes(documentType));
    
            if (existingDocumentIndex !== -1) {
                user.documents.splice(existingDocumentIndex, 1);
            }
    
            user.documents.push({
                name: `${user.email}-${documentType}.pdf`,
                reference: `/public/documents/${documentType}/${user.email}-${documentType}.pdf`
            });
    
            await user.save();
    
            return { message: 'Documents updated successfully' };
        } catch (error) {
            throw error;
        }
    }   

    get = async () => {
        try {
            const users = await UsersModel.find({ role: { $ne: 'admin' } }, 'first_name last_name age email cart role last_connection');
            const transformedUsers = users.map(user => new UsersDataDTO(user));
            return transformedUsers;
        } catch (error) {
            throw error;
        }
    }

    delete = async (emails, date) => {
        try {
            let usersToDelete = [];
            if (date) {
                usersToDelete = await UsersModel.find({
                    role: { $ne: 'admin' },
                    last_connection: { $lt: new Date(date) }
                });
            } else if (emails.length > 0) {
                usersToDelete = await UsersModel.find({
                    email: { $in: emails },
                    role: { $ne: 'admin' }
                });
            } else {
                throw new Error('No se proporcionaron correos electrónicos ni fecha.');
            }

            for (const user of usersToDelete) {
                const userProductsResponse = await productsService.getByOwner(user.email);

                await cartsService.deleteProductsFromAllCarts(userProductsResponse.products)

                await productsService.deleteMany(userProductsResponse.products)

                await cartsService.removeCart(`${user.email}_cart`)

                for (const doc of user.documents) {
                    const docPath = path.join(__dirname, "../../", doc.reference);
                    logger.debug(docPath)
                    if (fs.existsSync(docPath)) {
                        await fs.promises.unlink(docPath)
                    }
                }

                await UsersModel.findOneAndDelete({ email: user.email })
            }

            if (date) {
                const result = await UsersModel.deleteMany({
                    role: { $ne: 'admin' },
                    last_connection: { $lt: new Date(date) }
                });
                logger.info(`Se eliminaron ${result.deletedCount} usuarios inactivos.`);
                return { message: `Se eliminaron ${result.deletedCount} usuarios inactivos.` };
            }

            logger.info(`Se eliminaron ${usersToDelete.length} usuarios por criterio de emails ingresados.`);
            return { message: `Se eliminaron ${usersToDelete.length} usuarios por criterio de emails ingresados.`, result: usersToDelete };
        } catch (error) {
            logger.error('Error eliminando usuarios:', error);
            throw error;
        }

    }
}

export default Users;