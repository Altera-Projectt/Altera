import React, { useState, useEffect } from 'react';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc?: string;
  alt: string;
}

export function ProgressiveImage({ src, placeholderSrc, alt, className = '', ...props }: ProgressiveImageProps) {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setImgSrc(placeholderSrc || src);

    if (placeholderSrc && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setIsLoaded(true);
      };
    } else {
      setIsLoaded(true);
    }
  }, [src, placeholderSrc]);

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
