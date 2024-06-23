import { cartsService, productsService, ticketsService } from '../repositories/index.js';
import randomUniqueId from 'random-unique-id';
import { CustomError } from '../services/errors/errors.js';
import { logger } from '../utils/logger.js';
import transporter from '../utils/email.js';
import config from '../config/config.js';

export default class cartscontroller {
    controllerAddProductToCart = async (req, res, next) => {
        try {
            const { productId } = req.query;
            const response = await productsService.getProductById(productId);
            if (response.success === false) throw new CustomError(`${response.message}`);
            logger.debug(response)
            logger.debug(req.session.user.email)
            logger.debug(response)
            if (req.session.user.email === response.product.owner) {
                return res.json({ message: "No puedes añadir tu propio producto al carrito" });
            }

            const cartId = req.session.user.cart;
            const result = await cartsService.addProductToCart(cartId, productId);
            if (result.success === false && result.message === "PRODUCT_ALREADY_IN_CART") return res.json({ message: "El producto a añadir ya se encuentra en el carrito." })
            logger.info("El producto a añadir ya se encuentra en el carrito.")
            if (result.success === false) throw new CustomError(`${result.message}`);

            res.json({ message: "Producto añadido al carrito con éxito" });
        } catch (error) {
            next(error);
        }
    }

    controllerGetCart = async (req, res, next) => {
        try {
            let totalPrice = 0;
            const cartId = req.session.user.cart;
            const cartDataString = await cartsService.findCartByID(cartId);
            if (cartDataString.success === false) throw new CustomError(`${cartDataString.message}`);
            const cartDataArray = JSON.parse(cartDataString);
            const cartData = cartDataArray[0];
            const productsData = cartData.products;
            productsData.forEach(item => {
                totalPrice += item.quantity * item.product.price;
            });
            res.render('cart', { productsData, totalPrice });
        } catch (error) {
            next(error);
        }
    }

    controllerIncreaseProductQuantity = async (req, res, next) => {
        try {
            const { productId, quantityToAdd } = req.body;
            const cartId = req.session.user.cart;
            const result = await cartsService.increaseProductQuantity(cartId, productId, quantityToAdd);
            if (result.success === false) throw new CustomError(`${result.message}`);
            res.redirect("/api/cart");
        } catch (error) {
            next(error);
        }
    };

    controllerClearCart = async (req, res, next) => {
        try {
            const cartId = req.session.user.cart;
            const result = await cartsService.clearCart(cartId);
            if (result.success === false) throw new CustomError(`${result.message}`);
            res.redirect("/api/cart");
        } catch (error) {
            next(error);
        }
    };

    controllerRemoveProductFromCart = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const cartId = req.session.user.cart;
            const result = await cartsService.removeProductFromCart(cartId,productId);
            if (result.success === false) throw new CustomError(`${result.message}`);
            res.redirect("/api/cart");
        } catch (error) {
            next(error);
        }
    };

    controllerPurchase = async (req, res, next) => {
        try {
            const cartId = req.session.user.cart;
            const cartData = await cartsService.findCartByID(cartId);
            if (cartData.success === false) throw new CustomError(`${cartData.message}`);
            const cart = JSON.parse(cartData);
            const products = cart[0].products;
    
            const productsNotValidToBuy = [];
            const validProducts = [];
            let totalPrice = 0;
    

            for (const productInCart of products) {
                if (productInCart.quantity > productInCart.product.stock || productInCart.quantity < 0) {
                    productsNotValidToBuy.push(productInCart);
                } else {
                    validProducts.push(productInCart);
                    const removedProduct = await cartsService.removeProductFromCart(cartId, productInCart.product._id);
                    if (removedProduct.success === false) throw new CustomError(`${removedProduct.message}`);
                    totalPrice += productInCart.product.price * productInCart.quantity;
                    const updatedProduct = await productsService.updateStock(productInCart.product._id, productInCart.quantity);
                    if (updatedProduct.success === false) throw new CustomError(`${updatedProduct.message}`);
                }
            }
    
            if (productsNotValidToBuy.length > 0) {
                logger.info('Los siguientes productos no tienen stock suficiente o tienen cantidad negativa:', productsNotValidToBuy);
            }
    
            if (validProducts.length > 0) {
                const uniqueId = randomUniqueId();
                const code = uniqueId.id;
    
                const newTicket = {
                    code: code,
                    amount: totalPrice,
                    purchaser: req.session.user.email,
                };
                await ticketsService.createTicket(newTicket);
                const ticket = await ticketsService.getTicketByCode(newTicket.code);
                // Incluí un mensaje de aclaración porque me di cuenta de que le estaba llenando la casilla de correos al dueño de test@gmail.com
                await transporter.sendMail({
                    from: `Coder Tests ${config.informativeEmail}`,
                    to: ticket.purchaser,
                    subject: `Ticket de Compra ${ticket.code}`,
                    html: `
                    <h1>Confirmación de tu compra</h1>
                    <p>¡Hola, ${req.session.user.first_name} ${req.session.user.last_name}! Tu compra fue realizada con éxito 😁</p>
                    <h2>Información:</h2>
                    <ul>
                        <li>Código: ${ticket.code}</li>
                        <li>Importe: $ ${ticket.amount}</li>
                        <li>Comprador: ${ticket.purchaser}</li>
                        <li>Fecha de compra: ${ticket.purchase_datetime}</li>
                    </ul>
                    <br>
                    <h1>Este email fue enviado a una cuenta aleatoria (que de casualidad fue la tuya), y forma parte de un proyecto de programación sin ningún tipo de objetivo malicioso, que le envía mensajes a correos electrónicos aleatórios 😊 Si lo recibiste, fue por pura casualidad, solo ignóralo. Disculpa las molestias</h1>
                    <br>
                    <h1>This email was sent to a random account (it happened to be yours by chance) as part of a programming project without any type of malicious intents, which sends emails to random accounts 😊 If you received it, it was purely by chance, just ignore it. Sorry for the inconveniences</h1>`,
                    attachments: []
                });
                res.send(`
                    <html>
                        <h1>Confirmación de tu compra 💰</h1>
                        <p>Tu compra fue realizada con éxito. Se ha enviado tu ticket a 📧 ${ticket.purchaser}</p>
                        <h2>Información:</h2>
                        <ul>
                            <li>⚙ Código: ${ticket.code}</li>
                            <li>💲 Importe: $ ${ticket.amount}</li>
                            <li>👤 Comprador: ${ticket.purchaser}</li>
                            <li>📅 Fecha de compra: ${ticket.purchase_datetime}</li>
                        </ul>
                        <br>
                        <br>
                        <a href="${config.railwayUrl}/profile">Volver al menú</a>
                    </html>
                `);
            } else {
                logger.info("No hay productos válidos para comprar")
            }
        } catch (error) {
            logger.error('Error al realizar la compra:', error.message);
            next(error);
        }
    }
};