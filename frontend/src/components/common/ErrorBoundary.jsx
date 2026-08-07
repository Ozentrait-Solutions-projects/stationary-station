import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Unhandled React Component Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-display font-black text-xl text-gray-900 mb-1">
                Something went wrong
              </h2>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                We're having trouble loading this page. Please try refreshing or return to the home page.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
