import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
