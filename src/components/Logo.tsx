import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const idPrefix = React.useId().replace(/:/g, '');
  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  return (
    <motion.div 
      className={cn("relative flex items-center justify-center shrink-0", sizes[size], className)} 
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      whileHover={{ scale: 1.1, rotate: 720 }}
      transition={{ 
        rotate: { duration: 1.2, ease: "easeInOut" },
        scale: { duration: 0.3 }
      }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-fuchsia-500/20 blur-xl rounded-full" />
      
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 filter drop-shadow-md"
      >
        <defs>
          <linearGradient id={`${idPrefix}-petal-grad-1`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-petal-grad-2`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <filter id={`${idPrefix}-glow`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Petals Layer */}
        <g filter={`url(#${idPrefix}-glow)`}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <path
              key={`outer-${i}`}
              d="M50 50 C50 50 65 20 50 10 C35 20 50 50 50 50"
              transform={`rotate(${angle} 50 50)`}
              fill={`url(#${idPrefix}-petal-grad-1)`}
              className="opacity-40"
            />
          ))}
        </g>

        {/* Inner Petals Layer */}
        <g>
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
            <path
              key={`inner-${i}`}
              d="M50 50 C50 50 60 30 50 20 C40 30 50 50 50 50"
              transform={`rotate(${angle} 50 50)`}
              fill={`url(#${idPrefix}-petal-grad-2)`}
              className="opacity-70"
            />
          ))}
        </g>

        {/* Core */}
        <circle cx="50" cy="50" r="6" fill="white" className="opacity-20" />
        <circle cx="50" cy="50" r="3.5" fill="white" />
        <circle cx="50" cy="50" r="1.5" fill="#8B5CF6" />
      </svg>
    </motion.div>
  );
};
