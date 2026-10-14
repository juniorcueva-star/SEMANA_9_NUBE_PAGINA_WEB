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
  return typeof key === 'string' && /^originales\/[^/\\.][^/\\]*\.(jpe?g|png|webp)$/i.test(key);
}

function matchesMagicBytes(type, bytes) {
  if (type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

module.exports = { MAX_FILE_BYTES, MIME_TYPES, EXTENSIONS, validateUpload, safeKey, matchesMagicBytes };
