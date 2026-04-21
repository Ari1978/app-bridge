export function cleanString(value: unknown, maxLength?: number): string {
  let result = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

export function cleanCuit(value: unknown): string {
  return String(value ?? '').replace(/[^\d]/g, '');
}

export function formatAccessDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    throw new Error(`Fecha inválida: ${date}`);
  }

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
}