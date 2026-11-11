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
