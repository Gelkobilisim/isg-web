import React, { useEffect, useState, useRef } from "react";

export const CountUp = React.memo(({
  end = 0,
  duration = 800,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const [count, setCount] = useState(() => (typeof end === "number" ? end : parseFloat(end) || 0));
  const startRef = useRef(typeof end === "number" ? end : parseFloat(end) || 0);
  const frameRef = useRef(null);

  useEffect(() => {
    const target = typeof end === "number" ? end : parseFloat(end) || 0;
    const startVal = startRef.current;
    if (startVal === target) return;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startVal + (target - startVal) * easeProgress;

      setCount(currentVal);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
        startRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  const formatted = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString("tr-TR");

  return (
    <span className={`inline-block tabular-nums font-bold ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
});

export default CountUp;
