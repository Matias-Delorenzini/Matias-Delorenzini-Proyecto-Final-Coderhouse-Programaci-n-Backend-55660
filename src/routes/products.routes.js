import express from 'express';
import { authorize } from './middlewares/authorize.middleware.js';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import productscontroller from '../controllers/products.controller.js';

const ProductsController = new productscontroller();

const router = express.Router();

router.post('/create-product', publicRouteAuth, authorize(["premium","admin"]), ProductsController.controllerCreateProduct);

router.get('/create-product', publicRouteAuth, authorize(["premium","admin"]), ProductsController.controllerRenderCreateProduct);

router.get('/delete-product/:id', publicRouteAuth, authorize(["premium", "admin"]), ProductsController.controllerDeleteProduct);

router.get('/', publicRouteAuth, ProductsController.controllerGetPaginatedProducts);

export default router;