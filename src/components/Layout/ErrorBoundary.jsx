import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to your error reporting service
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // You can also log the error to an error reporting service here
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Example error logging - replace with your preferred service
    // (Sentry, LogRocket, Bugsnag, etc.)
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous',
        errorId: this.state.errorId
      };

      // Log to console for development
      console.error('Logging error:', errorData);

      // In production, send to your error tracking service
      if (process.env.NODE_ENV === 'production' && this.props.onError) {
        this.props.onError(errorData);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI based on props
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error while loading this page. 
                Don't worry, our team has been notified and we're working to fix it.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Bug className="h-4 w-4 mr-2" />
                    Error Details (Development)
                  </h3>
                  <div className="text-xs text-gray-700 font-mono space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <details className="cursor-pointer">
                        <summary className="font-semibold">Stack Trace</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <details className="cursor-pointer">
                        <summary className="font-semibold">Component Stack</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Error ID */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Error ID: <span className="font-mono">{this.state.errorId}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please include this ID when reporting the issue.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </button>
                </div>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </button>

                {/* Contact Support */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">
                    Still having trouble? Contact our support team:
                  </p>
                  <a
                    href={`mailto:support@example.com?subject=Error Report - ${this.state.errorId}&body=Error ID: ${this.state.errorId}%0D%0A%0D%0APlease describe what you were doing when this error occurred:`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Report this issue
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different use cases
export const JobsErrorBoundary = ({ children, onError }) => (
  <ErrorBoundary
    onError={onError}
    fallback={(error, errorInfo, retry) => (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to load jobs
        </h3>
        <p className="text-gray-600 mb-4">
          We're having trouble loading the jobs page. Please try again.
        </p>
        <button
          onClick={retry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const FormErrorBoundary = ({ children, onError }) => (
  <ErrorBoundary
    onError={onError}
    fallback={(error, errorInfo, retry) => (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h4 className="text-yellow-800 font-medium">Form Error</h4>
            <p className="text-yellow-700 text-sm mt-1">
              There was an error with the form. Please refresh and try again.
            </p>
          </div>
        </div>
        <button
          onClick={retry}
          className="mt-3 text-yellow-800 hover:text-yellow-900 text-sm font-medium"
        >
          Reset Form
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary = ({ children, onError }) => (
  <ErrorBoundary
    onError={onError}
    fallback={(error, errorInfo, retry) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Error</h1>
          <p className="text-gray-600 mb-6">Something went wrong loading this page.</p>
          <div className="space-x-4">
            <button
              onClick={retry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Hook for handling async errors in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Error reporting utility
export const reportError = (error, errorInfo = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...errorInfo
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error reported:', errorData);
  }

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Replace with your error tracking service
    // Example: Sentry.captureException(error, { extra: errorData });
    console.error('Production error:', errorData);
  }
};

export default ErrorBoundary;