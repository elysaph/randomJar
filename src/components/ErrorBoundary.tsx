import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: ''
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App crashed:', error, errorInfo);
    }

    private handleReset = () => {
        localStorage.removeItem('randomJar-save-v1');
        localStorage.removeItem('goal-weighted-lottery');
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(140deg, #f7f1e6 0%, #e6f1fb 55%, #e6f4e5 100%)' }}>
                    <div className="panel p-6 max-w-xl w-full text-center">
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-slate-600 mb-4">
                            The app hit an unexpected error. You can safely reset saved local data and reload.
                        </p>
                        {this.state.errorMessage && (
                            <p className="text-sm text-red-600 mb-4 break-words">{this.state.errorMessage}</p>
                        )}
                        <button className="btn btn-primary px-4 py-2" onClick={this.handleReset}>
                            Reset Local Data and Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
