import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface InteractiveCursorProps {
  enabled?: boolean;
}

export const InteractiveCursor: React.FC<InteractiveCursorProps> = ({ enabled = true }) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [hoverText, setHoverText] = useState<string | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const posRef = useRef({ x: -100, y: -100 });
  const targetPosRef = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Detect touch-only screen
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Inspect target element for interactive cues
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest<HTMLElement>(
        'a, button, [role="button"], input[type="submit"], select, [data-cursor], .interactive-hover, .cursor-pointer'
      );

      if (interactiveEl) {
        setIsHoveringLink(true);
        const customText = interactiveEl.getAttribute('data-cursor-text');
        setHoverText(customText || null);
      } else {
        setIsHoveringLink(false);
        setHoverText(null);
      }
    };

    const handleMouseDown = () => setIsPointerDown(true);
    const handleMouseUp = () => setIsPointerDown(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsHoveringLink(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Smooth lerp loop
    const animate = () => {
      posRef.current.x += (targetPosRef.current.x - posRef.current.x) * 0.22;
      posRef.current.y += (targetPosRef.current.y - posRef.current.y) * 0.22;
      
      setPosition({
        x: Math.round(posRef.current.x * 10) / 10,
        y: Math.round(posRef.current.y * 10) / 10,
      });

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!enabled || isTouchDevice || !isVisible) {
    return null;
  }

  return (
    <aside aria-hidden="true" className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Outer Magnetic Follower Ring / Link Arrow Pill */}
      <div
        className="fixed top-0 left-0 transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
      >
        {isHoveringLink ? (
          <div
            className={`-translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 transform ${
              isPointerDown ? 'scale-90' : 'scale-100'
            }`}
          >
            {hoverText ? (
              <span className="text-[11px] font-bold tracking-wide whitespace-nowrap text-blue-200">
                {hoverText}
              </span>
            ) : null}
            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center animate-pulse">
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ) : (
          <div
            className={`-translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/50 bg-blue-500/10 backdrop-blur-[1px] transition-all duration-150 ${
              isPointerDown ? 'w-4 h-4 bg-blue-600/40' : 'w-7 h-7'
            }`}
          />
        )}
      </div>

      {/* Tiny Precision Center Dot */}
      <div
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm transition-opacity duration-150"
        style={{
          transform: `translate3d(${targetPosRef.current.x}px, ${targetPosRef.current.y}px, 0)`,
          opacity: isHoveringLink ? 0 : 0.8,
        }}
      />
    </aside>
  );
};
