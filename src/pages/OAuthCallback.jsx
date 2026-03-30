import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const status = searchParams.get('status');
  const errorMsg = searchParams.get('error');

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/connections'), 2000);
      return () => clearTimeout(timer);
    }
    if (errorMsg) {
      setError(errorMsg);
    }
  }, [status, errorMsg, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Connection Failed</h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/connections')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to Connections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        {status === 'success' ? (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Connected Successfully</h2>
            <p className="mt-2 text-sm text-gray-500">Redirecting to connections...</p>
          </>
        ) : (
          <>
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">Processing connection...</p>
          </>
        )}
      </div>
    </div>
  );
}
