import ProductsModel from '../dao/models/products.schema.js';
import { cartsService, productsService } from '../repositories/index.js';
import { CustomError } from '../services/errors/errors.js';
import { logger } from '../utils/logger.js';
import transporter from '../utils/email.js';
import config from '../config/config.js';

export default class productscontroller {
    controllerCreateProduct = async (req, res, next) => {
        try {
            console.log('User in session:', req.session.user);
            const user = req.session.user
            logger.debug(`User: ${user}`)

            const { title, description, price, stock, category } = req.body;
            logger.debug(`Title: ${title}`)
            logger.debug(`Description: ${description}`)
            logger.debug(`Price: ${price}`)
            logger.debug(`Stock: ${stock}`)
            logger.debug(`Category: ${category}`)

            const owner = user.email
            logger.debug(`Owner: ${owner}`)

            const result = await productsService.createProduct(title, description, price, stock, category, owner);
            logger.debug(result)
            if (result.success === false) throw new CustomError(`${result.message}`);
            res.send(`
                <html>
                    <p>${result}</p> <br>
                    <a href="/">Volver</a>
                </html>
            `);
        } catch (error) {
            next(error);
        }
    };

    controllerRenderCreateProduct = async (req, res, next) => {
        logger.debug(req.session.user.role)
        try{
            res.render("create-product")
        } catch (error) {
            next(error);
        }
    };

    controllerDeleteProduct = async (req, res, next) => {
        try {
            const user = req.session.user;
            const id = req.params.id;
            logger.debug(`Usuario en sesión: ${JSON.stringify(user)}`);
            logger.debug(`ID del producto a eliminar: ${id}`);
    
            const productToDeleteResponse = await productsService.getProductById(id);
            logger.debug(`Respuesta del servicio de productos: ${JSON.stringify(productToDeleteResponse)}`);
            if (productToDeleteResponse.success === false) throw new CustomError(productToDeleteResponse.message);
    
            const productToDelete = productToDeleteResponse.product;
            logger.debug(`Producto a eliminar: ${JSON.stringify(productToDelete)}`);
    
            if (productToDelete.owner !== user.email && user.role !== "admin") {
                return res.status(403).json({ message: 'No tienes permisos para borrar este producto' });
            }
    
            const resultCartWipe = await cartsService.deleteProductsFromAllCarts([productToDelete]);
            logger.debug(`Resultado de eliminar productos de todos los carritos: ${JSON.stringify(resultCartWipe)}`);
            if (resultCartWipe.success === false) throw new CustomError(resultCartWipe.message);
    
            const result = await productsService.deleteProduct(productToDelete._id);
            logger.debug(`Resultado de eliminar el producto: ${JSON.stringify(result)}`);
            if (result.success === false) throw new CustomError(result.message);

            // Incluí un mensaje de aclaración porque me di cuenta de que le estaba llenando la casilla de correos al dueño de test@gmail.com
            await transporter.sendMail({
                from: `Coder Tests ${config.informativeEmail}`,
                to: productToDelete.owner,
                subject: `El producto ${productToDelete.title} fue eliminado`,
                html: `
                <h1>Notificación de eliminación de producto</h1>
                <p>Estimado ${user.first_name}, su producto ${productToDelete.title} código ${productToDelete._id} fue eliminado.
                <h3>Producto eliminado:</h3>
                <ul>
                    <li>${productToDelete._id}</li>
                    <li>${productToDelete.title}</li>
                    <li>${productToDelete.description}</li>
                    <li>${productToDelete.price}</li>
                    <li>${productToDelete.stock}</li>
                    <li>${productToDelete.category}</li>
                    <li>${productToDelete.owner}</li>
                </ul>
                <br>
                <h1>Este email fue enviado a una cuenta aleatoria (que de casualidad fue la tuya), y forma parte de un proyecto de programación, sin ningún tipo de objetivo malicioso, que envía correos a correos electrónicos aleatórios al azar 😊 Si lo recibiste, fue por pura casualidad, solo ignóralo. Disculpa las molestias</h1>
                <br>
                <h1>This email was sent to a random account (it happened to be yours by chance) as part of a programming project, without any type of malicious intents, which sends emails to random accounts 😊 If you received it, it was purely by chance, just ignore it. Sorry for the inconveniences</h1>`,
                attachments: []
            });

            res.send(`
                <html>
                    <body>
                        <center><h3>Se ha eliminado el producto</h3> <br> <a href="/">Volver</a></center>
                    </body>
                </html>
            `);
        } catch (error) {
            next(error);
        }
    };


    controllerGetPaginatedProducts = async (req, res) => {
        try {
            let limit = parseInt(req.query.limit) || 5;
            let page = req.query.page || 1;
            let sort = req.query.sort;
            let query = req.query.query;

            let filters = {};
            let sortOptions = {};

            if (sort === 'asc' || sort === 'desc') {
                sortOptions = { price: sort };
            }

            if (query) {
                filters = { ...filters, category: query };
            }
            if (req.query.stock !== null && req.query.stock !== undefined) {
                filters = { ...filters, stock: { $gt: 0 } };
            }

            const result = await ProductsModel.paginate(filters, { page, limit, lean: true, sort: sortOptions });
            if (result.success === false) throw new CustomError(result.message);

            result.prevLink = result.hasPrevPage ? `/api/products?page=${result.prevPage}` : '';
            result.nextLink = result.hasNextPage ? `/api/products?page=${result.nextPage}` : '';
            result.isValid = !(isNaN(page) || page <= 0 || page > result.totalPages);

            const userData = req.session.user;

            res.render('products', { result, userData });
        } catch (error) {
            res.status(500).json({ status: 'error', error: 'Error al obtener los productos: ' + error.message });
        }
    }
}