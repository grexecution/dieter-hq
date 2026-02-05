'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholderDataUrl?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
}

/**
 * Progressive image component with lazy loading, blur-up effect, and fallback
 * Optimized for performance and mobile experience
 */
export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholderDataUrl,
  quality = 75,
  loading = 'lazy',
  onLoad,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    console.error(`[Image] Failed to load: ${src}`);
  };

  // Generate a simple placeholder if none provided
  const placeholder = placeholderDataUrl || generatePlaceholder();

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-muted-foreground mt-2">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder / blur-up image */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className="w-full h-full bg-muted"
          style={{
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      </div>

      {/* Main image */}
      {(isInView || priority) && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/**
 * Generate a simple SVG placeholder
 */
function generatePlaceholder(): string {
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#e5e7eb"/>
      <path d="M8 8h24v24H8z" fill="#d1d5db"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Adaptive image component that adjusts quality based on network conditions
 */
export function AdaptiveImage(props: ProgressiveImageProps) {
  const [quality, setQuality] = useState(props.quality || 75);

  useEffect(() => {
    // Check network conditions
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const { effectiveType, saveData } = connection;

      // Reduce quality on slow connections or data saver mode
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        setQuality(40);
      } else if (effectiveType === '3g') {
        setQuality(60);
      } else {
        setQuality(props.quality || 75);
      }
    }
  }, [props.quality]);

  return <ProgressiveImage {...props} quality={quality} />;
}

/**
 * Avatar with progressive loading and fallback
 */
export function ProgressiveAvatar({
  src,
  alt,
  size = 40,
  fallbackText,
}: {
  src?: string;
  alt: string;
  size?: number;
  fallbackText?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    // Show initials fallback
    const initials = fallbackText
      ? fallbackText
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : alt.slice(0, 2).toUpperCase();

    return (
      <div
        className="rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full"
      onLoad={() => setHasError(false)}
    />
  );
}
