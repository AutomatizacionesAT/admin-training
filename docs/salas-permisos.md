# Gestión exclusiva de Salas

Solo Diana Maritza Pedreros Cuervo (documento `52829724`) puede acceder al
panel de gestión de Salas. Los demás usuarios conservan sus roles en los
otros módulos y en Salas pueden enviar solicitudes pendientes.

## Activación en producción

1. En el proyecto de **login**, abrir **Configuración del proyecto → Propiedades
   de script** y copiar el valor de `TRAINING_SESSION_SECRET`. Si no existe,
   iniciar sesión una vez con el login actualizado para que se genere.
2. En el proyecto de **Salas**, guardar una propiedad con el mismo nombre y
   **exactamente el mismo valor**. No generar otra clave ni compartirla.
3. Copiar `appscriptSalas.gs` al proyecto vinculado al libro de Salas y publicar
   ejecutando como la cuenta propietaria, con acceso **Cualquier usuario**.
4. Conectar el frontend a la URL `/exec` publicada: todas las consultas y
   escrituras deben enviar `sessionToken` por POST, sin usar `gviz`.
5. Publicar el frontend, volver a iniciar sesión y probar con el libro restringido.
   Publicar solo el script no migra el frontend; las peticiones antiguas se rechazan.

El login actual emite un token firmado válido por ocho horas para cada usuario.
Salas usa esa misma sesión; no necesita el antiguo `salasToken` ni configurar
`SALAS_SESSION_SECRET`. El servidor verifica firma, vencimiento y documento antes de permitir
gestionar el catálogo, editar/eliminar asignaciones, aprobar/rechazar o crear
una asignación que no sea pendiente. También protege la edición/respuesta
administrativa de tickets. Los coordinadores conservan su flujo de tickets,
pero solo pueden crear/reportar como ellos mismos y cerrar sus propios tickets.
Para identificarlos, `SALAS_ADMINS` debe tener su documento en A, nombre completo
en B y cargo en C. Las solicitudes se guardan con el coordinador verificado.

Sin secreto o con un token ausente/inválido, todas las consultas y escrituras se
rechazan. No basta con cambiar el documento o el rol desde el navegador.
Las solicitudes pendientes siguen disponibles para los demás usuarios autenticados.

Las lecturas usan `action: "readSheet"` con `sheet` igual a `SALAS_CATALOGO`,
`SALAS_ASIGNACIONES`, `ASIGNACION_TICKET` o `SALAS_ADMINS` (esta última solo Diana).
Devuelven encabezados, valores, textos visibles, índices reales de fila y zona
horaria. GET sin acción solo muestra el estado del servicio.

## Comprobación

- Diana: acceder a Gestión Admin, agendar directamente, aprobar y rechazar.
- Otro superadministrador: ver Mis Solicitudes, crear una solicitud pendiente,
  sin acceso a Gestión Admin.
- Sin token, con token alterado, vencido o de otro documento: el servidor debe
  rechazar las operaciones administrativas sin modificar las hojas.
- Verificar que los roles y permisos de otros módulos no cambiaron.
