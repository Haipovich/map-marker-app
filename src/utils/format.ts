export function markerTitle(id: number): string {
  return `Маркер ${id}`;
}

export function formatDbDate(value: string): string {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU');
}