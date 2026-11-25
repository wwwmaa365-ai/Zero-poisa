import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900">
                Application Security / State Alert
              </h2>
            </div>
            <p className="text-xs font-mono bg-slate-100 p-3.5 rounded-xl text-slate-700 break-all">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Recover Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
