import { supabase } from './supabase';

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`/.netlify/functions/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'API request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}
