import express from 'express';
import resetcontroller from '../controllers/resetpassword.controller.js';

const ResetController = new resetcontroller();

const router = express.Router();

router.post('/', ResetController.controllerSendResetEmail);

router.get('/reset-password', ResetController.controllerRenderResetPassword);

router.post('/reset-password', ResetController.controllerResetPassword);

export default router;