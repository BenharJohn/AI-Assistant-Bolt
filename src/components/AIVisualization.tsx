import React, { useEffect, useRef } from 'react';
import { PatternType } from '../types';

interface AIVisualizationProps {
  isListening: boolean;
  isThinking: boolean;
  pattern: PatternType;
  emotion: number;
}

const AIVisualization: React.FC<AIVisualizationProps> = ({
  isListening,
  isThinking,
  pattern,
  emotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const time = useRef<number>(0);
  const intensity = useRef<number>(0);
  const currentShape = useRef<number[][]>([[0, 0]]);
  const targetShape = useRef<number[][]>([[0, 0]]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    const generateShape = (type: PatternType, t: number): number[][] => {
      const points: number[][] = [];
      const steps = 200;
      
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        let x = 0, y = 0;
        
        switch (type) {
          case 'infinity':
            // Smoother infinity curve with organic movement
            const a = 1 + Math.sin(t * 0.5) * 0.1;
            const b = 1 + Math.cos(t * 0.3) * 0.1;
            x = Math.sin(theta) / (1 + Math.cos(theta) * Math.cos(theta)) * a;
            y = Math.sin(theta) * Math.cos(theta) / (1 + Math.cos(theta) * Math.cos(theta)) * b;
            break;
          case 'heart':
            // Gentler heart shape with subtle pulsing
            const scale = 1 + Math.sin(t) * 0.05;
            x = 16 * Math.pow(Math.sin(theta), 3) * scale;
            y = -(13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta)) * scale;
            break;
          case 'wave':
            // Organic wave with flowing motion
            x = theta - Math.PI;
            y = Math.sin(theta + t) * (1 + Math.sin(t * 0.5) * 0.2);
            break;
          case 'figure-eight':
            // Fluid figure-eight with natural variation
            const s = 1 + Math.sin(t * 0.7) * 0.1;
            x = Math.sin(theta) * s;
            y = Math.sin(2 * theta) * 0.5 * s;
            break;
        }
        points.push([x, y]);
      }
      return points;
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time.current += 0.008; // Slower animation speed for more organic movement
      const targetIntensity = isListening ? 0.8 : isThinking ? 0.5 : 0.2;
      intensity.current += (targetIntensity - intensity.current) * 0.03; // Smoother intensity transition

      targetShape.current = generateShape(pattern, time.current);

      // Smoother interpolation between shapes
      if (currentShape.current.length === targetShape.current.length) {
        for (let i = 0; i < currentShape.current.length; i++) {
          currentShape.current[i][0] += (targetShape.current[i][0] - currentShape.current[i][0]) * 0.08;
          currentShape.current[i][1] += (targetShape.current[i][1] - currentShape.current[i][1]) * 0.08;
        }
      } else {
        currentShape.current = targetShape.current;
      }

      const centerX = canvas.width / (2 * (window.devicePixelRatio || 1));
      const centerY = canvas.height / (2 * (window.devicePixelRatio || 1));
      const size = Math.min(centerX, centerY) * 0.7;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(time.current) * 0.2})`;
      ctx.lineWidth = 1 + Math.sin(time.current * 1.5) * intensity.current; // Thinner line with subtle variation
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 8 * intensity.current;

      // Apply emotional variations with gentler effects
      const emotionalScale = 1 + Math.sin(time.current * 1.5) * emotion * 0.15;

      // Draw the shape with smooth curves
      currentShape.current.forEach((point, i) => {
        const x = centerX + point[0] * size * emotionalScale + Math.sin(time.current * 1.5 + i * 0.08) * intensity.current * 4;
        const y = centerY + point[1] * size * emotionalScale + Math.cos(time.current * 1.5 + i * 0.08) * intensity.current * 4;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother lines
          const prevPoint = currentShape.current[i - 1];
          const prevX = centerX + prevPoint[0] * size * emotionalScale + Math.sin(time.current * 1.5 + (i-1) * 0.08) * intensity.current * 4;
          const prevY = centerY + prevPoint[1] * size * emotionalScale + Math.cos(time.current * 1.5 + (i-1) * 0.08) * intensity.current * 4;
          
          const cpX = (prevX + x) / 2;
          const cpY = (prevY + y) / 2;
          
          ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
      });

      ctx.stroke();
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, isThinking, pattern, emotion]);

  return (
    <div className="relative w-full h-full bg-red-600 rounded-lg overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full"
      />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="h-1 w-24 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-500 ease-in-out" 
            style={{ 
              width: `${(isListening ? 100 : isThinking ? 60 : 30)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIVisualization;