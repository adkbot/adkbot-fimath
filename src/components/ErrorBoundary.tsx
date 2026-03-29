import React, { Component, ErrorInfo, ReactNode } from "react";

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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono">
          <h1 className="text-magenta-500 text-2xl font-black mb-4 uppercase tracking-widest">
            [!] ERRO DE SISTEMA
          </h1>
          <div className="bg-white/5 border border-white/10 p-6 rounded-sm max-w-2xl w-full overflow-auto">
            <p className="text-cyan-400 mb-4 font-bold">
              Ocorreu um erro crítico na execução do ADKBOT Quantum.
            </p>
            <pre className="text-[10px] text-white/60 whitespace-pre-wrap">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 bg-cyan-500 text-black px-6 py-2 font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all"
          >
            Reiniciar Sistema
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
