import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-slate-800 max-w-md w-full">
            <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              An error occurred while rendering this component. Please try refreshing the page.
            </p>
            <div className="mt-4 rounded bg-slate-100 p-4 dark:bg-slate-700">
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                {this.state.error?.message}
              </p>
            </div>
            <button
              className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}