import express from 'express';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import { authorize } from './middlewares/authorize.middleware.js';
import cartscontroller from '../controllers/carts.controller.js';

const CartsController = new cartscontroller();

const router = express.Router();

router.put('/addToCart', publicRouteAuth, authorize(["user", "premium"]), CartsController.controllerAddProductToCart);

router.get('/', publicRouteAuth, authorize(["user", "premium"]), CartsController.controllerGetCart);

router.post('/increase-quantity', publicRouteAuth, authorize(["user", "premium"]), CartsController.controllerIncreaseProductQuantity);

router.delete("/clear", publicRouteAuth, authorize(["user", "premium"]), CartsController.controllerClearCart);

router.delete("/removeProduct/:productId", publicRouteAuth, authorize(["user", "premium"]), CartsController.controllerRemoveProductFromCart);

router.post('/purchase', publicRouteAuth, authorize(["user", "premium"]), CartsController.controllerPurchase);

export default router;