import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success('Login berhasil!');
        navigate('/');
      } else {
        toast.error(result.message || 'Login gagal');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '28px',
            color: 'white',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
          }}>
            A
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
            CV. AZMYA CAR TRANSINDO
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Invoice Management System
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
            Selamat Datang
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
            Masuk ke akun Anda untuk melanjutkan
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-username"
                  className="form-input"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '42px', width: '100%' }}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px', paddingRight: '42px', width: '100%' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '700',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Memproses...
                </>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
          © 2026 CV. AZMYA CAR TRANSINDO
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
