/**
 * Secure Canvas-based image cropper utility.
 * Takes a Base64 image + react-easy-crop pixelCrop area and returns
 * a 400x400 compressed JPEG Base64 string safely.
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });

export default async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Clamp to safe integer px values
  const sx = Math.max(0, Math.round(pixelCrop.x));
  const sy = Math.max(0, Math.round(pixelCrop.y));
  const sw = Math.max(1, Math.round(pixelCrop.width));
  const sh = Math.max(1, Math.round(pixelCrop.height));

  // Always output a fixed 400x400 avatar to keep Base64 size small
  const OUTPUT = 400;
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, OUTPUT, OUTPUT);

  return canvas.toDataURL("image/jpeg", 0.85);
}
