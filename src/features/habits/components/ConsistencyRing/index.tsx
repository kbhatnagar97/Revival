import React from 'react';
import './ConsistencyRing.scss';

interface ConsistencyRingProps {
  percentage: number;
  color: string;
  lightenedColor: string;
  size: 'large' | 'small';
}

const ConsistencyRing: React.FC<ConsistencyRingProps> = ({ percentage, color, lightenedColor }) => {

  const { svg: svgSize, stroke: strokeWidth } = { svg: 220, stroke: 32 };
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offsetPercentage = Math.max(percentage, 0.5);

  // THE DEFINITIVE FIX:
  // 1. Calculate the normal dash offset.
  const progressOffset = circumference - (offsetPercentage / 100) * circumference;
  // 2. Add a quarter-turn offset because SVG arcs start at 3 o'clock, not 12.
  const rotationOffset = circumference / 4;
  // 3. The final offset correctly positions the start/end of the arc.
  const strokeDashoffset = progressOffset + rotationOffset;

  const gradientId = `consistencyGradient-${color.replace('#', '')}-${'large'}`;

  return (
    <div className={`consistency-ring-container consistency-ring-container--${'large'}`}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="consistency-ring"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lightenedColor} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        
        <circle
          className="consistency-ring__background"
          stroke="#eae6e1"
          strokeWidth={strokeWidth}
          r={radius}
          cx={svgSize/2}
          cy={svgSize/2}
        />

        <circle
          className="consistency-ring__progress"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={radius}
          cx={svgSize/2}
          cy={svgSize/2}
        />

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