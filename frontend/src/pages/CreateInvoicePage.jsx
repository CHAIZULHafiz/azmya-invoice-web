import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lightbulb, Copy, Check, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
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
    <div className="animate-fade-in">
      {/* Page Header (Restored to Original Left-Aligned) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>Buat Invoice Baru</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Lengkapi formulir di bawah untuk membuat invoice profesional.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/invoices')} style={{ borderRadius: '12px' }}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ borderRadius: '12px' }}>
            {submitting ? <><Loader2 size={16} className="spin" /> Memproses...</> : (isSLB ? 'Buat Pengajuan PO' : 'Buat Invoice')}
          </button>
        </div>
      </div>

      <div className="create-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'flex-start' }}>
        {/* Main Form */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <FileText size={20} color="var(--primary-600)" />
            <h2 style={{ fontSize: '17px', fontWeight: '700' }}>Detail Invoice</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Pilih Unit */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Pilih Unit</label>
              <select id="select-unit" className="form-select" value={unitCode} onChange={(e) => setUnitCode(e.target.value)} style={{ width: '100%' }}>
                <option value="">Pilih Unit Logistik</option>
                {units.map(u => (
                  <option key={u.unit} value={u.unit}>
                    {u.unit} - {u.namaUnit} ({u.nopol})
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Details (auto-filled) */}
            {selectedUnit && (
              <div style={{
                background: '#FAFBFC',
                borderRadius: 'var(--border-radius-sm)',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Nama Unit:</span> <strong>{selectedUnit.namaUnit}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Nopol:</span> <strong>{selectedUnit.nopol}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Area:</span> <strong>{selectedUnit.area}</strong></div>
                
                {isSLB ? (
                  <>
                    <div><span style={{ color: 'var(--text-muted)' }}>Customer:</span> <strong>{selectedUnit.namaCustomer || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>NPWP:</span> <strong>{selectedUnit.npwpCustomer || '-'}</strong></div>
                  </>
                ) : (
                  <>
                    <div><span style={{ color: 'var(--text-muted)' }}>Koordinator:</span> <strong>{selectedUnit.koordinator}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Jabatan:</span> <strong>{selectedUnit.jabatan}</strong></div>
                  </>
                )}
                
                <div><span style={{ color: 'var(--text-muted)' }}>Kode:</span> <strong>{selectedUnit.kodeInvoice}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Harga DPP:</span> <strong>{formatRupiah(selectedUnit.hargaUnit)}</strong></div>
              </div>
            )}

            {/* Periode & Tanggal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Periode (Bulan & Tahun)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select id="select-periode" className="form-select" value={periodeMonth} onChange={(e) => setPeriodeMonth(e.target.value)} style={{ flex: 2 }}>
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input type="number" className="form-input" value={periodeYear} onChange={(e) => setPeriodeYear(e.target.value)} style={{ flex: 1 }} min="2020" max="2100" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Dokumen</label>
                <input id="input-tgl" className="form-input" type="date" value={tglDokumen} onChange={(e) => setTglDokumen(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            {/* No Urut & Romawi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">No Urut</label>
                <input id="input-nourut" className="form-input" type="number" placeholder="misal: 042" value={noUrut} onChange={(e) => setNoUrut(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Romawi (Otomatis)</label>
                <input className="form-input" type="text" value={roman} readOnly style={{ width: '100%', background: '#F9FAFB' }} />
              </div>
            </div>

            {/* Preview */}
            {previewInvoiceNo && (
              <div style={{
                background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '16px',
                border: '1px solid #FDE68A',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary-700)', marginBottom: '8px', textTransform: 'uppercase' }}>Preview Nomor</div>
                {isSLB ? (
                  <>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', marginBottom: '12px' }}>
                      <strong>No. Pengajuan:</strong> {previewInvoiceNo.replace('/ INV /', '/ INP /')}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '13px' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Total Pengajuan (Tanpa PPN):</span> <strong>{formatRupiah(dpp)}</strong></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', marginBottom: '4px' }}>
                      <strong>Invoice:</strong> {previewInvoiceNo}
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', marginBottom: '12px' }}>
                      <strong>BA:</strong> {previewBANo}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>DPP:</span> <strong>{formatRupiah(dpp)}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>PPN 11%:</span> <strong>{formatRupiah(ppn)}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Total:</span> <strong>{formatRupiah(totalIncPPN)}</strong></div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Upload Faktur Pajak */}
            <div style={{ marginTop: '20px' }}>
              <label className="form-label">Upload Faktur Pajak</label>
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--text-muted)',
              }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.jpg,.png';
                  input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    toast.success(`File "${file.name}" siap diupload setelah invoice dibuat`);
                  };
                  input.click();
                }}
              >
                <Upload size={24} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px' }}>Klik untuk unggah atau seret file ke sini</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>PDF, JPG, atau PNG (maks. 5MB)</p>
              </div>
            </div>
          </form>
        </div>

        {/* Right Panel - Helper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Invoice Helper */}
          {selectedUnit && (
            <div style={{
              background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
              borderRadius: 'var(--border-radius)',
              padding: '24px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Lightbulb size={18} color="#F59E0B" />
                <span style={{ fontSize: '15px', fontWeight: '700' }}>Pembantu Invoice</span>
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(245,158,11,0.2)',
                  color: '#FCD34D',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                }}>{unitCode}</span>
              </div>

              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                Invoice terakhir untuk unit terpilih:
              </p>

              {unitInvoices.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '16px' }}>
                  Belum ada invoice untuk unit ini
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {unitInvoices.slice(0, 5).map((inv, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px',
                      borderLeft: '3px solid #F59E0B',
                    }}>
                      <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#FCD34D', fontWeight: '600' }}>
                        {inv.noInvoice.match(/^\d+\/\s*\w+\s*\/\s*\w+/)?.[0] || inv.noInvoice.substring(0, 20)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                        {inv.periode} • {formatRupiah(inv.totalIncPPN)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested next number */}
              {noUrut && roman && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(245,158,11,0.15)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245,158,11,0.3)',
                }}>
                  <div style={{ fontSize: '11px', color: '#FCD34D', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Saran Berikutnya
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'monospace' }}>
                    {String(noUrut).padStart(3, '0')} <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span> {roman}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tax Helper Panel */}
          {selectedUnit && periodeMonth && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--primary-600)" />
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Pengajuan Faktur Pajak</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Salin teks berikut untuk dikirim ke akuntan:
              </p>
              <div style={{
                background: '#F9FAFB',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                lineHeight: 1.6,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
              }}>
                {taxHelperText}
              </div>
              <button className="btn btn-sm btn-secondary" onClick={handleCopy} style={{ marginTop: '12px', width: '100%' }}>
                {copied ? <><Check size={14} /> Tersalin!</> : <><Copy size={14} /> Salin Teks</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Upload(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={props.style}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
