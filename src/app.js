import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";

import initializePassport from "./config/passport.config.js";
import config from "./config/config.js";

import { engine } from 'express-handlebars';
import { errorHandler } from './services/errors/errorHandler.js';
import { addLogger } from "./utils/logger.js";
import { logger } from "./utils/logger.js";

import cartsRouter from './routes/carts.routes.js';
import productsRouter from './routes/products.routes.js';
import resetRouter from './routes/resetpassword.routes.js'
import sessionsRouter from './routes/sessions.routes.js';
import usersRouter from './routes/users.routes.js';
import viewsRouter from './routes/views.routes.js';

const app = express();

app.use(addLogger);

mongoose.connect(config.mongoUrl);

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    store: MongoStore.create({
        mongoUrl: config.mongoUrl,
    }),
    secret: "asd3ñc3okasod",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/cart', cartsRouter);
app.use('/api/products', productsRouter);
app.use('/api/reset', resetRouter)
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter)
app.use('/', viewsRouter);

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'src/views');

app.get("/", (req, res) => {
    res.redirect(`/login`);
});

app.use(errorHandler);

app.listen(config.port, () => logger.info(`Listening on PORT: ${config.port}`));