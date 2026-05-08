import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Memuat data...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      gap: '16px',
    }}>
      <Loader2 size={36} color="var(--primary-500)" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{message}</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
