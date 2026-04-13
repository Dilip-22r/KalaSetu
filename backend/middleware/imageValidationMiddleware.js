// ─── Magic byte signatures ────────────────────────────────────────────────────
const IMAGE_SIGNATURES = {
  "image/jpeg": { offset: 0, bytes: [0xff, 0xd8, 0xff] },
  "image/png":  { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  "image/gif":  { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: "RIFF" at 0, "WEBP" at 8
  "image/webp": null, // handled separately below
};

const PDF_SIGNATURE = { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }; // %PDF

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;  // 5 MB decoded
const MAX_PDF_BYTES   = 10 * 1024 * 1024; // 10 MB decoded

// ─── Internal: validate data URI format ──────────────────────────────────────
function parseDataUri(dataStr) {
  // Must be: data:<mime>;base64,<base64data>
  const match = dataStr.match(/^data:([a-z]+\/[a-z0-9.+\-]+);base64,([A-Za-z0-9+/]+=*)$/);
  if (!match) return null;
  return { mime: match[1], b64: match[2] };
}

// ─── Internal: decode first N bytes of base64 string ─────────────────────────
function decodeFirstBytes(b64, count) {
  // We only need to decode enough base64 characters to get `count` raw bytes.
  // 4 base64 chars → 3 raw bytes, so we need ceil(count/3)*4 chars.
  const charsNeeded = Math.ceil(count / 3) * 4;
  const slice = b64.slice(0, charsNeeded);
  const buf = Buffer.from(slice, "base64");
  return buf;
}

// ─── Internal: decoded byte size from base64 string ──────────────────────────
function decodedByteSize(b64) {
  const len = b64.length;
  let padding = 0;
  if (b64.endsWith("==")) padding = 2;
  else if (b64.endsWith("=")) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

// ─── Internal: verify magic bytes ────────────────────────────────────────────
function hasMagicBytes(b64, mime) {
  if (mime === "image/webp") {
    const buf = decodeFirstBytes(b64, 12);
    return (
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    );
  }
  const sig = IMAGE_SIGNATURES[mime] || null;
  if (!sig) return false;
  const buf = decodeFirstBytes(b64, sig.bytes.length + sig.offset);
  return sig.bytes.every((byte, i) => buf[sig.offset + i] === byte);
}

// ─── Internal: verify PDF magic bytes ────────────────────────────────────────
function hasPdfMagicBytes(b64) {
  const buf = decodeFirstBytes(b64, 4);
  return PDF_SIGNATURE.bytes.every((byte, i) => buf[i] === byte);
}

// ─── Generic error response (opaque — does not reveal which step failed) ─────
function reject(res, detail) {
  // detail is only logged, not sent to client
  console.warn(`[IMAGE VALIDATION] Rejected: ${detail}`);
  return res.status(400).json({ message: "Invalid or unsupported file format." });
}

// ─── Middleware: validateImage(field) ─────────────────────────────────────────
// Validates a single base64 image field in req.body.
// If the field is absent or empty, validation is skipped (field is optional).
export function validateImage(field) {
  return (req, res, next) => {
    const value = req.body?.[field];
    if (!value) return next(); // field absent — skip

    // Step 1: Parse data URI structure
    const parsed = parseDataUri(value);
    if (!parsed) {
      return reject(res, `field="${field}" — malformed data URI`);
    }

    // Step 2: MIME allowlist check
    const { mime, b64 } = parsed;
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      return reject(res, `field="${field}" — MIME "${mime}" not in image allowlist`);
    }

    // Step 3: Magic bytes check (actual content, not just prefix)
    try {
      if (!hasMagicBytes(b64, mime)) {
        return reject(res, `field="${field}" — magic bytes do not match declared MIME "${mime}"`);
      }
    } catch (err) {
      return reject(res, `field="${field}" — failed to decode bytes: ${err.message}`);
    }

    // Step 4: Decoded size limit
    const size = decodedByteSize(b64);
    if (size > MAX_IMAGE_BYTES) {
      return reject(res, `field="${field}" — decoded size ${size} bytes exceeds ${MAX_IMAGE_BYTES} byte limit`);
    }

    next();
  };
}

// ─── Middleware: validatePdf(field) ──────────────────────────────────────────
// Validates a single base64 PDF field in req.body.
export function validatePdf(field) {
  return (req, res, next) => {
    const value = req.body?.[field];
    if (!value) return next(); // field absent — skip

    // Step 1: Parse data URI structure
    const parsed = parseDataUri(value);
    if (!parsed) {
      return reject(res, `field="${field}" — malformed data URI`);
    }

    // Step 2: MIME must be application/pdf
    const { mime, b64 } = parsed;
    if (mime !== "application/pdf") {
      return reject(res, `field="${field}" — MIME "${mime}" is not application/pdf`);
    }

    // Step 3: PDF magic bytes (%PDF)
    try {
      if (!hasPdfMagicBytes(b64)) {
        return reject(res, `field="${field}" — magic bytes do not match PDF signature`);
      }
    } catch (err) {
      return reject(res, `field="${field}" — failed to decode bytes: ${err.message}`);
    }

    // Step 4: Decoded size limit
    const size = decodedByteSize(b64);
    if (size > MAX_PDF_BYTES) {
      return reject(res, `field="${field}" — decoded size ${size} bytes exceeds ${MAX_PDF_BYTES} byte limit`);
    }

    next();
  };
}
