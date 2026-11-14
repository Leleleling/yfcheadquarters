import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/**
 * 全局错误兜底：任何子树渲染抛错时不再整页白屏，
 * 显示错误提示与「重新加载」按钮。
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-500">
          <p className="text-base font-medium">页面出现了一点问题</p>
          <p className="max-w-md px-4 text-center text-sm text-gray-400">
            渲染时发生了意外错误。你可以重新加载页面恢复，若反复出现请联系管理员。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
