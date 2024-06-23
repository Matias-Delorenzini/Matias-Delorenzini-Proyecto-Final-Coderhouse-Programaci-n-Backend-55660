***Proyecto Final del curso de Backend de Coderhouse comisión 55660 de Matías Delorenzini***
**Notas:**
- Al momento de usar una URL en el código se utiliza una variable de entorno con el dominio de Railway
- El "api/users/premium/:id" fue reescrito para contar con mayor seguridad, para evitar que un usuario X modifique el rol de un usuario Y
- Las credenciales de administrador son:
Email: adminCoder@gmail.com
Contraseña: admincodercontraseña1234

**Link de acceso:**
https://matiasd-pf-backend-production.up.railway.app/

**Endpoints que no tienen acceso desde una vista (usar URL para su uso):**
/api/products/delete-product/(Id del producto) Elimina el producto solo si el usuario es premium y es el dueño
/api/users/ Renderiza la vista de monitoreo de usuarios, solo si el usuario es admin

***Revisar routes para ver endpoints más específicos***
Todas las funciones necesarias para probar las politicas de roles y las funciones del ecommerce se encuentran en las vistas (salvo eliminar producto y ver la vista de monitoreo de usuarios del admin). Las vistas de subida de documentos y productos están en el perfil.
