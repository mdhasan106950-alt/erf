import React, { useEffect, useState } from 'react';
import { Cube } from '@phosphor-icons/react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  fallbackClassName?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel = 'IRON CLOUD MC',
  fallbackClassName = '',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel}
        className={`flex flex-col items-center justify-center bg-[#0B1F12] border border-[#243C2A] text-[#9BAD9F] text-center p-3 ${className} ${fallbackClassName}`}
      >
        <Cube size={20} weight="bold" className="text-[#16A34A] mb-1 shrink-0" aria-hidden="true" />
        <span className="font-mono-data caption-5 text-[#E8F0E9] truncate max-w-full">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}
