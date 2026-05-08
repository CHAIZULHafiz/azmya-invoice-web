import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Send, CheckCircle, AlertTriangle, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, invRes] = await Promise.all([
        api.get('/invoices/stats'),
        api.get('/invoices'),
      ]);
      setStats(statsRes.data.data);
      const sorted = (invRes.data.data || []).sort((a, b) => b.no - a.no).slice(0, 5);
      setRecentInvoices(sorted);
    } catch (err) {
      toast.error('Gagal memuat data dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  if (loading) return <LoadingSpinner message="Memuat dashboard..." />;

  return (
    <div className="animate-fade-in">
      {/* Page Header (Restored to Original Left-Aligned for Admin) */}
      {user && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>Dashboard Overview</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ringkasan sistem invoice CV. AZMYA CAR TRANSINDO</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/create')} style={{ borderRadius: '12px', padding: '12px 24px' }}>
            <Plus size={18} /> Buat Invoice Baru
          </button>
        </div>
      )}

      {/* Overdue Alert */}
      {stats?.overdue > 0 && (
        <div className="overdue-alert" style={{
          background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          border: '1px solid #FECACA',
          borderRadius: 'var(--border-radius)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          animation: 'fadeIn 0.5s ease-out',
        }}>
          <AlertTriangle size={22} color="#DC2626" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: '700', color: '#DC2626' }}>{stats.overdue} Invoice</span>
            <span style={{ color: '#991B1B', fontSize: '14px' }}> telah melewati jatuh tempo dan belum lunas!</span>
          </div>
          <button className="btn btn-sm btn-danger" onClick={() => navigate('/invoices')}>
            Lihat <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '28px',
      }}>
        <StatCard icon={FileText} label="TOTAL" subtitle="Invoice Bulan Ini" value={stats?.total || 0} color="slate" delay={0} />
        <StatCard icon={Clock} label="PENDING" subtitle="Menunggu Pengiriman" value={stats?.pending || 0} color="amber" delay={100} />
        <StatCard icon={Send} label="DIKIRIM" subtitle="Menunggu Payment" value={stats?.dikirim || 0} color="indigo" delay={200} />
        <StatCard icon={CheckCircle} label="LUNAS" subtitle="Pembayaran Selesai" value={stats?.lunas || 0} color="emerald" delay={300} />
      </div>


      {/* Recent Invoices */}
      <div className="card" style={{ overflow: 'hidden', animation: 'fadeIn 0.5s ease-out 0.5s forwards', opacity: 0 }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Invoice Terbaru</h2>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => navigate('/invoices')}
            style={{ fontSize: '13px' }}
          >
            Lihat Semua <ArrowRight size={14} />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada invoice. Mulai buat invoice pertama Anda!
          </div>
        ) : (
          <>
            <div className="table-container desktop-table" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Unit</th>
                    <th>No Invoice</th>
                    <th>Periode</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.rowIndex} className={inv.isOverdue ? 'row-overdue' : ''}>
                      <td style={{ fontWeight: '600' }}>{inv.no}</td>
                      <td>{inv.pilihUnit}</td>
                      <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{inv.noInvoice}</td>
                      <td>{inv.periode}</td>
                      <td style={{ fontWeight: '600' }}>{formatRupiah(inv.totalIncPPN)}</td>
                      <td><StatusBadge status={inv.statusKirim} isOverdue={inv.isOverdue} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-invoice-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentInvoices.map((inv) => (
                  <div key={inv.rowIndex} className={`card ${inv.isOverdue ? 'row-overdue' : ''}`} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          {inv.pilihUnit}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace' }}>{inv.noInvoice}</div>
                      </div>
                      <StatusBadge status={inv.statusKirim} isOverdue={inv.isOverdue} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{inv.periode}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-700)' }}>{formatRupiah(inv.totalIncPPN)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
