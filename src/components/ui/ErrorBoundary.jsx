import React, { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.props.customMessage ||
        "Something went wrong. The visualization may not be working correctly.";

      const showDetails =
        this.props.showDetails !== false &&
        this.state.error &&
        process.env.NODE_ENV === "development";

      return (
        <div className="error-boundary">
          <div className="error-overlay" />

          <div className="error-container">
            <div className="error-icon">
              <AlertTriangle size={24} />
            </div>

            <div className="error-content">
              <h3>Visualization Error</h3>
              <p>{errorMessage}</p>

              <div className="error-actions">
                <button
                  className="error-btn primary"
                  onClick={this.handleRetry}
                >
                  <RefreshCw size={14} />
                  <span>Retry Visualization</span>
                </button>

                {this.props.showReset !== false && (
                  <button
                    className="error-btn secondary"
                    onClick={this.handleReset}
                  >
                    <span>Reload Page</span>
                  </button>
                )}
              </div>

              {showDetails && (
                <div className="error-details">
                  <details>
                    <summary>Error Details (Development Only)</summary>
                    <div className="error-stack">
                      <code>{this.state.error.toString()}</code>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </details>
                </div>
              )}

              {this.props.children && (
                <div className="error-fallback">{this.props.children}</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent, errorBoundaryProps) => {
  return (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
