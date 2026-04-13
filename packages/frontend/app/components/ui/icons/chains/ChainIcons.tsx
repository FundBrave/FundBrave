"use client";

import { forwardRef } from 'react';
import type { IconProps } from '../types';

export const EthereumIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M12 1.5L5.5 12.25L12 16L18.5 12.25L12 1.5Z" fill="currentColor" opacity="0.6" />
      <path d="M12 16L5.5 12.25L12 22.5L18.5 12.25L12 16Z" fill="currentColor" />
    </svg>
  )
);
EthereumIcon.displayName = 'EthereumIcon';

export const PolygonIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M16.5 8.5L12 5.5L7.5 8.5V14.5L12 17.5L16.5 14.5V8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 5.5V2M12 22V17.5M7.5 8.5L4.5 6.5M19.5 6.5L16.5 8.5M7.5 14.5L4.5 16.5M19.5 16.5L16.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
);
PolygonIcon.displayName = 'PolygonIcon';

export const BNBIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M12 3L15 6L12 9L9 6L12 3Z" fill="currentColor" />
      <path d="M18 9L21 12L18 15L15 12L18 9Z" fill="currentColor" />
      <path d="M6 9L9 12L6 15L3 12L6 9Z" fill="currentColor" />
      <path d="M12 15L15 18L12 21L9 18L12 15Z" fill="currentColor" />
    </svg>
  )
);
BNBIcon.displayName = 'BNBIcon';

export const ArbitrumIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M12 3L21 18H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9L16 16H8L12 9Z" fill="currentColor" opacity="0.4" />
    </svg>
  )
);
ArbitrumIcon.displayName = 'ArbitrumIcon';

export const OptimismIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
);
OptimismIcon.displayName = 'OptimismIcon';

export const AvalancheIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M12 3L4 19H9L12 13L15 19H20L12 3Z" fill="currentColor" />
    </svg>
  )
);
AvalancheIcon.displayName = 'AvalancheIcon';
