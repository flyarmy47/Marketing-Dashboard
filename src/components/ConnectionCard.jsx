import PlatformBadge from './PlatformBadge';

const platformMeta = {
  google_ads: {
    name: 'Google Ads',
    description: 'Connect your Google Ads account to import campaign performance data.',
    color: 'bg-blue-50 border-blue-200',
  },
  meta_ads: {
    name: 'Meta Ads',
    description: 'Connect your Meta (Facebook/Instagram) Ads account to import campaign data.',
    color: 'bg-indigo-50 border-indigo-200',
  },
};

export default function ConnectionCard({ platform, connection, onConnect, onDisconnect }) {
  const meta = platformMeta[platform];
  const isConnected = !!connection;

  return (
    <div className={`rounded-xl border p-6 ${meta.color}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{meta.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{meta.description}</p>
        </div>
        <PlatformBadge platform={platform} connected={isConnected} />
      </div>

      {isConnected && (
        <div className="mt-4 text-sm text-gray-500">
          {connection.account_name && (
            <p>Account: <span className="font-medium text-gray-700">{connection.account_name}</span></p>
          )}
          {connection.last_synced_at && (
            <p>Last synced: {new Date(connection.last_synced_at).toLocaleString()}</p>
          )}
        </div>
      )}

      <div className="mt-4">
        {isConnected ? (
          <button
            onClick={() => onDisconnect(connection.id)}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => onConnect(platform)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
