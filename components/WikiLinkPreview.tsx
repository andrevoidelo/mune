import React from 'react';
import { ParsedLink } from '../utils';
import { Dices, Library } from 'lucide-react';

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
          className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
            link.type === 'dice'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono'
              : link.type === 'collection'
                ? 'bg-green-500/20 text-green-500 border-green-500/30 font-medium'
                : link.type === 'bold'
                  ? 'bg-txt-muted/10 text-txt-muted border-txt-muted/20 font-bold'
                  : link.entryId
                    ? 'bg-success/20 text-success border-success/30'
                    : 'bg-primary/20 text-txt-accent border-primary/30'
          }`}
        >
          {link.type === 'mention' && '@'}
          {link.type === 'tag' && '#'}
          {link.type === 'dice' && <Dices size={12} />}
          {link.type === 'collection' && <Library size={12} />}
          {link.displayValue}
          {(link.type === 'mention' || link.type === 'tag') && (link.entryId ? ' ✓' : ' + (Novo)')}
        </span>
      ))}
    </div>
  );
};

export default WikiLinkPreview;
