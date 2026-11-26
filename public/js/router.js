export function parseRoute(hash = "") {
  const path = String(hash).replace(/^#\/?/, "").split("?")[0];
  const [a, b] = path.split("/").filter(Boolean);
  if (!a) return { name: "list" };
  if (a === "producto" && b) return { name: "detail", id: decodeURIComponent(b) };
  if (a === "admin") return { name: "admin" };
  return { name: "notfound" };
}
