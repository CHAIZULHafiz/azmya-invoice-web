import { useEffect, useRef, useState } from 'react';

export default function StatCard({ icon: Icon, label, value, color, prefix = '', suffix = '', delay = 0 }) {
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

  const gradients = {
    amber: 'linear-gradient(135deg, #F59E0B, #D97706)',
    green: 'linear-gradient(135deg, #10B981, #059669)',
    blue: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    red: 'linear-gradient(135deg, #EF4444, #DC2626)',
    purple: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  };

  const bgColors = {
    amber: '#FFFBEB',
    green: '#ECFDF5',
    blue: '#EFF6FF',
    red: '#FEF2F2',
    purple: '#F5F3FF',
  };

  return (
    <div className="card" style={{
      padding: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      animation: `fadeIn 0.5s ease-out ${delay}ms forwards`,
      opacity: 0,
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: gradients[color] || gradients.amber,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={24} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-secondary)',
          marginBottom: '4px',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '28px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}>
          {prefix}{displayValue.toLocaleString('id-ID')}{suffix}
        </div>
      </div>
    </div>
  );
}
