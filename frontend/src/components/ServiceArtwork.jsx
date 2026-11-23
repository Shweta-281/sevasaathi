const identityCategories = new Set(['Aadhaar', 'PAN', 'Voter ID', 'Driving Licence']);

export default function ServiceArtwork({ category = '', serviceName = '', className = '' }) {
  const src = getServiceImage(category, serviceName);

  return (
    <div className={`relative isolate overflow-hidden bg-ink-100 ${className}`}>
      <img
        src={src}
        alt={`${category || 'Document'} service example`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-700 shadow-sm">
        {category || 'Service'} · Sample artwork
      </span>
    </div>
  );
}
import { getServiceImage } from '../lib/images.js';
