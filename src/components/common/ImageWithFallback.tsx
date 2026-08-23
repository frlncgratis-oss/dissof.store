import React, { useState } from 'react';

// Reliable, high-res curated accessories placeholders from Unsplash
export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80';
export const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80';
export const FALLBACK_AVATAR_IMAGE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

// Clean SVG inline fallback if network is completely offline
const SVG_FALLBACK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23FFEFF1"><rect width="400" height="400" fill="%23F9F7F2"/><circle cx="200" cy="180" r="60" fill="%23FFD1DC"/><path d="M160 270 Q200 240 240 270" stroke="%23FF9AA2" stroke-width="8" stroke-linecap="round" fill="none"/><text x="200" y="320" font-family="sans-serif" font-size="16" font-weight="bold" fill="%232D2D2D" text-anchor="middle">DISSOF.ID ♡</text></svg>`;

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'DISSOF.ID Accessory',
  fallbackSrc = FALLBACK_PRODUCT_IMAGE,
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasErrored, setHasErrored] = useState(false);

  // Update src if prop changes
  React.useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasErrored(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasErrored) {
      setHasErrored(true);
      setImgSrc(fallbackSrc);
    } else {
      // If even fallbackSrc failed, use embedded SVG
      setImgSrc(SVG_FALLBACK);
    }
  };

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      onError={handleError}
      className={className}
      loading={props.loading || 'lazy'}
      {...props}
    />
  );
};


