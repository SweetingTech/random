import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <div className="bg-gray-800 rounded-lg p-4 mb-4 max-w-2xl w-full">
            <pre className="whitespace-pre-wrap text-red-400">
              {this.state.error?.message}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
