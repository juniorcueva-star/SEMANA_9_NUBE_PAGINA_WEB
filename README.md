# Atlas de imágenes — Laboratorio 09

Aplicación web para gestionar imágenes en un bucket privado de Amazon S3. El servidor genera enlaces temporales para que el navegador suba imágenes directamente a S3 y vea la galería sin exponer credenciales AWS.

## Requisitos

- Node.js 20 o posterior.
- AWS CLI con el perfil `app-user` configurado y permisos `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` y `s3:HeadObject` (incluido en `s3:GetObject`) sobre el bucket.
- Bucket `lab-09-cueva-20261014-4827` en `us-east-1`, privado y con cifrado SSE-S3.

## Iniciar

```powershell
cd C:\Users\LENOVO\Desktop\SEMANA_9_NUBE
Copy-Item .env.example .env
npm install
npm start
```

Abrir [http://localhost:3000](http://localhost:3000). La aplicación escucha solo en la computadora local. Si el perfil AWS ya existe, **no se deben copiar claves al proyecto**.

## CORS del bucket

En AWS S3 → bucket → **Permisos** → **Configuración de uso compartido de recursos entre orígenes (CORS)** → **Editar**, pegar:

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

Guardar. Si se usa otro puerto o dominio, agregar ese origen exacto. El bucket debe seguir privado; no desactivar el bloqueo de acceso público.

## Uso y comprobaciones

1. Seleccionar o arrastrar una imagen JPG, PNG o WEBP de hasta 5 MB. La página detecta el formato real, incluso si la extensión del archivo no coincide.
2. Comprobar que aparece en la galería. En las herramientas de red del navegador se verá `PUT` directamente a S3.
3. Probar un PDF y una imagen de más de 5 MB: deben rechazarse.
4. El botón **Eliminar imagen** borra las imágenes de la carpeta `originales/`, incluidas las subidas previamente en el laboratorio. S3 conserva versiones anteriores cuando el versionado está activado.
5. Ejecutar `npm test` para comprobar las validaciones.

Las URL de subida caducan a los 5 minutos. Las URL de lectura caducan a los 15 minutos; **Actualizar** genera enlaces nuevos. Con el versionado de S3, borrar un objeto crea un marcador de borrado y permite recuperación desde la consola.

## Estructura

- `backend/server.js`: API, AWS SDK y enlaces temporales.
- `backend/validation.js`: límites y formatos admitidos.
- `frontend/index.html`, `styles.css`, `app.js`: galería, subida y eliminación.
- `.env.example`: configuración sin secretos.

## Nota de seguridad

El servidor está pensado para una práctica local. Antes de publicarlo en Internet se necesita autenticación y controles de autorización por usuario. La API limita a 10 solicitudes de subida por minuto y dirección IP. La URL temporal de PUT valida el tipo declarado, pero S3 no restringe por sí solo los bytes reales; `/api/complete` verifica tamaño, tipo y firma inicial después de la subida. Para producción también se recomienda analizar las imágenes con antivirus antes de mostrarlas. No subir `.env` ni credenciales al repositorio.
