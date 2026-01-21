import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 24, color, className }) => {
  // Normalize name: Convert kebab-case to PascalCase (e.g., 'map-pin' -> 'MapPin')
  const iconName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const IconComponent = (LucideIcons as any)[iconName];

  if (!IconComponent) {
    // Fallback icon
    const Fallback = LucideIcons.HelpCircle || LucideIcons.AlertCircle;
    return <Fallback size={size} color={color} className={className} />;
  }

  return <IconComponent size={size} color={color} className={className} />;
};

export default DynamicIcon;
