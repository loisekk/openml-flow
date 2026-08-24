import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
  onClose?: () => void;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label ?? 'ErrorBoundary'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#0A1426', border: '1px solid #EF4444', borderRadius: 10, padding: 24, maxWidth: 520, color: '#F4F7FB' }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: '#EF4444' }}>⚠️ {this.props.label ?? 'Component'} crashed</div>
          <pre style={{ fontSize: 12, color: '#9AA9BF', whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto' }}>{this.state.error.message}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => this.setState({ error: null })} style={{ background: '#FF7A00', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Retry</button>
            {this.props.onClose && (
              <button onClick={this.props.onClose} style={{ background: 'none', border: '1px solid #18253A', color: '#9AA9BF', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Close</button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
