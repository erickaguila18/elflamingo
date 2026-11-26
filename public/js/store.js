// Modelo: products/{id} (+ /photos/{n}) público · products_private/{id} {cost} solo admin
import { db, fsM } from "./firebase.js";
const { collection, doc, getDocs, getDoc, writeBatch, query, orderBy, serverTimestamp } = fsM;

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

export async function removeProduct(id) {
  const batch = writeBatch(db);
  (await getDocs(collection(db, "products", id, "photos"))).forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "products_private", id));
  batch.delete(doc(db, "products", id));
  await batch.commit();
}
