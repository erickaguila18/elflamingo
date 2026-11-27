/* Lógica pura: resumen financiero del catálogo para el panel admin (RF-10).
 * Cada producto cuenta como 1 unidad (no hay campo de cantidad).
 * products: [{ id, price, availability }] · costs: { id: cost }.
 * Solo los productos con precio numérico válido y costo numérico válido
 * entran en investment, salesValue y profit; los demás suman en withoutCost.
 */

const isValidNumber = (n) => typeof n === "number" && Number.isFinite(n);

function round(n, decimals) {
  const factor = 10 ** decimals;
  const r = Math.round((n + Number.EPSILON) * factor) / factor;
  return r === 0 ? 0 : r; // normaliza -0
}

const round2 = (n) => round(n, 2);

const emptyBucket = () => ({ count: 0, investment: 0, salesValue: 0, profit: 0 });

export function summarize(products, costs = {}) {
  const list = Array.isArray(products) ? products : [];
  const costMap = costs ?? {};

  const summary = {
    totalProducts: list.length,
    available: 0,
    soldOut: 0,
    withCost: 0,
    withoutCost: 0,
    investment: 0,
    salesValue: 0,
    profit: 0,
    marginPct: null,
    byAvailability: { disponible: emptyBucket(), agotado: emptyBucket() },
  };

  for (const p of list) {
    const disponible = p?.availability === "disponible";
    const bucket = disponible ? summary.byAvailability.disponible : summary.byAvailability.agotado;
    if (disponible) summary.available++;
    else summary.soldOut++;
    bucket.count++;

    const price = p?.price;
    const cost = costMap[p?.id];
    if (!isValidNumber(price) || !isValidNumber(cost)) {
      summary.withoutCost++;
      continue;
    }
    summary.withCost++;

    const investment = cost;
    const salesValue = price;

    summary.investment += investment;
    summary.salesValue += salesValue;
    bucket.investment += investment;
    bucket.salesValue += salesValue;
  }

  summary.investment = round2(summary.investment);
  summary.salesValue = round2(summary.salesValue);
  summary.profit = round2(summary.salesValue - summary.investment);
  summary.marginPct = summary.salesValue === 0 ? null : round(summary.profit / summary.salesValue * 100, 1);

  for (const key of ["disponible", "agotado"]) {
    const b = summary.byAvailability[key];
    b.investment = round2(b.investment);
    b.salesValue = round2(b.salesValue);
    b.profit = round2(b.salesValue - b.investment);
  }

  return summary;
}
