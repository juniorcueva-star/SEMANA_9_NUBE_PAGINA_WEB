const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateUpload, safeKey, matchesMagicBytes } = require('./validation');

test('acepta imágenes válidas', () => {
  assert.equal(validateUpload({ filename: 'planeta.png', contentType: 'image/png', sizeBytes: 1024 }), null);
});
test('rechaza otros tipos y archivos de más de 5 MB', () => {
  assert.match(validateUpload({ filename: 'documento.pdf', contentType: 'application/pdf', sizeBytes: 20 }), /JPG/);
  assert.match(validateUpload({ filename: 'grande.jpg', contentType: 'image/jpeg', sizeBytes: 10 * 1024 * 1024 }), /5 MB/);
});
test('restringe los borrados a imágenes de originales', () => {
  assert.equal(safeKey('originales/123e4567-e89b-42d3-a456-426614174000.png'), true);
  assert.equal(safeKey('originales/planeta1.png'), true);
  assert.equal(safeKey('../otra-carpeta/archivo.png'), false);
  assert.equal(safeKey('originales/otra/carpeta.png'), false);
});
test('comprueba los bytes reales de las imágenes', () => {
  assert.equal(matchesMagicBytes('image/png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), true);
  assert.equal(matchesMagicBytes('image/png', Buffer.from('%PDF-1.7')), false);
  assert.equal(matchesMagicBytes('image/jpeg', Buffer.from([255, 216, 255, 224])), true);
  assert.equal(matchesMagicBytes('image/webp', Buffer.from('RIFF0000WEBP')), true);
});
