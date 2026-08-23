import React from 'react';
import { useStore } from '../../context/StoreContext';

interface StackedSectionProps {
  children: React.ReactNode;
  index: number;
  id?: string;
  className?: string;
  containerClassName?: string;
  hasTopShadow?: boolean;
  roundedTop?: boolean;
  style?: React.CSSProperties;
}

export const StackedSection: React.FC<StackedSectionProps> = ({
  children,
  index,
  id,
  className = '',
  containerClassName = '',
  hasTopShadow = true,
  roundedTop = true,
  style = {},
}) => {
  const { storeBackground } = useStore();

  // Dynamic surface color from custom store settings or default warm pastel
  const surfaceBg = React.useMemo(() => {
    if (storeBackground?.value && storeBackground.value.startsWith('#')) {
      return storeBackground.value;
    }
    return '#FAF8F5';
  }, [storeBackground]);

  return (
    <div
      id={id}
      className={`relative w-full ${containerClassName}`}
      style={{
        ...style,
      }}
    >
      <div
        className={`w-full ${
          roundedTop && index > 0 ? 'rounded-t-[28px] sm:rounded-t-[40px]' : ''
        } ${
          hasTopShadow && index > 0
            ? 'shadow-[0_-10px_30px_rgba(46,36,30,0.04)] border-t border-pink-100/70'
            : ''
        } ${className}`}
        style={{
          backgroundColor: surfaceBg,
          opacity: 1,
          visibility: 'visible',
          transform: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

