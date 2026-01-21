import React from 'react';
import { ParsedLink } from '../utils';

interface WikiLinkPreviewProps {
  links: ParsedLink[];
}

const WikiLinkPreview: React.FC<WikiLinkPreviewProps> = ({ links }) => {
  if (links.length === 0) return null;

  // Deduplicate links by value (slug)
  const uniqueLinks = React.useMemo(() => {
    const seen = new Set<string>();
    return links.filter(link => {
      const key = link.value.toLowerCase(); // Deduplicate based on slug/value
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [links]);

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {uniqueLinks.map((link, i) => (
        <span
          key={i}
          className={`text-xs px-2 py-1 rounded border ${
            link.entryId
              ? 'bg-success/20 text-success border-success/30'
              : 'bg-primary/20 text-txt-accent border-primary/30'
          }`}
        >
          {link.type === 'mention' ? '@' : '#'}{link.displayValue}
          {link.entryId ? ' ✓' : ' + (Novo)'}
        </span>
      ))}
    </div>
  );
};

export default WikiLinkPreview;
