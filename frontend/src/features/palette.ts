/** Paleta pastel para listas de compra (nombres compatibles con los datos guardados) */
export const PALETTE: Record<string, { name: string; c: string; cs: string }> = {
  rosa: { name: 'Rosa', c: 'var(--k-birthday)', cs: 'var(--k-birthday-soft)' },
  durazno: { name: 'Durazno', c: 'var(--k-reminder)', cs: 'var(--k-reminder-soft)' },
  coral: { name: 'Coral', c: 'var(--k-routine)', cs: 'var(--k-routine-soft)' },
  limon: { name: 'Limón', c: 'var(--k-limon)', cs: 'var(--k-limon-soft)' },
  salvia: { name: 'Salvia', c: 'var(--k-shopping)', cs: 'var(--k-shopping-soft)' },
  menta: { name: 'Menta', c: 'var(--k-teal)', cs: 'var(--k-teal-soft)' },
  cielo: { name: 'Cielo', c: 'var(--k-event)', cs: 'var(--k-event-soft)' },
  lavanda: { name: 'Lavanda', c: 'var(--k-task)', cs: 'var(--k-task-soft)' },
  lila: { name: 'Lila', c: 'var(--k-wish)', cs: 'var(--k-wish-soft)' },
}
const ALIAS: Record<string, string> = { verde: 'salvia', turquesa: 'menta', azul: 'cielo', naranja: 'coral' }
export const palOf = (n: string) => PALETTE[ALIAS[n] || n] || PALETTE.salvia
