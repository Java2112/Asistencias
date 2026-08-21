// Envuelve un manejador async para que cualquier excepción llegue al
// middleware de errores en vez de quedar como promesa rechazada.
export function asincrono(manejador) {
  return (req, res, next) => Promise.resolve(manejador(req, res, next)).catch(next);
}
