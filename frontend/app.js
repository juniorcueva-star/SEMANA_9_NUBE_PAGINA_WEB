const input = document.querySelector('#file-input');
const dropZone = document.querySelector('#drop-zone');
const gallery = document.querySelector('#gallery');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#gallery-count');
const message = document.querySelector('#message');
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;
let messageTimer;

function notify(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
  message.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { message.hidden = true; }, 5500);
}

async function jsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ocurrió un error. Vuelve a intentarlo.');
  return data;
}

function formatSize(bytes) { return `${(bytes / 1024).toFixed(1)} KB`; }

async function detectImageType(file) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

function renderImages(images) {
  gallery.replaceChildren();
  count.textContent = images.length;
  emptyState.hidden = images.length !== 0;
  for (const image of images) {
    const card = document.createElement('article'); card.className = 'card';
    const photo = document.createElement('img'); photo.className = 'card-image'; photo.src = image.url; photo.alt = image.name; photo.loading = 'lazy';
    const body = document.createElement('div'); body.className = 'card-body';
    const title = document.createElement('p'); title.className = 'card-title'; title.textContent = image.name;
    const meta = document.createElement('div'); meta.className = 'card-meta';
    const date = image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const dateEl = document.createElement('span'); dateEl.textContent = date;
    const sizeEl = document.createElement('span'); sizeEl.textContent = formatSize(image.sizeBytes);
    meta.append(dateEl, sizeEl);
    body.append(title, meta);
    if (/^originales\/[^/\\.][^/\\]*\.(jpe?g|png|webp)$/i.test(image.key)) {
      const actions = document.createElement('div'); actions.className = 'card-actions';
      const remove = document.createElement('button'); remove.className = 'delete-button'; remove.type = 'button'; remove.textContent = 'Eliminar imagen';
      remove.addEventListener('click', () => deleteImage(image.key));
      actions.append(remove); body.append(actions);
    }
    card.append(photo, body); gallery.append(card);
  }
}

async function loadImages() {
  try {
    const { images } = await jsonResponse(await fetch('/api/images'));
    renderImages(images);
  } catch (error) { notify(error.message, true); }
}

async function uploadFile(file) {
  if (!allowedTypes.has(file.type)) throw new Error(`${file.name}: solo JPG, PNG o WEBP.`);
  if (!file.size || file.size > maxBytes) throw new Error(`${file.name}: el límite es 5 MB.`);
  const actualType = await detectImageType(file);
  if (!actualType) throw new Error(`${file.name}: el archivo no contiene una imagen válida.`);
  const { uploadUrl, key } = await jsonResponse(await fetch('/api/upload-url', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: actualType, sizeBytes: file.size })
  }));
  const uploaded = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': actualType }, body: file });
  if (!uploaded.ok) throw new Error(`${file.name}: S3 rechazó la subida. Revisa la configuración CORS del bucket.`);
  await jsonResponse(await fetch('/api/complete', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key })
  }));
}

async function uploadFiles(files) {
  if (!files.length) return;
  let uploaded = 0;
  for (const file of files) {
    try { notify(`Subiendo ${file.name}…`); await uploadFile(file); uploaded++; }
    catch (error) { notify(error.message, true); }
  }
  input.value = '';
  if (uploaded) { await loadImages(); notify(`${uploaded} imagen${uploaded === 1 ? '' : 'es'} subida${uploaded === 1 ? '' : 's'} correctamente.`); }
}

async function deleteImage(key) {
  if (!window.confirm('¿Eliminar esta imagen de la galería?')) return;
  try {
    await jsonResponse(await fetch(`/api/images/${encodeURIComponent(key)}`, { method: 'DELETE' }));
    await loadImages(); notify('Imagen eliminada de la galería.');
  } catch (error) { notify(error.message, true); }
}

input.addEventListener('change', () => uploadFiles([...input.files]));
for (const event of ['dragenter', 'dragover']) dropZone.addEventListener(event, e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
for (const event of ['dragleave', 'drop']) dropZone.addEventListener(event, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', e => uploadFiles([...e.dataTransfer.files]));
document.querySelector('#refresh-button').addEventListener('click', loadImages);
loadImages();
