import { escapeHtml as h, formatPrice, availabilityLabel } from "./format.js";
import { APP } from "./config.js";
import { contactUrl } from "./contact.js";

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

export function detailHTML(p, { pageUrl = "", whatsapp = APP.whatsapp } = {}) {
  const photos = p.photos?.length ? p.photos : [p.thumb];
  const wa = contactUrl(whatsapp, p, { pageUrl, priceText: money(p.price) });
  const waLabel = p.availability === "disponible" ? "Preguntar por WhatsApp" : "Preguntar cuándo habrá";
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
      ${wa ? `<a class="btn" href="${h(wa)}" target="_blank" rel="noopener">${waLabel}</a>` : ""}
    </div>
  </article>`;
}

/* Resumen del panel admin (RF-10): `s` es el resultado de summarize().
 * Cuatro tarjetas: Productos · Inversión total · Valor de venta · Ganancia estimada.
 * Todo texto dinámico por escapeHtml; importes con formatPrice + APP. */
export function summaryHTML(s) {
  const num = (n) => (typeof n === "number" && Number.isFinite(n) ? n : 0);
  const total = num(s?.totalProducts);
  const available = num(s?.available);
  const soldOut = num(s?.soldOut);
  const withoutCost = num(s?.withoutCost);
  const profit = num(s?.profit);
  const marginPct = s?.marginPct ?? null;
  const hasMargin = marginPct !== null && Number.isFinite(marginPct);
  const profitClass = profit > 0 ? " ok" : profit < 0 ? " bad" : "";

  const card = (title, value, sub = "", cls = "") => `
    <article class="summary-card">
      <h3 class="summary-title">${title}</h3>
      <p class="summary-value${cls}">${value}</p>${sub}
    </article>`;

  const cards = [
    card("Productos", h(String(total)), `<p class="summary-sub">${h(String(available))} disponibles · ${h(String(soldOut))} agotados</p>`),
    card("Inversión total", h(money(num(s?.investment)))),
    card("Valor de venta", h(money(num(s?.salesValue)))),
    card("Ganancia estimada", h(money(profit)), hasMargin ? `<p class="summary-sub">Margen: ${h(String(marginPct))}%</p>` : "", profitClass),
  ].join("");

  const withoutCostNote = withoutCost > 0
    ? `<p class="summary-warn">${h(String(withoutCost))} producto(s) sin costo registrado, no incluidos en los importes</p>`
    : "";

  return `<section class="summary" aria-label="Resumen del panel">
    ${cards}${withoutCostNote}
    <p class="summary-note">Se cuenta 1 unidad por producto</p>
  </section>`;
}
