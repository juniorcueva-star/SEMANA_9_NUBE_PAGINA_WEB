const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function validateUpload(input) {
  if (!input || typeof input !== 'object') return 'Datos de archivo inválidos.';
  const { filename, contentType, sizeBytes } = input;
  if (typeof filename !== 'string' || !filename.trim() || filename.length > 200) return 'El nombre del archivo es inválido.';
  if (!MIME_TYPES.has(contentType)) return 'Solo se aceptan imágenes JPG, PNG o WEBP.';
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) return 'La imagen debe pesar menos de 5 MB.';
  return null;
}

function safeKey(key) {
  return typeof key === 'string' && /^originales\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key);
}

module.exports = { MAX_FILE_BYTES, MIME_TYPES, EXTENSIONS, validateUpload, safeKey };
