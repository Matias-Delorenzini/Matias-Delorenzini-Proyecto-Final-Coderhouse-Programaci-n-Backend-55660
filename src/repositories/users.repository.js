import UsersSessionDTO from "../dao/dtos/usersSession.dto.js";
export default class UsersRepository {
    constructor (dao){
        this.dao = dao;
    }

    findUserByEmail = async (email) => {
        const result = await this.dao.getOne(email);
        return result;
    }

    createUser = async(user) => {
        const userToCreate = await this.dao.post(user);
        return userToCreate;  
    }

    createUserSession = async(user) => {
        const userSessionToCreate = new UsersSessionDTO(user);
        return userSessionToCreate;
    }

    updateUserPassword = async(email, newPasswordHashed) => {
        const result = await this.dao.putPassword(email, newPasswordHashed);
        return result;  
    }

    updateUserRole = async(email, newRole) => {
        const result = await this.dao.putRole(email, newRole);
        return result;  
    }

    updateLastConnection = async(email) => {
        const result = await this.dao.dateupdate(email);
        return result;
    }

    updateUserDocuments = async(email, documentType) => {
        const result = await this.dao.putdocs(email, documentType);
        return result;
    }

    getAllUsers = async() => {
        const result = await this.dao.get();
        return result
    }

    deleteUsersMasterFunction = async(emails, date ) => {
        const result = await this.dao.delete(emails, date );
        return result
    }
}