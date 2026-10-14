require('dotenv').config();
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const {
  S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand,
  DeleteObjectCommand, ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { EXTENSIONS, MAX_FILE_BYTES, validateUpload, safeKey, matchesMagicBytes } = require('./validation');

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION || 'us-east-1';
const port = Number(process.env.PORT || 3000);
if (!bucket) {
  console.error('Falta S3_BUCKET en .env');
  process.exit(1);
}
const s3 = new S3Client({ region });
const app = express();
const requestsByIp = new Map();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function limitUploadRequests(req, res, next) {
  const now = Date.now();
  const recent = (requestsByIp.get(req.ip) || []).filter(time => now - time < 60_000);
  if (recent.length >= 10) return res.status(429).json({ error: 'Demasiadas subidas. Espera un minuto.' });
  recent.push(now);
  requestsByIp.set(req.ip, recent);
  if (requestsByIp.size > 1000) {
    for (const [ip, times] of requestsByIp) if (times.every(time => now - time >= 60_000)) requestsByIp.delete(ip);
  }
  next();
}

app.post('/api/upload-url', limitUploadRequests, async (req, res, next) => {
  const error = validateUpload(req.body);
  if (error) return res.status(400).json({ error });
  const { contentType, filename } = req.body;
  const readableName = path.basename(filename).replace(/\.[^.]+$/, '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'imagen';
  const key = `originales/${crypto.randomUUID()}-${readableName}${EXTENSIONS[contentType]}`;
  try {
    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: bucket, Key: key, ContentType: contentType
    }), { expiresIn: 300 });
    res.json({ key, uploadUrl, expiresIn: 300 });
  } catch (error) { next(error); }
});

app.post('/api/complete', async (req, res, next) => {
  const { key } = req.body || {};
  if (!safeKey(key)) return res.status(400).json({ error: 'Clave de imagen inválida.' });
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const extension = path.extname(key);
    const expectedType = Object.keys(EXTENSIONS).find(type => EXTENSIONS[type] === extension);
    const firstBytes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-15' }));
    const signature = Buffer.from(await firstBytes.Body.transformToByteArray());
    if (!head.ContentLength || head.ContentLength > MAX_FILE_BYTES || head.ContentType !== expectedType || !matchesMagicBytes(expectedType, signature)) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return res.status(400).json({ error: 'La imagen subida no cumple el tamaño o formato permitido.' });
    }
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get('/api/images', async (_req, res, next) => {
  try {
    const images = [];
    let continuationToken;
    do {
      const page = await s3.send(new ListObjectsV2Command({
        Bucket: bucket, Prefix: 'originales/', MaxKeys: 1000,
        ...(continuationToken ? { ContinuationToken: continuationToken } : {})
      }));
      for (const item of page.Contents || []) {
        if (!item.Key || !/\.(jpe?g|png|webp)$/i.test(item.Key)) continue;
        const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: item.Key }), { expiresIn: 900 });
        images.push({ key: item.Key, name: path.posix.basename(item.Key).replace(/^[a-f0-9-]{36}-/, ''), sizeBytes: item.Size || 0, uploadedAt: item.LastModified, url });
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ images });
  } catch (error) { next(error); }
});

app.delete('/api/images/:key', async (req, res, next) => {
  const key = req.params.key;
  if (!safeKey(key)) return res.status(400).json({ error: 'Solo puedes borrar imágenes subidas desde esta página.' });
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error.name || 'Error', error.message);
  res.status(500).json({ error: 'No se pudo completar la operación. Comprueba AWS y vuelve a intentar.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Galería disponible en http://localhost:${port}`);
});
