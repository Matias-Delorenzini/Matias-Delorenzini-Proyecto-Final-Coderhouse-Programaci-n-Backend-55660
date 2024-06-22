export default class TicketsRepository {
    constructor (dao){
        this.dao = dao;
    }

    createTicket = async (ticket) => {
        const result = await this.dao.post(ticket);
        return result;
    }    

    getTicketByCode = async (code) => {
        const result = await this.dao.getOne(code);
        return result;
    }
}