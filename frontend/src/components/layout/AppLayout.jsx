import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Truck, LogIn, User, MoreVertical, LogOut, FilePlus, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import LoginModal from '../ui/LoginModal';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Title Mapping
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Dashboard Overview', subtitle: 'Ringkasan sistem invoice CV. AZMYA CAR TRANSINDO' };
    if (path === '/invoices') return { title: 'Manajemen Invoice', subtitle: 'Kelola semua invoice dan status pengiriman secara efisien' };
    if (path === '/units') return { title: 'Manajemen Unit', subtitle: 'Data master unit kendaraan operasional CV. Azmya Car Transindo' };
    if (path === '/create') return { title: 'Buat Invoice Baru', subtitle: 'Lengkapi formulir di bawah untuk membuat invoice profesional' };
    return { title: 'Portal Invoice', subtitle: 'CV. Azmya Car Transindo' };
  };

  const { title, subtitle } = getPageTitle();

  const navTabs = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/invoices', label: 'Monitoring', icon: FileText },
    { path: '/units', label: 'Data Unit', icon: Truck },
    ...(user ? [{ path: '/create', label: 'Buat Invoice', icon: FilePlus }] : []),
  ];

  if (loading) return null;

  return (
    <div className={!user ? 'guest-mode' : ''} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {sidebarOpen && <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}

      {(user || sidebarOpen) && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          isExpanded={sidebarExpanded}
          onToggleExpansion={() => setSidebarExpanded(!sidebarExpanded)}
        />
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: (!isMobile && user) ? (sidebarExpanded ? 'var(--sidebar-width)' : '80px') : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        width: '100%',
      }}>

        {!user && (
          <div style={{ padding: isMobile ? '16px 16px 0' : '24px 32px 0' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: isMobile ? '24px' : '28px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.02)',
              overflow: 'hidden'
            }}>
              {!isMobile ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <img src="/LOGO ACT.png" alt="Logo" style={{ width: '30px' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>AZMYA CAR TRANSINDO</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>HIRE THE BEST CAR AT THE BEST PRICE</div>
                      </div>
                    </div>

                    <nav style={{ display: 'flex', background: '#F4F7FF', padding: '5px', borderRadius: '14px', gap: '4px' }}>
                      {navTabs.slice(0, 3).map((tab) => (
                        <NavLink key={tab.path} to={tab.path} className={({ isActive }) => `desktop-nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
                          <tab.icon size={16} /> {tab.label}
                        </NavLink>
                      ))}
                    </nav>

                    <button className="btn btn-primary" onClick={() => setIsLoginModalOpen(true)} style={{ borderRadius: '12px', padding: '10px 20px' }}>
                      <LogIn size={18} /> Login Admin
                    </button>
                  </div>
                  <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.05), transparent)' }} />
                  <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>{title}</h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>{subtitle}</p>
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src="/LOGO ACT.png" alt="Logo" style={{ width: '36px' }} />
                      <div style={{ fontWeight: '800', fontSize: '14px', lineHeight: 1.2 }}>AZMYA CAR TRANSINDO<br /><span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>HIRE THE BEST CAR AT THE BEST PRICE</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setIsLoginModalOpen(true)} style={{ background: '#F0F3FF', border: 'none', padding: '10px', borderRadius: '10px', color: '#4F46E5' }}><LogIn size={20} /></button>
                      <button onClick={() => setSidebarOpen(true)} style={{ background: '#F8F9FA', border: 'none', padding: '10px', borderRadius: '10px' }}><MoreVertical size={20} /></button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h1>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{subtitle}</p>
                  </div>
                  <div style={{ background: '#F4F7FF', padding: '5px', borderRadius: '14px', display: 'flex', gap: '4px' }}>
                    {navTabs.slice(0, 3).map((tab) => (
                      <NavLink key={tab.path} to={tab.path} className={({ isActive }) => `pill-item ${isActive ? 'active' : ''}`} style={{ flex: 1, textDecoration: 'none' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>{tab.label}</div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {user && (
          <div style={{ height: '60px', background: '#FFFFFF', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 16px', position: 'sticky', top: 0, zIndex: 40 }}>
            <button onClick={isMobile ? () => setSidebarOpen(true) : () => setSidebarExpanded(!sidebarExpanded)} style={{ background: '#F8F9FF', border: 'none', color: 'var(--sidebar-bg)', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMobile ? <Menu size={20} /> : (!sidebarExpanded ? <Menu size={20} /> : <X size={20} />)}
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>{user?.username}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
              <div style={{ width: '32px', height: '32px', background: 'var(--primary-600)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        <main className="main-content" style={{ padding: isMobile ? '16px' : '32px', flex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
