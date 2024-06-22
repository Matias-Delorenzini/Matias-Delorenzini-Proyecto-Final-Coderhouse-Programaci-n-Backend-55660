import dotenv from "dotenv";
    
dotenv.config();

export default {
    port:process.env.PORT,
    mongoUrl:process.env.MONGO_URL,
    adminEmail:process.env.ADMIN_EMAIL,
    adminPassword:process.env.ADMIN_PASSWORD,
    logger:process.env.LOGGER,
    informativeEmail:process.env.INFORMATIVE_EMAIL,
    informativeEmailPassword:process.env.INFORMATIVE_EMAIL_PASSWORD,
    jwtSecret:process.env.JWT_SECRET,
    jwtExpiration:process.env.JWT_EXPIRATION
}