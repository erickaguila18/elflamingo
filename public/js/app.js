import { auth, authM } from "./firebase.js";
import * as store from "./store.js";
import { parseRoute } from "./router.js";
import { listHTML, detailHTML } from "./views.js";
import { escapeHtml as h, formatPrice } from "./format.js";
import { APP } from "./config.js";
import { validateProduct, parsePrice, margin, MAX_PHOTOS, AVAILABILITY } from "./validation.js";
import { compressImage, resizeDataUrl } from "./images.js";

const $app = document.getElementById("app");
const $search = document.getElementById("search");
let user = null, cache = null, q = "";
let photos = [], editId = null;

const toast = (m) => { const t = document.getElementById("toast"); t.textContent = m; t.className = "on"; setTimeout(() => (t.className = ""), 2500); };
const products = async () => (cache ??= await store.listProducts());

async function render() {
  const r = parseRoute(location.hash);
  $search.style.display = r.name === "list" ? "" : "none";
  $app.innerHTML = '<p class="msg">Cargando…</p>';
  try {
    if (r.name === "list") $app.innerHTML = listHTML(await products(), q);
    else if (r.name === "detail") await showDetail(r.id);
    else if (r.name === "admin") await showAdmin();
    else $app.innerHTML = '<p class="msg">Página no encontrada. <a href="#/">Ir al catálogo</a></p>';
  } catch (e) {
    console.error(e);
    $app.innerHTML = `<p class="msg error">No se pudo cargar: ${h(e.message)}. Revisa tu conexión y las reglas de Firestore.</p>`;
  }
}

async function showDetail(id) {
  const p = await store.getProduct(id);
  if (!p) { $app.innerHTML = '<p class="msg">Este producto ya no existe. <a href="#/">Ver catálogo</a></p>'; return; }
  document.title = `${p.name} · El Flamingo`;
  $app.innerHTML = detailHTML(p);
  $app.querySelectorAll("[data-thumb]").forEach((b) => b.addEventListener("click", () => {
    document.getElementById("mainPh").src = p.photos[b.dataset.thumb];
    $app.querySelectorAll("[data-thumb]").forEach((x) => x.setAttribute("aria-current", x === b));
  }));
}

/* ---------- Admin ---------- */
function loginHTML() {
  return `<form class="box" id="login" style="max-width:24rem;margin:auto"><h2>Entrar al panel</h2>
    <label for="em">Correo</label><input id="em" type="email" required autocomplete="username">
    <label for="pw">Contraseña</label><input id="pw" type="password" required autocomplete="current-password">
    <p class="err" id="lerr"></p><button class="btn">Entrar</button></form>`;
}

