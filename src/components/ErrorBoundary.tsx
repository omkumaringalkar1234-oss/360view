import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-900 border border-dark-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-dark-300 text-sm mb-6">
              An unexpected error occurred while rendering the application. You can reload or reset local data.
            </p>

            {this.state.error?.message && (
              <div className="bg-dark-950/80 border border-dark-800 rounded-xl p-3 mb-6 text-left overflow-x-auto text-xs font-mono text-red-300/90">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 font-medium rounded-xl transition-colors text-sm"
              >
                <Home className="w-4 h-4" />
                Reset & Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
