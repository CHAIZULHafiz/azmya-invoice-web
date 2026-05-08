import { useEffect, useRef, useState } from 'react';

export default function StatCard({ icon: Icon, label, subtitle, value, color, prefix = '', suffix = '', delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
    if (numValue === 0) { setDisplayValue(0); return; }

    const duration = 1000;
    const steps = 30;
    const stepValue = numValue / steps;
    let current = 0;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        current = Math.round(stepValue * step);
        if (step >= steps) {
          current = numValue;
          clearInterval(interval);
        }
        setDisplayValue(current);
      }, duration / steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const textColors = {
    slate: '#94A3B8',
    amber: '#F59E0B',
    indigo: '#4F46E5',
    emerald: '#10B981',
    blue: '#3B82F6',
    red: '#EF4444',
    green: '#059669',
  };

  const primaryColor = textColors[color] || textColors.slate;

  return (
    <div className="card" style={{
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: `fadeIn 0.5s ease-out ${delay}ms forwards`,
      opacity: 0,
      border: '1px solid rgba(0,0,0,0.04)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icon size={20} color={primaryColor} />
        <div style={{
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: primaryColor,
          letterSpacing: '0.5px'
        }}>
          {label}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: '26px',
          fontWeight: '500',
          color: '#1E293B',
          lineHeight: 1.2,
          marginBottom: '6px'
        }}>
          {prefix}{displayValue.toLocaleString('id-ID')}{suffix}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#94A3B8'
        }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
