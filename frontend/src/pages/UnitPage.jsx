import { useState, useEffect } from 'react';
import { Search, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function UnitPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const res = await api.get('/units');
      setUnits(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data unit');
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(u =>
    !search ||
    u.unit.toLowerCase().includes(search.toLowerCase()) ||
    u.namaUnit.toLowerCase().includes(search.toLowerCase()) ||
    u.nopol.toLowerCase().includes(search.toLowerCase()) ||
    u.area.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  if (loading) return <LoadingSpinner message="Memuat data unit..." />;

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg-secondary)', margin: '-32px', padding: '32px', minHeight: '100vh' }}>
      {/* Page Header (Restored to Original Left-Aligned for Admin) */}
      {user && (
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>Manajemen Unit</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Data master unit kendaraan operasional CV. Azmya Car Transindo</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="card filter-bar" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          id="search-unit"
          className="form-input"
          type="text"
          placeholder="Cari unit, nama, nopol, atau area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', boxShadow: 'none', padding: '4px 0', flex: 1 }}
        />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filteredUnits.length} unit
        </span>
      </div>

      {/* Unit Cards Grid */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredUnits.map((unit, i) => (
          <div
            key={unit.unit}
            className="card"
            style={{
              padding: '24px',
              animation: `fadeIn 0.4s ease-out ${i * 80}ms forwards`,
              opacity: 0,
            }}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Truck size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
                  {unit.namaUnit}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    background: 'var(--primary-50)',
                    color: 'var(--primary-700)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}>{unit.unit}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {unit.nopol}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '13px',
              padding: '16px',
              background: '#FAFBFC',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid #F3F4F6',
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Area</div>
                <div style={{ fontWeight: '600' }}>{unit.area}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Harga</div>
                <div style={{ fontWeight: '700', color: 'var(--primary-700)' }}>{formatRupiah(unit.hargaUnit)}</div>
              </div>
              {unit.unit.startsWith('SLB') ? (
                <>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Customer</div>
                    <div style={{ fontWeight: '500' }}>{unit.namaCustomer || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>NPWP Customer</div>
                    <div style={{ fontWeight: '500', fontSize: '12px' }}>{unit.npwpCustomer || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Kode Invoice</div>
                    <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>{unit.kodeInvoice}</div>
                  </div>
                  <div /> {/* Empty div to keep grid balanced */}
                </>
              ) : (
                <>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Koordinator</div>
                    <div style={{ fontWeight: '500' }}>{unit.koordinator}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Jabatan</div>
                    <div style={{ fontWeight: '500', fontSize: '12px' }}>{unit.jabatan}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Kode Invoice</div>
                    <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>{unit.kodeInvoice}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>No. SPK</div>
                    <div style={{ fontWeight: '500', fontSize: '12px' }}>{unit.nomorSPK}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Truck size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Tidak ada unit yang ditemukan</p>
        </div>
      )}
    </div>
  );
}
