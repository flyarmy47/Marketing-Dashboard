import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('settings/tenant')
      .then((tenant) => {
        setOrgName(tenant.name);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await apiFetch('settings/tenant', {
      method: 'PUT',
      body: JSON.stringify({ name: orgName }),
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your account and organization.</p>

      <div className="mt-8 max-w-lg space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Account</h2>
          <div className="mt-4 text-sm text-gray-600">
            <p>Email: <span className="font-medium text-gray-900">{user.email}</span></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Organization</h2>
          <div className="mt-4">
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-base font-semibold text-red-900">Danger Zone</h2>
          <p className="mt-1 text-sm text-red-700">Sign out of your account.</p>
          <button
            onClick={signOut}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
