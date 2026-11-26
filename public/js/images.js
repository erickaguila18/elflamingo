export function scaleDimensions(w, h, max) {
  const r = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * r)), height: Math.max(1, Math.round(h * r)) };
}

export function dataUrlBytes(url) {
  const b64 = String(url).split(",")[1] ?? "";
  return Math.floor((b64.length * 3) / 4);
}

function draw(src, w, h, max, quality) {
  const { width, height } = scaleDimensions(w, h, max);
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  c.getContext("2d").drawImage(src, 0, 0, width, height);
  return c.toDataURL("image/jpeg", quality);
}

export async function compressImage(file, max = 900, quality = 0.72) {
  const bmp = await createImageBitmap(file);
  return draw(bmp, bmp.width, bmp.height, max, quality);
}

export function resizeDataUrl(url, max = 360, quality = 0.7) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(draw(img, img.width, img.height, max, quality));
    img.onerror = fail;
    img.src = url;
  });
}
