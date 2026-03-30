import { createClient } from '@supabase/supabase-js';
import { refreshGoogleAds } from './refresh-google.js';
import { refreshMetaAds } from './refresh-meta.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  schedule: '0 * * * *', // Every hour
};

export default async function handler() {
  const { data: connections, error } = await supabase
    .from('connections')
    .select('id, platform');

  if (error) {
    console.error('Failed to fetch connections:', error);
    return new Response('Error', { status: 500 });
  }

  const results = [];

  for (const conn of connections || []) {
    try {
      let result;
      if (conn.platform === 'google_ads') {
        result = await refreshGoogleAds(conn.id);
      } else if (conn.platform === 'meta_ads') {
        result = await refreshMetaAds(conn.id);
      }
      results.push({ connectionId: conn.id, platform: conn.platform, status: 'success', ...result });
    } catch (err) {
      console.error(`Refresh failed for ${conn.platform} (${conn.id}):`, err.message);
      results.push({ connectionId: conn.id, platform: conn.platform, status: 'error', error: err.message });
    }
  }

  console.log('Refresh completed:', JSON.stringify(results));
  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
