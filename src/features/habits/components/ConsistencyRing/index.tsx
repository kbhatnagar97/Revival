import React from 'react';
import './ConsistencyRing.scss';

interface ConsistencyRingProps {
  percentage: number;
  color: string;
  lightenedColor: string;
}

const ConsistencyRing: React.FC<ConsistencyRingProps> = ({ percentage, color, lightenedColor }) => {
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offsetPercentage = Math.max(percentage, 0.5);
  const strokeDashoffset = circumference - (offsetPercentage / 100) * circumference;

  const gradientId = `consistencyGradient-${color.replace('#', '')}`;
  const glowFilterId = `glow-${color.replace('#', '')}`;

  return (
    <div className="consistency-ring-container">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="consistency-ring"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lightenedColor} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          {/* This filter creates the soft glow effect */}
          <filter id={glowFilterId}>
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Circle */}
        <circle
          className="consistency-ring__background"
          stroke="#eae6e1"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size/2}
          cy={size/2}
        />

        {/* Progress Circle with Gradient and rounded ends */}
        <circle
          className="consistency-ring__progress"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={radius}
          cx={size/2}
          cy={size/2}
        />

        {/* Text placed inside the SVG for perfect centering */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="consistency-ring__text-svg"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    </div>
  );
};

export default ConsistencyRing;