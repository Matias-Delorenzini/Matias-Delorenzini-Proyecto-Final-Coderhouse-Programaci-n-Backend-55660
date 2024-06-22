import express from 'express';
import { authorize } from './middlewares/authorize.middleware.js';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import userscontroller from '../controllers/users.controller.js';

const UsersController = new userscontroller();

const router = express.Router();

/* Si bien en las ppt dice que este endpoint debería ser "api/users/premium/:id", yo consideré que
es mucho más seguro obtener el id desde la sesión propia, sin que el usuario deba ingresar su 
propio id. Esto con el objetivo de que el usuario solo pueda modificar su propio rol, ya que con
saber el email o el id de cualquier usuario, un usuario cualquiera podría modificar su rol con
simplemente acceder a este endpoint por la URL.
Para actualizar el rol de otro usuario específico, usé el endpoint "/admin-forced-role-change"
(línea 28), que está resguardado por el middleware autenticador para que solo pueda acceder un 
admin */
router.get("/premium", publicRouteAuth, authorize(["user", "premium"]), UsersController.controllerChangeRole);

router.get("/upload-documents", publicRouteAuth, authorize(["user", "premium"]), UsersController.controllerRenderUploadDocuments);

router.post('/documents', publicRouteAuth, authorize(["user", "premium"]), UsersController.controllerUploadDocuments);

router.get("/", publicRouteAuth, authorize(["admin"]), UsersController.controllerGetUsers);

router.delete("/", publicRouteAuth, authorize(["admin"]), UsersController.controllerDeleteUsersByDate);

router.put("/admin-forced-role-change", publicRouteAuth, authorize(["admin"]), UsersController.controllerAdminForcedRoleChange);

router.delete("/admin-forced-user-delete", publicRouteAuth, authorize(["admin"]), UsersController.controllerAdminForcedUserDelete);

export default router;