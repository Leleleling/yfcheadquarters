// 统一时间格式化：始终使用浏览器本地时区显示，避免 UTC 带来的时差偏差。
const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', DATE_OPTS);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** 距离截止日期已逾期的天数（不足 1 天按 0 处理）。 */
export function daysOverdue(dueAt: string): number {
  const diff = Date.now() - new Date(dueAt).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/** ISO → <input type="datetime-local"> 的本地值（YYYY-MM-DDTHH:mm）。 */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 本地值 → ISO，用于提交给后端。 */
export function fromLocalInputValue(local: string): string {
  return new Date(local).toISOString();
}

/** 短日期（月日 时:分），用于通知文案。 */
export function formatDueShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
