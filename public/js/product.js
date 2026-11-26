/* Lógica pura: arma los datos de un producto desde los campos del formulario. */
import { parsePrice } from "./validation.js";

export function buildProduct(fields) {
  const data = {
    name: (fields.name ?? "").trim(),
    description: (fields.description ?? "").trim(),
    price: parsePrice(fields.price),
    availability: fields.availability,
  };
  const cost = parsePrice(fields.cost);
  return { data, cost };
}
