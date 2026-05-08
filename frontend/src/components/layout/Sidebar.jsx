import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, FilePlus, Truck, LogOut, ChevronRight, LogIn, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose, onOpenLogin, isExpanded, onToggleExpansion }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/invoices', label: 'Manajemen Invoice', icon: FileText },
    ...(user ? [{ path: '/create', label: 'Buat Invoice', icon: FilePlus }] : []),
    { path: '/units', label: 'Data Unit', icon: Truck },
  ];

  // If user is logged in, use isExpanded prop. If guest, always slim.
  const isSlim = user ? !isExpanded : true;

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''} ${isSlim ? 'slim' : ''}`}
      style={{
        width: isSlim ? '80px' : 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Sidebar Close/Collapse Button (Only in Expanded mode or Mobile) */}
      {(isOpen || (user && isExpanded)) && (
        <button
          onClick={user && isExpanded ? onToggleExpansion : onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
            zIndex: 110,
          }}
        >
          <X size={20} />
        </button>
      )}

      {/* Logo Section */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'white',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img src="/LOGO ACT.png" alt="Logo" style={{ width: '28px', height: 'auto' }} />
          </div>
          {!isSlim && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ color: '#FCE001', fontWeight: '900', fontSize: '9px', letterSpacing: '0.5px' }}>
                AZMYA CAR TRANSINDO
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '6px', fontWeight: '500' }}>
                HIRE THE BEST CAR AT TTHE BEST PRICE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!isSlim && (
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', padding: '0 12px 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Menu Utama
          </div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={handleNavClick}
            className="nav-item"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isSlim ? '12px' : '12px 14px',
              borderRadius: '12px',
              color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'var(--primary-600)' : 'transparent',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.2s ease',
            })}
          >
            <item.icon size={22} />
            {!isSlim && <span style={{ flex: 1 }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User / Login Section */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isSlim && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>{user?.username}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase' }}>{user?.role}</div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              <LogOut size={16} /> {!isSlim && 'Keluar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onOpenLogin();
              handleNavClick();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isSlim ? '12px' : '14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
            }}
          >
            <LogIn size={20} />
            {!isSlim && <span style={{ marginLeft: '10px', fontWeight: '600' }}>Login Admin</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
