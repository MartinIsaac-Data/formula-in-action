import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort catch for a render crash. Deliberately styled with plain inline
 * CSS, not Fluent components — if the crash originated inside the Fluent
 * tree, the fallback must not depend on it. Shows the real error so a bug
 * report doesn't start from "the pane went blank".
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Formula in Action crashed:', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          fontFamily: 'Segoe UI, sans-serif',
          padding: '16px',
          color: '#242424',
          background: '#fff',
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ fontSize: '15px', margin: '0 0 8px' }}>Something went wrong</h2>
        <p style={{ fontSize: '13px', color: '#616161', margin: '0 0 12px' }}>
          {error.name}: {error.message}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '6px 14px',
            marginBottom: '12px',
            cursor: 'pointer',
            border: '1px solid #d1d1d1',
            borderRadius: '4px',
            background: '#f5f5f5',
          }}
        >
          Reload
        </button>
        {error.stack ? (
          <pre
            style={{
              fontSize: '11px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
            }}
          >
            {error.stack}
          </pre>
        ) : null}
      </div>
    );
  }
}
