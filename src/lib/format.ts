// 백엔드 LocalDateTime은 타임존 없는 문자열(2026-09-22T06:00:00)이므로 로컬 시간으로 그대로 해석한다.
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}
