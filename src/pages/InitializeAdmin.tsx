import { useState } from 'react';
import { createAdminUser } from '../utils/createAdminUser';

export default function InitializeAdmin() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setStatus('Creating admin user...');

    const result = await createAdminUser();

    if (result.success) {
      setStatus('Admin user created successfully! You can now login with the credentials.');
    } else {
      setStatus(`Error: ${result.error?.message || 'Failed to create admin user'}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Initialize Admin User</h1>
        <p className="text-slate-600 mb-6">
          Click the button below to create the admin user with the specified credentials.
        </p>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Admin User'}
        </button>

        {status && (
          <div className="mt-4 p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-700">{status}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-slate-500">
          <p className="font-medium mb-2">Credentials:</p>
          <p>Email: sunilsu0@gmail.com</p>
          <p>Password: Astroid@12</p>
        </div>
      </div>
    </div>
  );
}
