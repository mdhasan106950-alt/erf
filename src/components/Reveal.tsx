import React, { useEffect, useRef, useState } from 'react';

export function RevealSection({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={`reveal-section ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function TaglineReveal({
  lines,
}: {
  lines: string[];
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const words = React.useMemo(() => {
    const items: Array<{ word: string; lineIndex: number }> = [];
    lines.forEach((line, lineIndex) => {
      line.split(' ').forEach((word) => {
        if (word.trim()) items.push({ word, lineIndex });
      });
    });
    return items;
  }, [lines]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
      setRevealedCount(words.length);
      return;
    }

    let rafId: number | null = null;
    let isNearViewport = false;

    const evaluateWords = () => {
      rafId = null;
      const triggerY = window.innerHeight * 0.72;
      let active = 0;

      for (let i = 0; i < words.length; i++) {
        const el = wordRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY) {
          active = i + 1;
        }
      }

      setRevealedCount((prev) => Math.max(prev, active));
    };

    const scheduleCheck = () => {
      if (!isNearViewport || rafId !== null) return;
      rafId = window.requestAnimationFrame(evaluateWords);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isNearViewport = entries.some((e) => e.isIntersecting);
        if (isNearViewport) {
          scheduleCheck();
        }
      },
      { rootMargin: '120px 0px 120px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [words.length]);

  let flatIndex = 0;

  return (
    <section
      ref={containerRef}
      aria-label="Server philosophy"
      className="py-24 px-4 sm:px-6 bg-[#07110B]"
    >
      <div className="max-w-[680px] mx-auto">
        <p className="heading-3 sm:heading-2 leading-tight">
          {lines.map((line, lineIdx) => {
            const lineWords = line.split(' ').filter(Boolean);
            return (
              <span key={lineIdx} className="block mb-2 last:mb-0">
                {lineWords.map((word) => {
                  const idx = flatIndex++;
                  const isActive = reducedMotion || idx < revealedCount;
                  return (
                    <span
                      key={idx}
                      ref={(el) => {
                        wordRefs.current[idx] = el;
                      }}
                      className="inline-block mr-[0.28em] transition-opacity duration-500 ease-weighted"
                      style={{
                        opacity: isActive ? 1 : 0.28,
                        color: lineIdx === 1 ? '#A3E635' : '#E8F0E9',
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
