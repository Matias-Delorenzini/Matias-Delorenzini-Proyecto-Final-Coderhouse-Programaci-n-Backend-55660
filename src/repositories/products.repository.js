export default class ProductsRepository {
    constructor (dao){
        this.dao = dao;
    }

    updateStock = async (id, boughtQuantity) => {
        const result = await this.dao.put(id, boughtQuantity);
        return result;
    }

    getProductById = async (id) => {
        const result =await this.dao.getOne(id);
        return result;
    }

    createProduct = async (title, description, price, stock, category, owner) => {
        const result = await this.dao.post(title, description, price, stock, category, owner);
        return result;
    }

    deleteProduct = async (id) => {
        const result = await this.dao.delete(id);
        return result;
    }

    getProductByName = async (name) => {
        const result = await this.dao.getOneByName(name);
        return result;
    }

    deleteByOwner = async (owner) => {
        const result = await this.dao.deleteByOwner(owner);
        return result;
    }

    getByOwner = async (owner) => {
        const result = await this.dao.getByOwner(owner);
        return result;
    }

    deleteMany = async (products) => {
        const result = await this.dao.deleteMany(products);
        return result;
    }
}