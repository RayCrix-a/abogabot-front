import React, { Component, ErrorInfo, ReactNode } from 'react';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onErrorReset?: () => void;
}

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    // Solo capturar errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        hasError: true,
        error,
      };
    }
    
    // Para otros tipos de errores, dejar que los maneje otro error boundary
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Error de red capturado en NetworkErrorBoundary:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onErrorReset) {
      this.props.onErrorReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Componente de error predeterminado
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Error de conexión
          </h2>
          <p className="text-gray-600 mb-4 text-center">
            No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.
          </p>
          <button
            onClick={this.resetError}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition duration-150"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
