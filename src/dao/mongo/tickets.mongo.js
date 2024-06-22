import TicketsModel from "../models/ticket.schema.js";
import { logger } from "../../utils/logger.js";

class Tickets {
    post = async (ticket) => {
        if (!ticket) return { success: false, message: 'TICKET_CREATE_MISSING_ARGUMENTS' };
        try {
            const newTicket = new TicketsModel(ticket);
            const savedTicket = await newTicket.save();
            return savedTicket;
        } catch (error) {
            logger.error('Error al crear el ticket:', error.message);
            return { success: false, message: 'TICKET_CREATE_ERROR' };
        }
    }

    getOne = async (code) => {
        if (!code) return { success: false, message: 'TICKET_SEARCH_MISSING_ARGUMENTS' };
        try {
            const ticket = await TicketsModel.findOne({ code: code });
            if (!ticket) return { success: false, message: 'TICKET_NOT_FOUND' };
            return ticket;
        } catch (error) {
            logger.error('Error al obtener los datos del ticket:', error.message);
            return { success: false, message: 'TICKET_SEARCH_ERROR' };
        }
    }
}

export default Tickets;
