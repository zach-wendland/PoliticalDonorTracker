// ErrorBoundary - React error boundary for graceful error handling

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertOctagon, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to show on error (optional - uses default if not provided) */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Component name for error reporting */
  componentName?: string;
  /** Whether to show detailed error info (dev mode) */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', {
      component: this.props.componentName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    });
  };

  toggleStack = (): void => {
    this.setState(prev => ({ showStack: !prev.showStack }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showStack } = this.state;
    const { children, fallback, componentName, showDetails } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      const isDev = import.meta.env.DEV || showDetails;

      return (
        <div className="bg-red-900/10 border border-red-800/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-900/30 rounded-lg">
              <AlertOctagon className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-red-400">
                Something went wrong
                {componentName && (
                  <span className="text-sm font-normal text-red-400/70 ml-2">
                    in {componentName}
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                An unexpected error occurred. You can try refreshing this section.
              </p>

              {isDev && error && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm text-red-300 font-mono bg-red-900/20 px-3 py-2 rounded">
                    <Bug className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{error.message}</span>
                  </div>

                  {errorInfo?.componentStack && (
                    <button
                      onClick={this.toggleStack}
                      className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                    >
                      {showStack ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showStack ? 'Hide' : 'Show'} component stack
                    </button>
                  )}

                  {showStack && errorInfo?.componentStack && (
                    <pre className="mt-2 text-xs text-slate-500 font-mono bg-slate-900/50 p-3 rounded overflow-x-auto max-h-48">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <button
                onClick={this.handleReset}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
