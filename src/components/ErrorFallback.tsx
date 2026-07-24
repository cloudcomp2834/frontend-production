// Sits above the router (main.tsx), so no react-router hooks here - a plain reload
// is the only reliable recovery action at this level.
export const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="card text-center py-12 max-w-md">
      <div className="text-gray-400 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-8">
        An unexpected error occurred. It's been reported automatically - try reloading the page.
      </p>
      <button onClick={() => window.location.reload()} className="btn-primary">
        Reload
      </button>
    </div>
  </div>
);
