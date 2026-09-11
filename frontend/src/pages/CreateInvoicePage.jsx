import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lightbulb, Copy, Check, Loader2, ArrowLeft, Sparkles, Truck, ChevronDown, Calendar, Hash, UploadCloud } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: 'January', label: 'Januari' },
  { value: 'February', label: 'Februari' },
  { value: 'March', label: 'Maret' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'Mei' },
  { value: 'June', label: 'Juni' },
  { value: 'July', label: 'Juli' },
  { value: 'August', label: 'Agustus' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'Oktober' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'Desember' }
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function CreateInvoicePage() {
  const [units, setUnits] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [unitCode, setUnitCode] = useState('');
  const [periodeMonth, setPeriodeMonth] = useState('');
  const [periodeYear, setPeriodeYear] = useState(new Date().getFullYear().toString());
  const [noUrut, setNoUrut] = useState('');
  const [tglDokumen, setTglDokumen] = useState(new Date().toISOString().split('T')[0]);

  // Derived data
  const selectedUnit = units.find(u => u.unit === unitCode);
  const tglDokumenMonth = tglDokumen ? new Date(tglDokumen).getMonth() : -1;
  const roman = tglDokumenMonth >= 0 ? ROMAN[tglDokumenMonth] : '';

  const previewInvoiceNo = noUrut && selectedUnit && roman
    ? `${String(noUrut).padStart(3, '0')} / INV / ${selectedUnit.kodeInvoice} / ${roman} / ${periodeYear}`
    : '';
  const previewBANo = noUrut && selectedUnit && roman
    ? `${String(noUrut).padStart(3, '0')} / BA / ${selectedUnit.kodeInvoice} / ${roman} / ${periodeYear}`
    : '';

  const dpp = selectedUnit?.hargaUnit || 0;
  const ppn = Math.round(dpp * 0.11);
  const totalIncPPN = dpp + ppn;

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  // Get invoices for the selected unit to suggest next number
  const unitInvoices = invoices
    .filter(inv => selectedUnit && inv.pilihUnit.startsWith(unitCode))
    .sort((a, b) => b.no - a.no);

  const isSLB = selectedUnit?.unit.startsWith('SLB');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [unitRes, invRes] = await Promise.all([
        api.get('/units'),
        api.get('/invoices'),
      ]);
      setUnits(unitRes.data.data || []);
      setInvoices(invRes.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Suggest next number when unit changes
  useEffect(() => {
    if (unitInvoices.length > 0 && selectedUnit) {
      // Try to parse the last invoice number
      const lastInv = unitInvoices[0];
      const match = lastInv.noInvoice.match(/^(\d+)/);
      if (match) {
        setNoUrut(String(parseInt(match[1]) + 1));
      }
    }
  }, [unitCode, invoices.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitCode || !periodeMonth || !periodeYear || !noUrut || !tglDokumen) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        unitCode,
        periode: `${periodeMonth} ${periodeYear}`,
        noUrut: parseInt(noUrut),
        tglDokumen,
        docType: isSLB ? 'SLB_PENGAJUAN' : 'SCI_INVOICE'
      };
      const res = await api.post('/invoices', payload);
      if (res.data.success) {
        toast.success(isSLB ? 'Surat Pengajuan PO berhasil dibuat!' : 'Invoice berhasil dibuat!');
        navigate('/invoices');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat dokumen');
    } finally {
      setSubmitting(false);
    }
  };

  // Tax Invoice Helper text
  const taxHelperText = selectedUnit ? `Mohon dibuatkan Faktur Pajak untuk:
Nama: CV. AZMYA CAR TRANSINDO
NPWP: (sesuai data)
Alamat: Jl. M. Hatta, Kel. Muara Jawa Pesisir, Kec. Muara Jawa, Kab. Kutai Kartanegara, Kaltim 75261
Uraian: Jasa Sewa 1 (Satu) Unit Kendaraan Roda Empat ${selectedUnit.namaUnit} ${selectedUnit.nopol} Periode ${periodeMonth} ${periodeYear}
DPP: ${formatRupiah(dpp)}
PPN 11%: ${formatRupiah(ppn)}
Total: ${formatRupiah(totalIncPPN)}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(taxHelperText);
    setCopied(true);
    toast.success('Teks berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner message="Memuat data unit..." />;

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg-secondary)', margin: '-32px', padding: '32px', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--text-secondary)'
              }}
              title="Kembali ke Daftar Invoice"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              {isSLB ? 'Buat Pengajuan PO Baru' : 'Buat Invoice Baru'}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '28px' }}>
            Lengkapi formulir di bawah untuk membuat dokumen invoice & BA otomatis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn btn-secondary"
            style={{ borderRadius: '12px', padding: '10px 20px' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
            style={{ borderRadius: '12px', padding: '10px 24px', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Memproses...
              </>
            ) : (
              isSLB ? 'Buat Pengajuan PO' : 'Buat Invoice'
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Form Left (wide), Helpers Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }} className="create-form-grid">
        
        {/* Main Form Card */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION 1: Unit Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Truck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Informasi Unit</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pilih armada unit kendaraan untuk invoice ini</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Pilih Unit <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Truck size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <select
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  required
                  className="form-select"
                  style={{ width: '100%', paddingLeft: '42px', paddingRight: '40px', height: '46px', fontWeight: '600', appearance: 'none' }}
                >
                  <option value="" disabled hidden>Pilih Unit Logistik...</option>
                  {units.map(u => (
                    <option key={u.unit} value={u.unit}>{u.unit} - {u.namaUnit} ({u.nopol})</option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Unit Details Box */}
            {selectedUnit && (
              <div style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px 16px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Nama Unit</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.namaUnit}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Nopol</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.nopol}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Area</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.area}</strong>
                </div>
                {isSLB ? (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Customer</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.namaCustomer || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>NPWP Customer</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.npwpCustomer || '-'}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Koordinator</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.koordinator}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Jabatan</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.jabatan}</strong>
                    </div>
                  </>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Kode Invoice</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedUnit.kodeInvoice}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Harga DPP</span>
                  <strong style={{ color: 'var(--primary-600)', fontSize: '14px' }}>{formatRupiah(selectedUnit.hargaUnit)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Dokumen Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Detail Dokumen</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Periode bulan, tahun, tanggal dan nomor urut</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Periode Bulan */}
              <div className="form-group">
                <label className="form-label">Periode Bulan <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <select
                    value={periodeMonth}
                    onChange={(e) => setPeriodeMonth(e.target.value)}
                    required
                    className="form-select"
                    style={{ width: '100%', paddingLeft: '42px', paddingRight: '40px', height: '46px', fontWeight: '600', appearance: 'none' }}
                  >
                    <option value="" disabled hidden>Pilih Bulan...</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Tahun */}
              <div className="form-group">
                <label className="form-label">Tahun <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="number"
                    value={periodeYear}
                    onChange={(e) => setPeriodeYear(e.target.value)}
                    required
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px', height: '46px', fontWeight: '600' }}
                    min="2020"
                    max="2100"
                  />
                </div>
              </div>

              {/* Tanggal Dokumen */}
              <div className="form-group">
                <label className="form-label">Tanggal Dokumen <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    value={tglDokumen}
                    onChange={(e) => setTglDokumen(e.target.value)}
                    required
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px', height: '46px', fontWeight: '600', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* No Urut */}
              <div className="form-group">
                <label className="form-label">No Urut <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Hash size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="number"
                    value={noUrut}
                    onChange={(e) => setNoUrut(e.target.value)}
                    required
                    placeholder="misal: 042"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px', height: '46px', fontWeight: '600' }}
                  />
                </div>
              </div>
            </div>

            {/* Preview Box */}
            {previewInvoiceNo && (
              <div style={{
                background: 'var(--primary-50)',
                borderRadius: '12px',
                border: '1px solid var(--primary-200)',
                padding: '20px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Preview Nomor Dokumen
                </div>
                {isSLB ? (
                  <>
                    <div style={{ fontSize: '15px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '12px' }}>
                      {previewInvoiceNo.replace('/ INV /', '/ INP /')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--primary-200)', paddingTop: '10px' }}>
                      Total Pengajuan: <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(dpp)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif', fontWeight: '600', fontSize: '12px', display: 'inline-block', width: '40px' }}>INV:</span>
                      {previewInvoiceNo}
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '14px' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif', fontWeight: '600', fontSize: '12px', display: 'inline-block', width: '40px' }}>BA:</span>
                      {previewBANo}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      borderTop: '1px solid var(--primary-200)',
                      paddingTop: '14px',
                      fontSize: '13px'
                    }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>DPP</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(dpp)}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>PPN 11%</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(ppn)}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Total</span>
                        <strong style={{ color: 'var(--primary-700)', fontSize: '15px' }}>{formatRupiah(totalIncPPN)}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: Lampiran Dokumen */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UploadCloud size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Lampiran Dokumen</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Alur penggabungan berkas pendukung</span>
              </div>
            </div>

            <div style={{
              background: '#F9FAFB',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <UploadCloud size={18} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '3px' }}>Penggabungan Lampiran & Faktur</strong>
                Setelah invoice atau pengajuan berhasil dibuat, Anda dapat mengunggah dan menggabungkan berkas pendukung (PDF lampiran/faktur) secara langsung melalui tombol <strong>Kelola &rarr; Lampiran Berkas</strong> pada daftar tabel invoice.
              </div>
            </div>
          </div>
        </form>

        {/* Right Panel: Helpers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Invoice History Helper */}
          {selectedUnit && (
            <div className="card" style={{ padding: '24px', background: '#1A1A2E', color: '#FFFFFF', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: 'var(--primary-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Lightbulb size={16} />
                </div>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Pembantu Invoice</span>
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: 'var(--primary-300)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {unitCode}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#A2A3B7', marginBottom: '12px' }}>Invoice terakhir untuk unit ini:</p>

              {unitInvoices.length === 0 ? (
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#A2A3B7', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
                  Belum ada riwayat invoice.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {unitInvoices.slice(0, 5).map((inv, i) => (
                    <div key={i} style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '10px 12px', borderLeft: '3px solid var(--primary-500)' }}>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--primary-300)', fontWeight: '700', marginBottom: '4px' }}>
                        {inv.noInvoice.match(/^\d+\/\s*\w+\s*\/\s*\w+/)?.[0] || inv.noInvoice.substring(0, 22)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#A2A3B7', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{inv.periode}</span>
                        <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{formatRupiah(inv.totalIncPPN)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {noUrut && roman && (
                <div style={{ marginTop: '16px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Saran Berikutnya
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {String(noUrut).padStart(3, '0')} <span style={{ color: '#6B7280' }}>/</span> {roman}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tax Helper Panel */}
          {selectedUnit && periodeMonth && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={16} />
                </div>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Pengajuan Faktur</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Salin format ini untuk dikirim ke akuntan:
              </p>

              <div style={{
                background: '#F9FAFB',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '11px',
                lineHeight: '1.6',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                {taxHelperText}
              </div>

              <button
                onClick={handleCopy}
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {copied ? <><Check size={15} /> Tersalin!</> : <><Copy size={15} /> Salin Teks</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
