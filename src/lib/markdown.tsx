import type { ReactNode } from 'react';

// 极简且安全的 Markdown：仅支持换行、**加粗**、自动链接。
// 返回 React 节点，不使用 dangerouslySetInnerHTML，避免 XSS。
export function renderSimpleMarkdown(text: string): ReactNode {
  return text.split('\n').map((line, li) => (
    <span key={li} className="block">
      {renderLine(line)}
    </span>
  ));
}

function renderLine(line: string): ReactNode {
  const tokens = line.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (/^https?:\/\//.test(tok)) {
      return (
        <a key={i} href={tok} target="_blank" rel="noreferrer" className="underline break-all">
          {tok}
        </a>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}
