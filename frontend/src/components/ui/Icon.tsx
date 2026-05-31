import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 14,
  md: 16,
  lg: 20,
};

export function Icon({ icon: IconComponent, size = 'md', className = '' }: IconProps) {
  return (
    <IconComponent
      size={sizes[size]}
      strokeWidth={1.75}
      className={className}
      aria-hidden="true"
    />
  );
}
