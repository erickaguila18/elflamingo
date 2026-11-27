// Lógica pura de venta: sin Firebase ni DOM. Construye los payloads para store.js.
export function soldUpdate(ts) {
  return {
    product: { availability: "vendido", updatedAt: ts },
    priv: { soldAt: ts },
  };
}

export function availableUpdate(ts, del) {
  return {
    product: { availability: "disponible", updatedAt: ts },
    priv: { soldAt: del },
  };
}
