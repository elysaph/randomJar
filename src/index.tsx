// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const showFatalError = (message: string) => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        return;
    }

    rootElement.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(140deg,#f7f1e6 0%,#e6f1fb 55%,#e6f4e5 100%);font-family:'Segoe UI',sans-serif;">
            <div style="max-width:780px;width:100%;background:#ffffff;border:1px solid #dbe5f1;border-radius:14px;padding:20px;box-shadow:0 12px 30px rgba(15,23,42,.16);">
                <h1 style="margin:0 0 8px;font-size:24px;color:#1f2937;">Startup Error</h1>
                <p style="margin:0 0 12px;color:#475569;">The app crashed before rendering. Details:</p>
                <pre style="white-space:pre-wrap;word-break:break-word;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;color:#b91c1c;">${message}</pre>
                <button id="retry-app-btn" style="margin-top:12px;padding:10px 14px;border:none;border-radius:10px;background:#d85f3b;color:#fff;font-weight:700;cursor:pointer;">Clear local data and reload</button>
            </div>
        </div>
    `;

    const retryButton = document.getElementById('retry-app-btn');
    retryButton?.addEventListener('click', () => {
        localStorage.removeItem('randomJar-save-v1');
        localStorage.removeItem('goal-weighted-lottery');
        window.location.reload();
    });
};

window.addEventListener('error', (event) => {
    showFatalError(event.error?.message || event.message || 'Unknown runtime error');
});

window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonText = reason instanceof Error ? reason.message : String(reason);
    showFatalError(reasonText || 'Unhandled promise rejection');
});

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

try {
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>
    );
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showFatalError(message);
}