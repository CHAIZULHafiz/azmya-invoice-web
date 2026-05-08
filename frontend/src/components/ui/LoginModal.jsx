import { useState } from 'react';
import { X, User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast.success('Berhasil masuk ke sistem');
        onClose();
      } else {
        toast.error('Username atau password salah');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login-modal">
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#FFFFFF',
            borderRadius: '16px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <img src="/LOGO ACT.png" alt="Logo" style={{ width: '40px', height: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Login Admin
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Masuk untuk mengelola invoice
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px' }}
          >
            {loading ? <><Loader2 size={18} className="spin" /> Memproses...</> : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
