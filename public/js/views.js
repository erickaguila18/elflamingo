import { escapeHtml as h, formatPrice, availabilityLabel, whatsappLink } from "./format.js";
import { APP } from "./config.js";

const money = (n) => formatPrice(n, APP);

export function listHTML(products, q = "") {
  const t = q.trim().toLowerCase();
  const items = t ? products.filter((p) => (p.name ?? "").toLowerCase().includes(t)) : products;
  if (!items.length) {
    return `<p class="msg">${products.length ? "Ningún producto coincide con tu búsqueda." : "Aún no hay productos en el catálogo."}</p>`;
  }
  return `<section class="grid">${items.map((p) => `
    <a class="tile" href="#/producto/${encodeURIComponent(p.id)}">
      <div class="ph"><img src="${h(p.thumb)}" alt="${h(p.name)}" loading="lazy">${p.availability === "agotado" ? '<span class="tag">Agotado</span>' : ""}</div>
      <h3>${h(p.name)}</h3><span class="price">${money(p.price)}</span>
    </a>`).join("")}</section>`;
}

export function detailHTML(p) {
  const photos = p.photos?.length ? p.photos : [p.thumb];
  const wa = whatsappLink(APP.whatsapp, `Hola, me interesa: ${p.name}`);
  return `<a href="#/" class="adm">Volver al catálogo</a>
  <article class="detail" style="margin-top:1rem">
    <div>
      <div class="main-ph"><img id="mainPh" src="${h(photos[0])}" alt="${h(p.name)}"></div>
      ${photos.length > 1 ? `<div class="thumbs">${photos.map((s, i) => `<button data-thumb="${i}" aria-current="${i === 0}" aria-label="Foto ${i + 1}"><img src="${h(s)}" alt=""></button>`).join("")}</div>` : ""}
    </div>
    <div>
      <h1>${h(p.name)}</h1>
      <div class="price">${money(p.price)}</div>
      <p class="${p.availability === "disponible" ? "ok" : "bad"}">${availabilityLabel(p.availability)}</p>
      <p class="desc">${h(p.description)}</p>
      ${wa ? `<a class="btn" href="${h(wa)}" target="_blank" rel="noopener">Preguntar por WhatsApp</a>` : ""}
    </div>
  </article>`;
}
