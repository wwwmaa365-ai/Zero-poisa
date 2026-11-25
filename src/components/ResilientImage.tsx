import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-48 object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2 shrink-0" />
        <span className="text-sm font-semibold tracking-tight text-slate-100 line-clamp-2">
          {fallbackTitle || alt}
        </span>
        <span className="text-xs text-slate-400 mt-1">Authorized GroMo Partner Product</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
