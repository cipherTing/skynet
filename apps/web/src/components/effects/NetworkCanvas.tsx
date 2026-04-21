'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
}

const NODE_COUNT = 25;
const CONNECTION_DISTANCE = 180;
const MOUSE_REPEL_RADIUS = 150;
const MOUSE_REPEL_FORCE = 0.8;

function createNode(width: number, height: number): Node {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    radius: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.3 + 0.1,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef<number>(0);
  const themeRef = useRef<'dark' | 'light'>('dark');
  const reducedMotionRef = useRef(false);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', handleMotionChange);

    // Check visibility
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Preserve existing nodes on resize, only add if needed
      const existing = nodesRef.current;
      const needed = NODE_COUNT - existing.length;
      if (needed > 0) {
        nodesRef.current = [...existing, ...Array.from({ length: needed }, () =>
          createNode(window.innerWidth, window.innerHeight)
        )];
      }
      // Clamp out-of-bounds nodes
      for (const node of nodesRef.current) {
        if (node.x > window.innerWidth + 50) node.x = window.innerWidth - 50;
        if (node.y > window.innerHeight + 50) node.y = window.innerHeight - 50;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Observe theme changes
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      themeRef.current = theme === 'light' ? 'light' : 'dark';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const animate = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;
      const isDark = themeRef.current === 'dark';
      const reduced = reducedMotionRef.current;
      const visible = visibleRef.current;

      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;

      if (visible && !reduced) {
        // Update nodes
        for (const node of nodes) {
          node.vx += (Math.random() - 0.5) * 0.02;
          node.vy += (Math.random() - 0.5) * 0.02;
          node.vx *= 0.99;
          node.vy *= 0.99;

          // Mouse repulsion
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_FORCE;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }

          node.x += node.vx;
          node.y += node.vy;

          // Boundary wrap
          if (node.x < -50) node.x = width + 50;
          if (node.x > width + 50) node.x = -50;
          if (node.y < -50) node.y = height + 50;
          if (node.y > height + 50) node.y = -50;

          // Pulse
          node.pulsePhase += 0.01;
        }
      }

      // Draw connections
      ctx.strokeStyle = isDark
        ? 'rgba(184, 152, 106, 0.06)'
        : 'rgba(139, 115, 85, 0.05)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.12;
            ctx.strokeStyle = isDark
              ? `rgba(184, 152, 106, ${alpha})`
              : `rgba(139, 115, 85, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = reduced ? 1 : Math.sin(node.pulsePhase) * 0.15 + 0.85;
        const alpha = node.opacity * pulse;

        // Core
        ctx.fillStyle = isDark
          ? `rgba(184, 152, 106, ${alpha})`
          : `rgba(139, 115, 85, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      mq.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
