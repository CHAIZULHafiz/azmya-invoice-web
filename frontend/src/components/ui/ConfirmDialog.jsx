import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Hapus', danger = true }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.2s ease-out',
      padding: '16px'
    }} onClick={onCancel}>
      <div className="card" style={{
        padding: '28px',
        maxWidth: '420px',
        width: '90%',
        animation: 'fadeIn 0.3s ease-out',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: danger ? '#FEF2F2' : '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color={danger ? '#EF4444' : '#F59E0B'} />
          </div>
          <button onClick={onCancel} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-muted)',
          }}>
            <X size={20} />
          </button>
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Batal</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
