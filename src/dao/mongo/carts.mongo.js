import CartsModel from "../models/carts.schema.js";
import { logger } from "../../utils/logger.js";

class Carts {
    getOne = async(cartId) => {
        if (!cartId) return { success: false, message: 'CART_SEARCH_MISSING_ARGUMENTS' };
        try {
            let cart = await CartsModel.find({cartId: cartId});
            let cartData = JSON.stringify(cart,null,"\t")
            if (cartData.length === 0) return { success: false, message: 'CART_NOT_FOUND' };
    
            return cartData;
        } catch (error) {
            logger.error('Error al obtener los datos del carrito:', error.message);
            return { success: false, message: 'CART_DATA_ERROR' };
        }
    }  

    deleteElement = async(cartId, productId) => {
        if (!cartId || !productId) return { success: false, message: 'CART_PRODUCT_DELETE_MISSING_ARGUMENTS' };
        try {
            let cartData = await this.getOne(cartId);
            if (cartData === "[]") return { success: false, message: 'CART_PRODUCT_DELETE_NOT_FOUND' };
            let cart = JSON.parse(cartData,null,"\t")
            const productList = cart[0].products;
            const index = productList.findIndex(item => item.product._id === productId);
            if (index !== -1) {
                productList.splice(index, 1);
                cart[0].products = productList;
                await CartsModel.findOneAndUpdate( {cartId: cartId}, { products: cart[0].products });
                return { success: true, message: `Se eliminó el producto`};
            } else {
                return { success: false, message: `PRODUCT_NOT_FOUND`};
            }
        } catch (error) {
            logger.error('Error al eliminar producto del carrito:', error.message);
            return { success: false, message: 'CART_PRODUCT_DELETE_ERROR' };
        }
    }
    
    addElement = async (cartId, productId) => {
        if (!cartId || !productId) return { success: false, message: 'CART_PRODUCT_ADD_MISSING_ARGUMENTS' };
        try {
            const cart = await CartsModel.findOne({ cartId: cartId });
            if (!cart) return { success: false, message: 'CART_NOT_FOUND' };
            const existingProductIndex = cart.products.findIndex(item => String(item.product._id) === String(productId));
            if (existingProductIndex !== -1) return { success: false, message: 'PRODUCT_ALREADY_IN_CART' };
            cart.products.push({ product: productId });
            await cart.save();
            return { success: true, message: 'Producto añadido al carrito exitosamente.' };
        } catch (error) {
            logger.error('Error al añadir producto al carrito:', error.message);
            return { success: false, message: 'CART_PRODUCT_ADD_ERROR' };
        }
    }
    
    increaseElementQuantity = async (cartId, productId, quantityToAdd) => {
        if (!cartId || !productId || quantityToAdd === undefined || quantityToAdd === null) return { success: false, message: 'CART_PRODUCT_QUANTITY_CHANGE_MISSING_ARGUMENTS' };
        quantityToAdd = parseInt(quantityToAdd);
        if (isNaN(quantityToAdd)) return { success: false, message: 'PRODUCT_QUANTITY_CHANGE_INVALID_QUANTITY' };
        try {
            const cart = await CartsModel.findOne({ cartId: cartId });
            if (!cart) {
                return { success: false, message: 'CART_NOT_FOUND' };
            }
            const productIndex = cart.products.findIndex(item => String(item.product._id) === String(productId));
            if (productIndex !== -1) {
                cart.products[productIndex].quantity += quantityToAdd;
                await cart.save();
                return { success: true, message: 'Cantidad del producto aumentada exitosamente.' };
            } else {
                return { success: false, message: 'CART_PRODUCT_SEARCH_ERROR' };
            }
        } catch (error) {
            logger.error('Error al aumentar la cantidad del producto en el carrito:', error.message);
            return { success: false, message: 'CART_PRODUCT_QUANTITY_CHANGE_ERROR' };
        }
    }

    clear = async (cartId) => {
        if (!cartId) return { success: false, message: 'CART_CLEAR_MISSING_ARGUMENTS' };
        try {
            const result = await CartsModel.findOneAndUpdate({ cartId: cartId }, { products: [] });
            if (!result) return { success: false, message: 'CART_CLEAR_CART_NOT_FOUND' }
            return { success: true, message: 'Se vació el carrito' };
        } catch (error) {
            logger.error('Error al vaciar el carrito:', error.message);
            return { success: false, message: 'CART_CLEAR_ERROR' };
        }
    }

    post = async (id) => {
        if (!id) return { success: false, message: 'CART_CREATE_MISSING_ARGUMENTS' };
        try {
            const newCart = new CartsModel({ cartId: id });
            const savedCart = await newCart.save();
            return savedCart;
        } catch (error) {
            logger.error('Error al crear el carrito:', error.message);
            return { success: false, message: 'CART_CREATE_ERROR' };
        }
    }

    delete = async (cid) => {
        try {
            const result = await CartsModel.findOneAndDelete({ cartId: cid });
            if (!result) {
                logger.error(`No se encontró el carrito con cartId ${cid} así que no se eliminó`);
                return { success: false, message: 'CART_NOT_FOUND' };
            }
            return { success: true, message: `Carrito con el cartId ${cid} eliminado correctamente` };
        } catch (error) {
            logger.error('Error al eliminar el carrito:', error.message);
            return { success: false, message: 'CART_DELETE_ERROR' };
        }
    }

    deleteProductsFromAllCarts = async (products) => {
        if (!Array.isArray(products) || products.length === 0) {
            return { success: false, message: 'PRODUCTS_DELETE_FROM_ALL_CARTS_MISSING_ARGUMENTS' };
        }
        try {
            const productIds = products.map(product => String(product._id));
            const carts = await CartsModel.find();
            for (const cart of carts) {
                for (const item of cart.products) {
                    if (!item.product) {
                        logger.warning(`Producto nulo encontrado en el carrito con ID: ${cart.cartId}`);
                    }
                }
            } 
            if (!carts || carts.length === 0) {
                return { success: false, message: 'CARTS_NOT_FOUND' };
            }
            for (let i = 0; i < carts.length; i++) {
                let cart = carts[i];
                logger.debug(`Carrito antes de la eliminación: ${JSON.stringify(cart, null, 2)}`);
                const originalLength = cart.products.length;
                cart.products = cart.products.filter(item => {
                    if (!item.product) {
                        logger.debug(`Producto nulo encontrado en el carrito: ${JSON.stringify(item)}`);
                        return false;
                    }
                    const isProductIncluded = !productIds.includes(String(item.product._id));
                    if (!isProductIncluded) {
                        logger.debug(`Producto eliminado del carrito: ${JSON.stringify(item.product)}`);
                    }
                    return isProductIncluded;
                });
                if (cart.products.length !== originalLength) {
                    logger.debug(`Carrito después de la eliminación: ${JSON.stringify(cart, null, 2)}`);
                    await cart.save();
                }
            }
            return { success: true, message: 'Productos eliminados de todos los carritos.' };
        } catch (error) {
            logger.error(`Error al eliminar productos de todos los carritos: ${error}`);
            return { success: false, message: 'PRODUCTS_DELETE_FROM_ALL_CARTS_ERROR' };
        }
    } 
}

export default Carts;