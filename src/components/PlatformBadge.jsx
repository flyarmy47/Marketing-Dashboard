import clsx from 'clsx';

const platformNames = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
};

export default function PlatformBadge({ platform, connected }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
      <span
        className={clsx(
          'h-2 w-2 rounded-full',
          connected ? 'bg-green-500' : 'bg-gray-300'
        )}
      />
      {platformNames[platform] || platform}
    </span>
  );
}
