import express from 'express';
import passport from 'passport';
import sessionscontroller from '../controllers/sessions.controller.js';

const SessionsController = new sessionscontroller();

const router = express.Router();

router.get("/current", SessionsController.controllerCurrent);

router.post("/register", passport.authenticate("register", { failureRedirect: "/api/sessions/failregister" }), SessionsController.controllerRegister);

router.get("/failregister", SessionsController.controllerFailRegister);

router.post("/login", passport.authenticate("login", { failureRedirect: "/api/sessions/faillogin" }), SessionsController.controllerLogin);

router.get("/faillogin", SessionsController.controllerFailLogin);

router.post("/logout", SessionsController.controllerLogout);

export default router;