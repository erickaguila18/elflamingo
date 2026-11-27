/* Lógica pura: resumen financiero del catálogo para el panel admin (RF-10).
 * Cada producto cuenta como 1 unidad (no hay campo de cantidad).
 * products: [{ id, price, availability }] · costs: { id: cost }.
 * Disponibilidad: "disponible" | "vendido"; cualquier otro estado va a "agotado".
 * Solo los productos con precio numérico válido y costo numérico válido
 * entran en investment, salesValue y profit; los demás suman en withoutCost.
 * realizedProfit: profit de la cubeta "vendido" · pendingProfit: profit de "disponible" + "agotado".
 */

const isValidNumber = (n) => typeof n === "number" && Number.isFinite(n);

function round(n, decimals) {
  const factor = 10 ** decimals;
  const r = Math.round((n + Number.EPSILON) * factor) / factor;
  return r === 0 ? 0 : r; // normaliza -0
}

const round2 = (n) => round(n, 2);

const BUCKETS = ["disponible", "agotado", "vendido"];

const emptyBucket = () => ({ count: 0, investment: 0, salesValue: 0, profit: 0 });

const bucketFor = (availability) =>
  availability === "disponible" ? "disponible" : availability === "vendido" ? "vendido" : "agotado";

export function summarize(products, costs = {}) {
  const list = Array.isArray(products) ? products : [];
  const costMap = costs ?? {};

  const summary = {
    totalProducts: list.length,
    available: 0,
    soldOut: 0,
    sold: 0,
    withCost: 0,
    withoutCost: 0,
    investment: 0,
    salesValue: 0,
    profit: 0,
    marginPct: null,
    realizedProfit: 0,
    pendingProfit: 0,
    byAvailability: { disponible: emptyBucket(), agotado: emptyBucket(), vendido: emptyBucket() },
  };

  for (const p of list) {
    const key = bucketFor(p?.availability);
    const bucket = summary.byAvailability[key];
    if (key === "disponible") summary.available++;
    else if (key === "vendido") summary.sold++;
    else summary.soldOut++;
    bucket.count++;

    const price = p?.price;
    const cost = costMap[p?.id];
    if (!isValidNumber(price) || !isValidNumber(cost)) {
      summary.withoutCost++;
      continue;
    }
    summary.withCost++;

    summary.investment += cost;
    summary.salesValue += price;
    bucket.investment += cost;
    bucket.salesValue += price;
  }

  summary.investment = round2(summary.investment);
  summary.salesValue = round2(summary.salesValue);
  summary.profit = round2(summary.salesValue - summary.investment);
  summary.marginPct = summary.salesValue === 0 ? null : round(summary.profit / summary.salesValue * 100, 1);

  for (const key of BUCKETS) {
    const b = summary.byAvailability[key];
    b.investment = round2(b.investment);
    b.salesValue = round2(b.salesValue);
    b.profit = round2(b.salesValue - b.investment);
  }

  const vendido = summary.byAvailability.vendido;
  summary.realizedProfit = round2(vendido.profit);
  summary.pendingProfit = round2(summary.byAvailability.disponible.profit + summary.byAvailability.agotado.profit);

  return summary;
}
