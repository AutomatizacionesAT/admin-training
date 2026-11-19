# Gestión exclusiva de Salas

Solo Diana Maritza Pedreros Cuervo (documento `52829724`) puede acceder al
panel de gestión de Salas. Los demás usuarios conservan sus roles en los
otros módulos y en Salas pueden enviar solicitudes pendientes.

## Activación en producción

1. Generar un secreto aleatorio de al menos 32 bytes (por ejemplo,
   `openssl rand -hex 32`). No incluirlo en el código ni en el frontend.
2. En **Configuración del proyecto → Propiedades de la secuencia de comandos**
   de los proyectos de autenticación y Salas, guardar la propiedad
   `SALAS_SESSION_SECRET` con **el mismo valor**.
3. Actualizar el proyecto de autenticación con `appscriptSheets.gs` y publicar
   una nueva versión en su implementación existente.
4. Actualizar el proyecto de Salas con `appscriptSalas.gs` y publicar una nueva
   versión en su implementación existente. Mantener las URL actuales.
5. Publicar el frontend actualizado y volver a iniciar sesión.

El inicio de sesión de Diana emite un token firmado válido por ocho horas.
El servidor de Salas verifica firma, vencimiento y documento antes de permitir
gestionar el catálogo, editar/eliminar asignaciones, aprobar/rechazar o crear
una asignación que no sea pendiente. También protege la edición/respuesta
administrativa de tickets. Los coordinadores conservan su flujo de tickets.

Sin secreto o con un token ausente/inválido, las operaciones de gestión se
rechazan. No basta con cambiar el documento o el rol desde el navegador.
Las solicitudes pendientes siguen disponibles para los demás usuarios.

## Comprobación

- Diana: acceder a Gestión Admin, agendar directamente, aprobar y rechazar.
- Otro superadministrador: ver Mis Solicitudes, crear una solicitud pendiente,
  sin acceso a Gestión Admin.
- Sin token, con token alterado, vencido o de otro documento: el servidor debe
  rechazar las operaciones administrativas sin modificar las hojas.
- Verificar que los roles y permisos de otros módulos no cambiaron.
