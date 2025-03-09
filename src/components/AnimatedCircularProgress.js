import React, { useRef, useEffect, useState, useCallback } from 'react';

const AnimatedCircularProgress = ({
  value = 0,
  maxValue = 4,
  text,
  color = "rgb(var(--text-color))",
  size = 120,
  strokeWidth = 10,
  textSize = '22px',
  duration = 850
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const initialValueRef = useRef(0);
  const isMountedRef = useRef(false);

  // Calculate circle properties once
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Memoize the stroke dashoffset calculation
  const strokeDashoffset = circumference - (displayValue / maxValue) * circumference;

  // Animation loop with useCallback to prevent recreation
  const animateProgress = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Use easing function for smoother animation
    const easedProgress = easeOutQuad(progress);
    const nextValue = initialValueRef.current + (value - initialValueRef.current) * easedProgress;

    setDisplayValue(nextValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateProgress);
    }
  }, [value, duration, maxValue]);

  // Start animation immediately when value changes
  useEffect(() => {
    // On first render, animate from 0
    // On subsequent renders, animate from current value
    initialValueRef.current = isMountedRef.current ? displayValue : 0;
    isMountedRef.current = true;

    // Cancel any in-progress animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animateProgress]);

  // Format displayed text - ensure text is a proper string, not a raw number
  const formattedText = typeof text === 'number' ?
    text.toFixed(2) :
    text;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-valuemin="0"
        aria-valuemax={maxValue}
        aria-valuenow={value}
        role="progressbar"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgb(var(--super))"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Text in center */}
      {formattedText !== undefined && formattedText !== "" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color, fontSize: textSize, fontWeight: 'bold' }}>
            {formattedText}
          </span>
        </div>
      )}
    </div>
  );
};

// Easing function for smoother animation
function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

export default React.memo(AnimatedCircularProgress);
