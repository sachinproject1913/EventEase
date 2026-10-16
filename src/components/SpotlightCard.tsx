import React, { useRef, useState, MouseEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  showHoverArrow?: boolean;
  hoverArrowText?: string;
  cursorText?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(59, 130, 246, 0.12)',
  showHoverArrow = false,
  hoverArrowText,
  cursorText,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-cursor-text={cursorText}
      className={`relative rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 group ${className}`}
      {...props}
    >
      {/* Interactive mouse spotlight overlay */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(450px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />

      {/* Luminous dynamic border trace */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-blue-500/30 transition-all duration-200"
        />
      )}

      {/* Optional Hover Linking Mouse Arrow indicator top right */}
      {showHoverArrow && (
        <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none transition-all duration-300 transform opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/90 text-white backdrop-blur-md text-[10px] font-bold shadow-md">
            {hoverArrowText && <span>{hoverArrowText}</span>}
            <ArrowUpRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      )}

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
