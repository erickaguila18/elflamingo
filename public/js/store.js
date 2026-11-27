// Modelo: products/{id} (+ /photos/{n}) público · products_private/{id} {cost} solo admin
import { db, fsM } from "./firebase.js";
const { collection, doc, getDocs, getDoc, setDoc, writeBatch, query, orderBy, serverTimestamp, deleteField } = fsM;

export async function listProducts() {
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const s = await getDoc(doc(db, "products", id));
  if (!s.exists()) return null;
  const ph = await getDocs(query(collection(db, "products", id, "photos"), orderBy("order")));
  return { id, ...s.data(), photos: ph.docs.map((d) => d.data().data) };
}

export async function getCost(id) {
  const s = await getDoc(doc(db, "products_private", id));
  return s.exists() ? s.data().cost : null;
}

// RF-10: lee toda la colección products_private (solo admin) y devuelve {id: cost}
export async function listCosts() {
  const snap = await getDocs(collection(db, "products_private"));
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data().cost]));
}

// RF-11: número de WhatsApp público en site/contact; "" si no existe. Lectura pública.
export async function getContact() {
  const s = await getDoc(doc(db, "site", "contact"));
  return s.exists() ? (s.data().whatsapp ?? "") : "";
}

// RF-11: guarda el número normalizado (solo admin por reglas de Firestore).
export async function saveContact(number) {
  await setDoc(doc(db, "site", "contact"), { whatsapp: number, updatedAt: serverTimestamp() });
}

export async function saveProduct({ id, data, cost, photos, thumb }) {
  const ref = id ? doc(db, "products", id) : doc(collection(db, "products"));
  const batch = writeBatch(db);
  if (id) (await getDocs(collection(db, "products", id, "photos"))).forEach((d) => batch.delete(d.ref));
  const body = { ...data, thumb, photoCount: photos.length, updatedAt: serverTimestamp() };
  if (!id) body.createdAt = serverTimestamp();
  batch.set(ref, body, { merge: true });
  batch.set(doc(db, "products_private", ref.id), { cost });
  photos.forEach((p, i) => batch.set(doc(db, "products", ref.id, "photos", String(i)), { data: p, order: i }));
  await batch.commit();
  return ref.id;
}

// RF-12: marcar vendido sin borrar ni editar. Batch atómico.
// products/{id}: SOLO availability + updatedAt; nada más (ni name, description, price, thumb, fotos).
// La fecha de venta (soldAt) vive SOLO en products_private; nunca en products. Ver ADR 0005.
export async function markSold(id) {
  const batch = writeBatch(db);
  batch.update(doc(db, "products", id), { availability: "vendido", updatedAt: serverTimestamp() });
  batch.set(doc(db, "products_private", id), { soldAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

// RF-12: revertir a disponible; limpia soldAt sin tocar cost ni demás campos privados.
export async function markAvailable(id) {
  const batch = writeBatch(db);
  batch.update(doc(db, "products", id), { availability: "disponible", updatedAt: serverTimestamp() });
  batch.set(doc(db, "products_private", id), { soldAt: deleteField() }, { merge: true });
  await batch.commit();
}

export async function removeProduct(id) {
  const batch = writeBatch(db);
  (await getDocs(collection(db, "products", id, "photos"))).forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "products_private", id));
  batch.delete(doc(db, "products", id));
  await batch.commit();
}
