import React, { useState, useEffect } from 'react';
import { optimizeCloudinaryUrl } from '@/utils/format';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc?: string;
  alt: string;
}

export function ProgressiveImage({ src, placeholderSrc, alt, className = '', ...props }: ProgressiveImageProps) {
  const optimizedSrc = optimizeCloudinaryUrl(src);
  const [imgSrc, setImgSrc] = useState(placeholderSrc || optimizedSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setImgSrc(placeholderSrc || optimizedSrc);

    if (placeholderSrc && optimizedSrc) {
      const img = new Image();
      img.src = optimizedSrc;
      img.onload = () => {
        setImgSrc(optimizedSrc);
        setIsLoaded(true);
      };
    } else {
      setIsLoaded(true);
    }
  }, [optimizedSrc, placeholderSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      decoding="async"
      {...props}
      className={`transition-all duration-700 ease-in-out ${
        isLoaded ? 'blur-0 scale-100' : 'blur-md scale-105'
      } ${className}`}
    />
  );
}

