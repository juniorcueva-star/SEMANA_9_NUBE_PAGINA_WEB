# Laboratorio 09: almacenamiento de imágenes en Amazon S3

**Alumno:** Junior Cueva Fabian

**Bucket:** `lab-09-cueva-20261014-4827` (`us-east-1`)

**Aplicación:** galería local con S3 privado y enlaces temporales

Este repositorio contiene la aplicación del ejercicio 4 y las evidencias de los ejercicios 1 al 3. El [informe completo en PDF](output/pdf/INFORME_LABORATORIO_09.pdf) reúne las respuestas y reflexiones de seguridad. [Video de demostración](https://docs.google.com/videos/d/15I6fSZcLZ9aYj9Dn9blVK0mOdcEyK_Apoxw9ToatSOk/play?usp=sharing) indicado en el documento del laboratorio.

## Evidencias de los ejercicios 1 al 3

| Ejercicio | Capturas del trabajo realizado |
| --- | --- |
| 1. S3 | [Carpetas](docs/evidencias/e1-carpetas.png), [tres imágenes](docs/evidencias/e1-imagenes.png), [listado por CLI](docs/evidencias/e1-cli-listado.png), [acceso público denegado](docs/evidencias/e1-acceso-denegado.png) |
| 2. Seguridad | [Usuario IAM](docs/evidencias/e2-usuario-iam.png), [política IAM](docs/evidencias/e2-politica-iam.png), [política HTTPS](docs/evidencias/e2-politica-https.png), [eliminación del bucket denegada](docs/evidencias/e2-eliminacion-denegada.png) |
| 3. Versionado | [Activación](docs/evidencias/e3-versionado.png), [tres versiones](docs/evidencias/e3-tres-versiones.png), [marcador de borrado](docs/evidencias/e3-delete-marker.png), [restauración](docs/evidencias/e3-restauracion.png) |

Las capturas se extrajeron del documento del laboratorio completado por el alumno. No se publicaron claves de acceso ni contraseñas.

## Preguntas y respuestas

### Ejercicio 1: fundamentos de S3

1. **¿Por qué el nombre del bucket debe ser único a nivel global?** Porque el nombre forma parte del espacio de direcciones compartido por las cuentas AWS de la partición; dos cuentas no pueden crear el mismo nombre.
2. **¿Qué diferencia hay entre el endpoint regional y el global?** El regional dirige la solicitud a la región del bucket. El global es una dirección general que puede redirigir la solicitud a esa región.
3. **¿Qué ocurre al abrir la URL del objeto en un navegador?** S3 responde `AccessDenied`: el bucket y sus objetos no tienen acceso público. [Evidencia](docs/evidencias/e1-acceso-denegado.png).

**Reflexión:** mantener el bucket privado evita que conocer una URL baste para descargar una imagen. Las credenciales locales de AWS no deben subirse a Git.

### Ejercicio 2: IAM y cifrado

1. **¿Política IAM o política de bucket? ¿Cuál prevalece?** La política IAM concede acciones a una identidad; la política de bucket controla el recurso. Una denegación explícita prevalece sobre cualquier permiso.
2. **¿SSE-S3, SSE-KMS o SSE-C?** SSE-S3 usa claves gestionadas por S3 y es sencilla para esta práctica. SSE-KMS aporta control y auditoría de las claves, con permisos y costos adicionales. SSE-C exige que el cliente proporcione y gestione su propia clave.
3. **¿Qué evita `aws:SecureTransport`?** Bloquea las solicitudes HTTP sin TLS, por lo que la comunicación con el bucket debe ir por HTTPS.
4. **¿Qué hacer si se filtra una Access Key en GitHub?** Desactivarla de inmediato, crear y configurar otra, eliminar la clave anterior y revisar CloudTrail y el uso de la cuenta. Borrarla del repositorio no revoca su validez.

**Reflexión:** el usuario `app-imagenes-user` tiene permisos limitados sobre el bucket; la prueba de `DeleteBucket` devolvió `AccessDenied`. El objeto de prueba cifrado respondió `AES256` (SSE-S3).

### Ejercicio 3: versiones y ciclo de vida

1. **¿Se puede desactivar el versionado libremente?** Después de activarlo se puede **suspender**, pero las versiones anteriores permanecen. Borrar un objeto normalmente crea un *delete marker*; quitarlo permite volver a ver la versión previa.
2. **¿Cuánto costarían 100 GB durante un año si el 80 % deja de consultarse tras el primer mes?** Como cálculo ilustrativo de **solo almacenamiento** en `us-east-1`, con tarifas asumidas de USD 0,023/GB-mes en Standard, 0,0125 en Standard-IA y 0,004 en Glacier Instant: Standard puro cuesta unos **USD 2,30 al mes / 27,60 al año**. Si 80 GB pasan a Standard-IA después de 30 días y a Glacier Instant después de 90 días, y 20 GB quedan en Standard, serían unos **USD 12,24 el primer año** (promedio USD 1,02/mes). Se excluyen solicitudes, recuperación, transición, tamaños mínimos, versiones adicionales e impuestos. Para mover solo el 80 % hay que separarlo con un prefijo o filtro; una regla aplicada a todo `originales/` movería todos los objetos de ese prefijo.
3. **¿Qué añade MFA Delete?** Exige un segundo factor para borrar permanentemente versiones o cambiar el estado del versionado. Conviene cuando las imágenes requieren fuerte protección frente a borrados accidentales o maliciosos.

**Reflexión:** el versionado permitió recuperar una imagen tras el marcador de borrado. La tabla de clases y la configuración de ciclo de vida están descritas en el PDF; las capturas aportadas aquí prueban el versionado y la restauración, no la creación de una regla de ciclo de vida.

### Ejercicio 4: aplicación web

1. **¿Por qué usar presigned URLs en vez de hacer público el bucket?** Limitan el acceso a una operación, objeto y plazo. El bucket permanece privado y el navegador no recibe claves AWS.
2. **¿Qué ocurre si interceptan una URL?** Puede usarse hasta su vencimiento. El daño se reduce con HTTPS, plazos cortos, permisos mínimos y nombres de objeto únicos.
3. **¿Cómo quitar las claves del `.env` al desplegar en EC2?** Asociar a la instancia un IAM Role con permisos mínimos sobre el bucket. El AWS SDK obtiene credenciales temporales automáticamente; se retiran las claves y `AWS_PROFILE` del entorno.
4. **¿Cómo frenar subidas masivas?** Limitar la generación de URL por usuario o IP y aplicar cuotas. La API de esta práctica admite 10 solicitudes por minuto e IP.
5. **¿Qué validaciones adicionales recomienda?** Comparar los *magic bytes* con el formato declarado, intentar decodificar la imagen y pasar antivirus antes de publicarla. La aplicación comprueba los bytes iniciales, el tipo y el tamaño después de subir.

**Reflexión:** la aplicación no publica el bucket; las URL de subida duran 5 minutos y las de lectura 15. Antes de exponer la API a Internet habría que añadir autenticación, autorización por usuario y análisis antimalware.

## Ejecutar la aplicación

Requiere Node.js 20 o posterior, AWS CLI con el perfil `app-user` y permisos `s3:ListBucket`, `s3:GetObject`, `s3:PutObject` y `s3:DeleteObject` para el bucket.

```powershell
cd C:\Users\LENOVO\Desktop\SEMANA_9_NUBE
Copy-Item .env.example .env
npm install
npm start
```

Abrir [http://localhost:3000](http://localhost:3000). La página funciona localmente; las imágenes se almacenan en S3. Apagar la computadora detiene la página. No copiar claves AWS al proyecto.

### CORS del bucket

En S3 > bucket > **Permisos** > **CORS** se configuró:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

El bloqueo de acceso público permanece activado. Si cambia el origen de la página, hay que agregar el nuevo origen exacto.

### Pruebas del ejercicio 4

La carga válida por `PUT` directo a S3 apareció en la galería. Un PDF y un archivo de 10 MB fueron rechazados. La solicitud 11 de URL de subida en un minuto devolvió HTTP 429. Una URL de lectura funcionó al inicio y respondió HTTP 403 tras 16 minutos. No se encontraron credenciales en `frontend/`. Detalles en [docs/EJERCICIO_4.md](docs/EJERCICIO_4.md); las validaciones automatizadas se ejecutan con `npm test`.

## Estructura

- `backend/`: API y validaciones.
- `frontend/`: página, estilos y lógica de galería.
- `docs/evidencias/`: capturas de los ejercicios 1 al 3.
- `docs/EJERCICIO_4.md`: resultados de pruebas de la aplicación.
- `output/pdf/INFORME_LABORATORIO_09.pdf`: informe de los cuatro ejercicios.
- `.env.example`: configuración sin secretos. `.env` está excluido de Git.

## Referencias

- [Precios de Amazon S3](https://aws.amazon.com/s3/pricing/) y [duraciones mínimas de almacenamiento](https://docs.aws.amazon.com/AmazonS3/latest/userguide/troubleshoot-lifecycle.html).
- [URLs prefirmadas de Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html).
- [Roles IAM para EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).
- [OWASP: carga segura de archivos](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
