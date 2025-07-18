import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  responseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastUpdated: string;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    const measurePerformance = () => {
      const start = performance.now();
      
      // Measure a sample API call
      fetch('/api/dashboard/stats')
        .then(response => {
          const end = performance.now();
          const responseTime = end - start;
          
          setMetrics(prev => ({
            ...prev,
            responseTime: Math.round(responseTime),
            lastUpdated: new Date().toISOString()
          }));
        })
        .catch(error => {
          console.error('Performance monitoring error:', error);
        });
    };

    // Initial measurement
    measurePerformance();

    // Set up periodic monitoring
    const interval = setInterval(measurePerformance, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return metrics;
}