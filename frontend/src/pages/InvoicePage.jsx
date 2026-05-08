import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ExternalLink, Trash2, RefreshCw, Plus, Send, CheckCircle, Upload, Settings, FileText, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Unified Manage Modal state
  const [manageTarget, setManageTarget] = useState(null);
  
  // Form states inside modal
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateTglKirim, setUpdateTglKirim] = useState('');
  const [inputPO, setInputPO] = useState('');
  const [inputTglInvoice, setInputTglInvoice] = useState(new Date().toISOString().split('T')[0]);
  const [inputGR, setInputGR] = useState('');
  const [inputDP, setInputDP] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]); // Array of { name, base64, type }
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [invRes, unitRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/units'),
      ]);
      setInvoices(invRes.data.data || []);
      setUnits(unitRes.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchUnit = filterUnit ? inv.pilihUnit.startsWith(filterUnit) : true;
    
    const term = searchTerm.toLowerCase();
    const matchSearch = term ? (
      inv.noInvoice.toLowerCase().includes(term) ||
      inv.pilihUnit.toLowerCase().includes(term) ||
      inv.periode.toLowerCase().includes(term) ||
      inv.statusKirim.toLowerCase().includes(term) ||
      String(inv.no).includes(term)
    ) : true;
    
    return matchUnit && matchSearch;
  });

  const monthOrder = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    // 1. Urutkan berdasarkan Tahun
    const [monthA, yearA] = a.periode.split(' ');
    const [monthB, yearB] = b.periode.split(' ');
    
    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
    
    // 2. Urutkan berdasarkan Bulan
    if (monthA !== monthB) return monthOrder[monthA] - monthOrder[monthB];
    
    // 3. Urutkan berdasarkan Tipe Unit (SCI dulu, baru SLB)
    const unitA = a.pilihUnit.split(' - ')[0];
    const unitB = b.pilihUnit.split(' - ')[0];
    
    const typeA = unitA.startsWith('SCI') ? 0 : 1;
    const typeB = unitB.startsWith('SCI') ? 0 : 1;
    
    if (typeA !== typeB) return typeA - typeB;
    
    // 4. Urutkan berdasarkan Nomor Unit (U1, U2, U3)
    return unitA.localeCompare(unitB);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      if (!year || !month || !day) return dateStr;
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const formatPeriodeIndo = (periode) => {
    if (!periode) return '-';
    const monthMap = {
      'January': 'Januari', 'February': 'Februari', 'March': 'Maret', 'April': 'April',
      'May': 'Mei', 'June': 'Juni', 'July': 'Juli', 'August': 'Agustus',
      'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Desember'
    };
    const [month, year] = periode.split(' ');
    return `${monthMap[month] || month} ${year || ''}`.trim();
  };

  const submitStatusUpdate = async () => {
    if (!manageTarget) return;
    setActionLoading('status');
    try {
      const payload = { statusKirim: updateStatus };
      if (updateStatus === 'DIKIRIM' || updateStatus === 'LUNAS') {
        if (updateTglKirim) {
          payload.tglPengiriman = updateTglKirim;
        } else if (updateStatus === 'DIKIRIM' && !manageTarget.tglPengiriman) {
          payload.tglPengiriman = new Date().toISOString().split('T')[0];
        }
      }
      
      await api.put(`/invoices/${manageTarget.rowIndex}`, payload);
      toast.success(`Status berhasil diperbarui ke ${updateStatus}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status');
    } finally {
      setActionLoading(null);
    }
  };

  const submitPO = async () => {
    if (!manageTarget) return;
    if (!inputPO) {
      toast.error('Nomor PO wajib diisi');
      return;
    }
    try {
      setActionLoading('po');
      const res = await api.post(`/invoices/${manageTarget.rowIndex}/generate-slb`, {
        noPO: inputPO,
        tglInvoice: inputTglInvoice,
        grNumber: inputGR
      });
      if (res.data.success) {
        toast.success('Invoice Final berhasil dibuat');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat invoice final');
    } finally {
      setActionLoading(null);
    }
  };

  const submitDP = async () => {
    if (!manageTarget) return;
    try {
      setActionLoading('dp');
      const res = await api.put(`/invoices/${manageTarget.rowIndex}/dp`, { noDP: inputDP });
      if (res.data.success) {
        toast.success('No DP berhasil disimpan');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan No DP');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.rowIndex);
    try {
      await api.delete(`/invoices/${deleteTarget.rowIndex}`);
      toast.success('Invoice berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error('Gagal menghapus invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        setAttachedFiles(prev => {
          // Replace if same type exists, otherwise add
          const filtered = prev.filter(f => f.type !== type);
          return [...filtered, { name: file.name, base64, type }];
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const submitMergeAttachments = async () => {
    if (!manageTarget || attachedFiles.length === 0) return;
    setActionLoading('merge');
    try {
      toast.loading('Menggabungkan lampiran ke PDF Utama...', { id: 'merge' });
      const res = await api.post('/pdf/merge-attachments', {
        rowIndex: manageTarget.rowIndex,
        files: attachedFiles.map(f => ({ base64: f.base64, label: f.type }))
      });
      toast.success(res.data.message || 'Berhasil digabungkan!', { id: 'merge' });
      setAttachedFiles([]);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menggabungkan lampiran', { id: 'merge' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner message="Memuat data invoice..." />;

  const hasSLB = filteredInvoices.some(inv => inv.pilihUnit.startsWith('SLB'));

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg-secondary)', margin: '-32px', padding: '32px', minHeight: '100vh' }}>
      {/* Page Header (Restored to Original Left-Aligned for Admin) */}
      {user && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>Manajemen Invoice</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Kelola semua invoice dan status pengiriman secara efisien</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ borderRadius: '10px' }}>
              <RefreshCw size={15} /> Refresh Data
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/create')} style={{ borderRadius: '12px' }}>
              <Plus size={18} /> Buat Invoice Baru
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card filter-bar" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Filter size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filter Unit:</span>
        <select
          id="filter-unit"
          className="form-select"
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          style={{ padding: '8px 12px', minWidth: '160px' }}
        >
          <option value="">Semua Unit</option>
          {units.map(u => (
            <option key={u.unit} value={u.unit}>{u.unit}</option>
          ))}
        </select>
        
        <div className="filter-divider" style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
        
        <input 
          type="text" 
          className="form-input" 
          placeholder="Cari No Invoice, Periode, atau Status..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', flex: 1, maxWidth: '350px' }}
        />
        
        <div className="filter-divider" style={{ flex: 1 }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Menampilkan {filteredInvoices.length} dari {invoices.length} invoice
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {sortedInvoices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Belum ada data invoice</p>
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
                    {hasSLB && <th>No PO / DP</th>}
                    <th>Periode</th>
                    <th>Tgl Dokumen</th>
                    <th>Tgl Kirim</th>
                    <th>Jatuh Tempo</th>
                    <th>Status</th>
                    {user && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.map((inv, idx) => (
                    <tr key={inv.rowIndex} className={inv.isOverdue ? 'row-overdue' : ''}>
                      <td style={{ fontWeight: '600' }}>{idx + 1}</td>
                      <td style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-700)' }}>
                        {inv.pilihUnit.split(' - ')[0]}
                      </td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{inv.noInvoice}</td>
                      {hasSLB && (
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {inv.pilihUnit.startsWith('SLB') ? (
                            <>
                              <div style={{ color: 'var(--primary-700)', fontWeight: '600' }}>PO: {inv.noPO || '-'}</div>
                              <div style={{ color: 'var(--text-muted)' }}>DP: {inv.noDP || '-'}</div>
                            </>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>-</div>
                          )}
                        </td>
                      )}
                      <td style={{ color: '#000000' }}>{formatPeriodeIndo(inv.periode)}</td>
                      <td>{formatDate(inv.tglDokumen)}</td>
                      <td style={{ color: '#059669' }}>{formatDate(inv.tglPengiriman)}</td>
                      <td style={{ fontSize: '13px', color: inv.isOverdue ? '#DC2626' : undefined, fontWeight: inv.isOverdue ? '600' : undefined }}>
                        {formatDate(inv.jatuhTempo)}
                      </td>
                      <td><StatusBadge status={inv.statusKirim} isOverdue={inv.isOverdue} overdueDays={inv.overdueDays} daysLeft={inv.daysLeft} /></td>
                      {user && (
                        <td>
                          <div style={{ position: 'relative' }}>
                            <button className="btn btn-sm" onClick={() => {
                                setManageTarget(inv);
                                setUpdateStatus(inv.statusKirim);
                                setUpdateTglKirim(inv.tglPengiriman || new Date().toISOString().split('T')[0]);
                                setInputPO(inv.noPO || '');
                                setInputGR('');
                                setInputTglInvoice(new Date().toISOString().split('T')[0]);
                                setInputDP(inv.noDP || '');
                                setAttachedFiles([]);
                              }}
                              style={{ padding: '6px 10px', background: '#F3F4F6', color: '#4B5563', borderRadius: '6px', width: '100%' }}>
                              <Settings size={14} /> Kelola
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-invoice-card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedInvoices.map((inv, idx) => (
                  <div key={inv.rowIndex} className={`card ${inv.isOverdue ? 'row-overdue' : ''}`} style={{ padding: '16px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          #{idx + 1} • {inv.pilihUnit.split(' - ')[0]}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'monospace', margin: '4px 0' }}>{inv.noInvoice}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatPeriodeIndo(inv.periode)}</div>
                      </div>
                      <StatusBadge status={inv.statusKirim} isOverdue={inv.isOverdue} overdueDays={inv.overdueDays} daysLeft={inv.daysLeft} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tgl Kirim</div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>{formatDate(inv.tglPengiriman)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jatuh Tempo</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: inv.isOverdue ? '#DC2626' : 'inherit' }}>{formatDate(inv.jatuhTempo)}</div>
                      </div>
                    </div>

                    {inv.pilihUnit.startsWith('SLB') && (
                      <div style={{ fontSize: '12px', marginBottom: '12px', paddingLeft: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>PO:</span> <span style={{ fontWeight: '600' }}>{inv.noPO || '-'}</span>
                        <span style={{ margin: '0 8px', color: '#E5E7EB' }}>|</span>
                        <span style={{ color: 'var(--text-muted)' }}>DP:</span> <span style={{ fontWeight: '600' }}>{inv.noDP || '-'}</span>
                      </div>
                    )}

                    {user && (
                      <button className="btn btn-sm btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                        setManageTarget(inv);
                        setUpdateStatus(inv.statusKirim);
                        setUpdateTglKirim(inv.tglPengiriman || new Date().toISOString().split('T')[0]);
                        setInputPO(inv.noPO || '');
                        setInputGR('');
                        setInputTglInvoice(new Date().toISOString().split('T')[0]);
                        setInputDP(inv.noDP || '');
                        setAttachedFiles([]);
                      }}>
                        <Settings size={14} /> Kelola Invoice
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      }
    </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus Invoice?"
        message={`Apakah Anda yakin ingin menghapus invoice "${deleteTarget?.noInvoice}"? File PDF di Google Drive juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Unified Manage Invoice Modal */}
      {manageTarget && (
        <div style={{
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(6px)', 
          animation: 'fadeIn 0.2s ease-out',
          padding: '16px'
        }} onClick={() => setManageTarget(null)}>
          <div className="card" style={{ 
            padding: '24px', 
            maxWidth: '550px', 
            width: '100%', 
            maxHeight: 'calc(100vh - 40px)', 
            overflowY: 'auto',
            position: 'relative',
            borderRadius: '20px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'sticky', top: 0, background: '#fff', zIndex: 10, paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Kelola Invoice</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setManageTarget(null)} style={{ borderRadius: '10px' }}>Tutup</button>
            </div>

            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '20px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong>{manageTarget.noInvoice}</strong><br/>
              {manageTarget.pilihUnit}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {manageTarget.linkPDF && (
                <a href={manageTarget.linkPDF} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                  <ExternalLink size={14} /> Lihat PDF
                </a>
              )}
              <button className="btn btn-sm btn-danger" onClick={() => { setDeleteTarget(manageTarget); setManageTarget(null); }}>
                <Trash2 size={14} /> Hapus Invoice
              </button>
            </div>

            {/* Lampiran PDF (Khusus SLB) */}
            {manageTarget.pilihUnit.startsWith('SLB') && manageTarget.statusKirim !== 'MENUNGGU PO' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px', background: '#F0F9FF', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Lampiran Berkas (PDF)
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* PO Client Input */}
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px dashed #BAE6FD' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>File PO Client</span>
                      {!attachedFiles.find(f => f.type === 'PO') ? (
                        <button className="btn btn-sm" onClick={() => handleFileSelect('PO')} style={{ fontSize: '11px', padding: '4px 8px' }}>Pilih File</button>
                      ) : (
                        <button onClick={() => setAttachedFiles(prev => prev.filter(f => f.type !== 'PO'))} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                    {attachedFiles.find(f => f.type === 'PO') && (
                      <div style={{ fontSize: '11px', color: '#0369A1', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📎 {attachedFiles.find(f => f.type === 'PO').name}
                      </div>
                    )}
                  </div>

                  {/* Faktur Pajak Input */}
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px dashed #BAE6FD' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>Faktur Pajak</span>
                      {!attachedFiles.find(f => f.type === 'Faktur') ? (
                        <button className="btn btn-sm" onClick={() => handleFileSelect('Faktur')} style={{ fontSize: '11px', padding: '4px 8px' }}>Pilih File</button>
                      ) : (
                        <button onClick={() => setAttachedFiles(prev => prev.filter(f => f.type !== 'Faktur'))} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                    {attachedFiles.find(f => f.type === 'Faktur') && (
                      <div style={{ fontSize: '11px', color: '#0369A1', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📎 {attachedFiles.find(f => f.type === 'Faktur').name}
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn btn-primary" 
                    disabled={attachedFiles.length === 0 || actionLoading === 'merge'} 
                    onClick={submitMergeAttachments}
                    style={{ background: '#0369A1', marginTop: '4px' }}
                  >
                    {actionLoading === 'merge' ? 'Sedang Menggabungkan...' : 'Gabungkan ke PDF Utama'}
                  </button>
                  <p style={{ fontSize: '10px', color: '#64748B', textAlign: 'center' }}>
                    * Lampiran akan ditambahkan ke halaman akhir PDF utama.
                  </p>
                </div>
              </div>
            )}

            {/* Lampiran PDF (Khusus SCI) */}
            {!manageTarget.pilihUnit.startsWith('SLB') && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px', background: '#F0F9FF', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Lampiran Berkas (PDF)
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Faktur Pajak Input dengan Drag and Drop */}
                  <div 
                    style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px dashed #BAE6FD', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = '#0284C7'; e.currentTarget.style.background = '#F0F9FF'; }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = '#BAE6FD'; e.currentTarget.style.background = '#fff'; }}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      e.currentTarget.style.borderColor = '#BAE6FD'; 
                      e.currentTarget.style.background = '#fff';
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = reader.result.split(',')[1];
                          setAttachedFiles(prev => {
                            const filtered = prev.filter(f => f.type !== 'Faktur');
                            return [...filtered, { name: file.name, base64, type: 'Faktur' }];
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => {
                      if (!attachedFiles.find(f => f.type === 'Faktur')) {
                        handleFileSelect('Faktur');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>Faktur Pajak <span style={{fontSize: '10px', color: '#64748B', fontWeight: 'normal'}}>(Tarik file ke sini)</span></span>
                      {!attachedFiles.find(f => f.type === 'Faktur') ? (
                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleFileSelect('Faktur'); }} style={{ fontSize: '11px', padding: '4px 8px' }}>Pilih File</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setAttachedFiles(prev => prev.filter(f => f.type !== 'Faktur')); }} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                    {attachedFiles.find(f => f.type === 'Faktur') && (
                      <div style={{ fontSize: '11px', color: '#0369A1', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📎 {attachedFiles.find(f => f.type === 'Faktur').name}
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn btn-primary" 
                    disabled={attachedFiles.length === 0 || actionLoading === 'merge'} 
                    onClick={submitMergeAttachments}
                    style={{ background: '#0369A1', marginTop: '4px' }}
                  >
                    {actionLoading === 'merge' ? 'Sedang Menggabungkan...' : 'Gabungkan ke PDF Utama'}
                  </button>
                  <p style={{ fontSize: '10px', color: '#64748B', textAlign: 'center' }}>
                    * Lampiran akan ditambahkan ke halaman akhir PDF utama.
                  </p>
                </div>
              </div>
            )}

            {/* 1. Ubah Status */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Ubah Status</h4>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Status Baru</label>
                  <select className="form-select" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
                    <option value="PENDING">PENDING</option>
                    <option value="DIKIRIM">DIKIRIM</option>
                    <option value="LUNAS">LUNAS</option>
                  </select>
                </div>
                {(updateStatus === 'DIKIRIM' || updateStatus === 'LUNAS') && (
                  <div style={{ flex: '1 1 120px' }}>
                    <label className="form-label">Tgl Dikirim</label>
                    <input className="form-input" type="date" value={updateTglKirim} onChange={(e) => setUpdateTglKirim(e.target.value)} />
                  </div>
                )}
                <button className="btn btn-primary" onClick={submitStatusUpdate} disabled={actionLoading === 'status'} style={{ height: '38px' }}>
                  {actionLoading === 'status' ? '...' : 'Simpan Status'}
                </button>
              </div>
            </div>

            {/* 2. Input PO (SLB Only) */}
            {manageTarget.statusKirim === 'MENUNGGU PO' && manageTarget.pilihUnit.startsWith('SLB') && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1E40AF' }}>Input PO & Buat Invoice Final</h4>
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Nomor PO *</label>
                      <input type="text" className="form-input" value={inputPO} onChange={e => setInputPO(e.target.value)} placeholder="Contoh: 4500123456" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">GR Number</label>
                      <input type="text" className="form-input" value={inputGR} onChange={e => setInputGR(e.target.value)} placeholder="Opsional" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Tanggal Invoice Final</label>
                      <input type="date" className="form-input" value={inputTglInvoice} onChange={e => setInputTglInvoice(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={submitPO} disabled={actionLoading === 'po' || !inputPO} style={{ background: '#1E40AF' }}>
                      {actionLoading === 'po' ? 'Memproses...' : 'Buat Final'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Input DP (SLB Only) */}
            {manageTarget.statusKirim !== 'MENUNGGU PO' && manageTarget.pilihUnit.startsWith('SLB') && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#BE185D' }}>Update Nomor DP</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Nomor DP</label>
                    <input type="text" className="form-input" value={inputDP} onChange={e => setInputDP(e.target.value)} placeholder="Contoh: DP-2026-001" />
                  </div>
                  <button className="btn btn-primary" onClick={submitDP} disabled={actionLoading === 'dp'} style={{ background: '#BE185D', height: '38px' }}>
                    {actionLoading === 'dp' ? '...' : 'Simpan DP'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}