async function showAdmin() {
  if (!user) {
    $app.innerHTML = loginHTML();
    document.getElementById("login").addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await authM.signInWithEmailAndPassword(auth, e.target.em.value, e.target.pw.value); }
      catch { document.getElementById("lerr").textContent = "Correo o contraseña incorrectos."; }
    });
    return;
  }
  cache = null;
  const list = await products();
  $app.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h2>Panel</h2><button class="btn ghost" id="out">Salir</button></div>
    <form class="box" id="pf" novalidate>
      <h3 id="ft">Nuevo producto</h3>
      <label for="name">Nombre</label><input id="name" maxlength="80"><div class="err" data-e="name"></div>
      <label for="description">Descripción</label><textarea id="description" rows="4" maxlength="2000"></textarea><div class="err" data-e="description"></div>
      <div class="row"><div><label for="price">Precio al público (${APP.currency})</label><input id="price" inputmode="decimal"><div class="err" data-e="price"></div></div>
      <div><label for="cost">Precio de inversión</label><input id="cost" inputmode="decimal"><div class="err" data-e="cost"></div></div></div>
      <p id="mg" class="msg" style="padding:.3rem;text-align:left"></p>
      <label for="availability">Disponibilidad</label><select id="availability">${AVAILABILITY.map((a) => `<option>${a}</option>`).join("")}</select>
      <label>Fotografías (1 a ${MAX_PHOTOS})</label><div class="slots" id="slots"></div>
      <input type="file" id="files" accept="image/*" multiple><div class="err" data-e="photos"></div>
      <p style="display:flex;gap:.6rem"><button class="btn" id="save">Guardar producto</button><button type="button" class="btn ghost" id="reset">Limpiar</button></p>
    </form>
    <div class="panel"><h3>Productos (${list.length})</h3>${list.map((p) => `<div class="arow"><img src="${h(p.thumb)}" alt=""><div class="n"><strong>${h(p.name)}</strong><br><small>${formatPrice(p.price, APP)} · ${p.availability}</small></div>
      <a class="btn ghost" href="#/producto/${p.id}">Ver</a><button class="btn ghost" data-edit="${p.id}">Editar</button><button class="btn danger" data-del="${p.id}">Borrar</button></div>`).join("") || '<p class="msg">Todavía no hay productos. Crea el primero arriba.</p>'}</div>`;
  bindAdmin();
  resetForm();
}

const f = () => document.getElementById("pf");
const fv = (id) => document.getElementById(id).value;

function drawSlots() {
  document.getElementById("slots").innerHTML = photos.map((s, i) => `<div class="slot"><img src="${h(s)}" alt=""><button type="button" data-rm="${i}" aria-label="Quitar foto">×</button></div>`).join("");
  document.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => { photos.splice(+b.dataset.rm, 1); drawSlots(); }));
}
function resetForm() { editId = null; photos = []; f().reset(); document.getElementById("ft").textContent = "Nuevo producto"; drawSlots(); updMargin(); }
function updMargin() {
  const m = margin(parsePrice(fv("price")), parsePrice(fv("cost")));
  document.getElementById("mg").textContent = m === null ? "" : `Margen: ${m}%`;
}

function bindAdmin() {
  document.getElementById("out").addEventListener("click", () => authM.signOut(auth));
  document.getElementById("reset").addEventListener("click", resetForm);
  ["price", "cost"].forEach((id) => document.getElementById(id).addEventListener("input", updMargin));
  document.getElementById("files").addEventListener("change", async (e) => {
    for (const file of e.target.files) {
      if (photos.length >= MAX_PHOTOS) { toast("Máximo 4 fotografías."); break; }
      try { photos.push(await compressImage(file)); } catch { toast("No se pudo leer una imagen."); }
    }
    e.target.value = ""; drawSlots();
  });
  f().addEventListener("submit", onSave);
  $app.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => editProduct(b.dataset.edit)));
  $app.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("¿Borrar este producto? No se puede deshacer.")) return;
    await store.removeProduct(b.dataset.del); toast("Producto borrado"); showAdmin();
  }));
}

async function editProduct(id) {
  const [p, cost] = await Promise.all([store.getProduct(id), store.getCost(id)]);
  editId = id; photos = [...p.photos];
  document.getElementById("ft").textContent = "Editar producto";
  ["name", "description", "availability"].forEach((k) => (document.getElementById(k).value = p[k] ?? ""));
  document.getElementById("price").value = p.price; document.getElementById("cost").value = cost ?? "";
  drawSlots(); updMargin(); f().scrollIntoView({ behavior: "smooth" });
}

async function onSave(e) {
  e.preventDefault();
  const data = { name: fv("name").trim(), description: fv("description").trim(), price: parsePrice(fv("price")), availability: fv("availability") };
  const cost = parsePrice(fv("cost"));
  const { valid, errors } = validateProduct({ ...data, cost }, photos.length);
  document.querySelectorAll("[data-e]").forEach((el) => (el.textContent = errors[el.dataset.e] ?? ""));
  if (!valid) return;
  const btn = document.getElementById("save"); btn.disabled = true; btn.textContent = "Guardando…";
  try {
    const thumb = await resizeDataUrl(photos[0]);
    await store.saveProduct({ id: editId, data, cost, photos, thumb });
    toast("Producto guardado"); await showAdmin();
  } catch (err) {
    console.error(err); toast("No se pudo guardar. ¿Tu UID está en las reglas?");
    btn.disabled = false; btn.textContent = "Guardar producto";
  }
}

/* ---------- Arranque ---------- */
$search.addEventListener("input", () => { q = $search.value; if (parseRoute(location.hash).name === "list" && cache) $app.innerHTML = listHTML(cache, q); });
window.addEventListener("hashchange", render);
authM.onAuthStateChanged(auth, (u) => {
  const was = !!user; user = u;
  document.getElementById("adminLink").textContent = u ? "Panel" : "Admin";
  if (was !== !!u || !cache) render();
});
