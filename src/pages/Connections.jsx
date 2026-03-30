import ConnectionCard from '../components/ConnectionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import useConnections from '../hooks/useConnections';

const PLATFORMS = ['google_ads', 'meta_ads'];

export default function Connections() {
  const { connections, loading, remove } = useConnections();

  const handleConnect = (platform) => {
    window.location.href = `/api/oauth/${platform.replace('_', '-')}/start`;
  };

  const handleDisconnect = async (connectionId) => {
    if (window.confirm('Are you sure you want to disconnect this platform?')) {
      await remove(connectionId);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="mt-1 text-sm text-gray-500">Connect your ad platforms to start importing data.</p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <ConnectionCard
              key={platform}
              platform={platform}
              connection={connections.find((c) => c.platform === platform)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
