import React from 'react';
import { InventoryItem } from '../types';

interface InventoryGridItemProps {
  item: InventoryItem;
  onUse: () => void;
}

const DEFAULT_ICON = 'swap-bag';

const InventoryGridItem: React.FC<InventoryGridItemProps> = ({ item, onUse }) => {
  const iconUrl = item.icon ? `/icons/${item.icon}.svg` : `/icons/${DEFAULT_ICON}.svg`;
  const iconColor = item.iconColor || 'rgb(var(--text-main))';

  return (
    <button
      onClick={onUse}
      className="relative aspect-square rounded-lg bg-card border border-border
                 overflow-hidden
                 active:bg-card-hover transition-colors hover:border-primary/50"
      title={item.name}
    >
      {/* LAYER 1 (Background): Icon - fills most of the card */}
      <div
        className="absolute inset-1"
        style={{
          backgroundColor: iconColor,
          maskImage: `url("${iconUrl}")`,
          WebkitMaskImage: `url("${iconUrl}")`,
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
        }}
      />

      {/* LAYER 2 (Top): Info overlays */}
      {/* TOP-RIGHT: Quantity (only for non-permanent items) */}
      {!item.isPermanent && (
        <div className="absolute -top-0.5 -right-0.5">
          <span className="text-sm font-bold text-primary bg-app rounded px-1.5 min-w-[22px] text-center leading-6">
            {item.quantity}
          </span>
        </div>
      )}

      {/* BOTTOM-LEFT: Dice notation */}
      {item.dice && (
        <div className="absolute bottom-0 left-0 right-0">
          <span className="text-[11px] font-mono text-txt-muted bg-app/90 rounded-tr px-1 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis block max-w-full">
            {item.dice}
          </span>
        </div>
      )}
    </button>
  );
};

export default InventoryGridItem;
