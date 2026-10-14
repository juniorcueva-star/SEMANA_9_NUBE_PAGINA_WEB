const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateUpload, safeKey } = require('./validation');

test('acepta imágenes válidas', () => {
  assert.equal(validateUpload({ filename: 'planeta.png', contentType: 'image/png', sizeBytes: 1024 }), null);
});
test('rechaza otros tipos y archivos de más de 5 MB', () => {
  assert.match(validateUpload({ filename: 'documento.pdf', contentType: 'application/pdf', sizeBytes: 20 }), /JPG/);
  assert.match(validateUpload({ filename: 'grande.jpg', contentType: 'image/jpeg', sizeBytes: 10 * 1024 * 1024 }), /5 MB/);
});
test('restringe los borrados a las claves generadas por la aplicación', () => {
  assert.equal(safeKey('originales/123e4567-e89b-42d3-a456-426614174000.png'), true);
  assert.equal(safeKey('originales/planeta1.png'), false);
  assert.equal(safeKey('../otra-carpeta/archivo.png'), false);
});
