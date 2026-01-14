import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
        <div className="min-h-screen bg-app flex items-center justify-center p-4">
          <div className="bg-card border border-error/50 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="bg-error/20 p-4 rounded-full inline-flex mb-6">
                <AlertTriangle size={48} className="text-error" />
            </div>
            
            <h1 className="text-2xl font-bold text-txt-main mb-2">Erro Crítico</h1>
            <p className="text-txt-muted text-sm mb-6">
              Ocorreu um erro inesperado. Tente recarregar a aplicação.
            </p>
            
            {this.state.error && (
                <div className="bg-app/50 p-3 rounded-lg text-left mb-6 overflow-auto max-h-32 border border-border">
                    <code className="text-[10px] text-error font-mono">
                        {this.state.error.toString()}
                    </code>
                </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-error hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCcw size={18} />
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
