import express from 'express';
import { privateRouteAuth } from './middlewares/privateRouteAuth.middleware.js'
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import viewscontroller from '../controllers/views.controller.js';

const ViewsController = new viewscontroller();

const router = express.Router();

router.get("/register", privateRouteAuth, ViewsController.controllerRenderRegister);

router.get("/login", privateRouteAuth, ViewsController.controllerRenderLogin);

router.get("/profile", publicRouteAuth, ViewsController.controllerRenderProfile);

router.get('/password-reset', ViewsController.controllerRenderReset);

export default router;