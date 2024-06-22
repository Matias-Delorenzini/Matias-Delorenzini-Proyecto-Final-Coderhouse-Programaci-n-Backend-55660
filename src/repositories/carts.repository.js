export default class CartRepository {
    constructor (dao){
        this.dao = dao;
    }

    findCartByID = async (cartId) => {
        const result = await this.dao.getOne(cartId);
        return result;
    }

    addProductToCart = async(cartId, productId) => {
        const result = await this.dao.addElement(cartId, productId);
        return result;
    }

    removeProductFromCart = async(cartId, productId) => {
        const result = await this.dao.deleteElement(cartId, productId);
        return result;
    }

    increaseProductQuantity = async(cartId, productId, quantityToAdd) => {
        const result = await this.dao.increaseElementQuantity(cartId, productId, quantityToAdd);
        return result;
    }

    clearCart = async(cartId) => {
        const result = await this.dao.clear(cartId);
        return result;
    }

    createNewUserCart = async(id) => {
        const result = await this.dao.post(id);
        return result;
    }

    removeCart = async(cid) => {
        const result = await this.dao.delete(cid);
        return result;
    }

    deleteProductsFromAllCarts = async (products) => {
        const result = await this.dao.deleteProductsFromAllCarts(products);
        return result;
    }
}