# Guion para el video del ejercicio 4 (máximo 5 minutos)

1. **0:00-0:40** - Mostrar el bucket en S3 con **Block all public access** activado y la regla CORS limitada a `http://localhost:3000`.
2. **0:40-1:40** - Abrir `http://localhost:3000`. Mostrar las imágenes ya listadas en la galería.
3. **1:40-2:40** - Subir una imagen JPG. Mostrar que aparece en la galería. En la pestaña *Network* del navegador, enseñar que la solicitud `PUT` va a `amazonaws.com`.
4. **2:40-3:30** - Elegir un PDF y mostrar el rechazo. Explicar el límite de 5 MB y la validación del servidor.
5. **3:30-4:20** - Mostrar una URL de visualización temporal y explicar que caduca a los 15 minutos. Mostrar el resultado 403 de la prueba documentada.
6. **4:20-5:00** - Mostrar el repositorio, `.gitignore`, el código del frontend sin claves y los commits.

Evita mostrar claves de acceso, URLs temporales completas o el contenido de `.env` en la grabación.
