/**
 * Date Tool — Retorna a data atual no formato YYYY-MM-DD.
 *
 * Recebe um objeto de argumentos padronizado (mesmo que vazio).
 */

export function getCurrentDate(_args = {}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
