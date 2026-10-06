import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-6xl mb-4" aria-hidden="true">🌱</p>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Page not found</h1>
      <p className="text-stone-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700">Back to home</Link>
    </div>
  );
}
