# Ejercicio 4 — Aplicación web con Amazon S3

**Fecha:** 14 de octubre de 2026
**Repositorio:** https://github.com/juniorcueva-star/SEMANA_9_NUBE_PAGINA_WEB

## Arquitectura

El navegador solicita a la API un enlace temporal de carga (5 minutos), envía la imagen directamente a S3 y luego confirma la carga. La API comprueba el tamaño, el tipo y los primeros bytes del archivo. Para mostrar las imágenes genera enlaces de lectura de 15 minutos. El bucket permanece privado y con bloqueo de acceso público.

## Pruebas realizadas

| Prueba | Resultado |
| --- | --- |
| CORS para `http://localhost:3000` | `OPTIONS` respondió 200 con ese origen permitido. |
| Carga de imagen válida desde el navegador | Imagen visible en la galería; pasó de 6 a 7 elementos. |
| Confirmación sobre un objeto anterior | Rechazada con HTTP 400; el objeto original permaneció intacto. |
| Selección de PDF desde el navegador | Rechazada con “solo JPG, PNG o WEBP”. |
| Declaración de archivo de 10 MB a la API | Rechazada con HTTP 400. |
| Once solicitudes de subida seguidas | Las primeras 10 respondieron 200; la última, 429. |
| Enlace temporal de lectura de 15 minutos | Respondió 200 al inicio y 403 después de 16 minutos. |
| Credenciales en `frontend/` | No se encontraron claves AWS. |
| Envío directo a S3 | `frontend/app.js` usa `fetch(uploadUrl, { method: 'PUT', body: file })`. |

**Comprobación de 16 minutos:** iniciada a las 19:13:29 UTC; respuesta 403 a las 19:29:30 UTC con la misma URL.

## Respuestas de análisis

1. **Seguridad:** las presigned URLs dan acceso limitado a una operación, objeto y tiempo; el bucket sigue privado.
2. **URL interceptada:** quien la obtenga puede usarla hasta que caduque. Se limita el daño con caducidad corta, permisos mínimos y protección de HTTPS.
3. **EC2 sin claves en `.env`:** asignar un IAM Role con permisos mínimos a la instancia y dejar que el AWS SDK obtenga credenciales temporales automáticamente; quitar `AWS_PROFILE` y cualquier clave del entorno.
4. **Subidas masivas:** limitar las solicitudes de `/api/upload-url` por usuario o IP y aplicar cuotas. Esta práctica limita a 10 solicitudes por minuto e IP.
5. **Más validaciones:** comprobar los magic bytes, decodificar la imagen y analizarla con antivirus antes de publicarla. Esta práctica valida los bytes iniciales.

## Fuentes

- AWS, [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html).
- AWS, [IAM Roles para EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).
- OWASP, [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- OWASP, [Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html).
