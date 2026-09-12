import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Filter, ExternalLink, Trash2, RefreshCw, Plus, Send, CheckCircle, Upload, Settings, FileText, XCircle, Download, Eye, ChevronDown, ChevronUp, X, Check, AlertCircle, FileCheck } from 'lucide-react';
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
  const [filterUnit, setFilterUnit] = useState([]); // Array of string, e.g. ['SCI U1', 'SCI U2']
  const [filterStatus, setFilterStatus] = useState([]); // Array of string, e.g. ['PENDING', 'DIKIRIM']
  const [filterPeriode, setFilterPeriode] = useState([]); // Array of string, e.g. ['Januari 2026', 'Februari 2026']
  const [activeFilterMenu, setActiveFilterMenu] = useState(null); // 'unit' | 'periode' | 'status' | null
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Toggle helper for multi-select filters
  const toggleFilterItem = (setter, item) => {
    setter(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };
  
  // Unified Manage Modal state
  const [manageTarget, setManageTarget] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  
  // Form states inside modal
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateTglKirim, setUpdateTglKirim] = useState('');
  const [inputPO, setInputPO] = useState('');
  const [inputTglInvoice, setInputTglInvoice] = useState(new Date().toISOString().split('T')[0]);
  const [inputGR, setInputGR] = useState('');
  const [inputDP, setInputDP] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]); // Array of { name, size, formattedSize, base64, type }
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState(''); // 'uploading' | 'merging' | 'success' | ''

  
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePreviewPdf = (inv) => {
    if (!inv.linkPDF) {
      toast.error('Berkas PDF belum tersedia');
      return;
    }
    const url = inv.linkPDF.replace('/view', '/preview');
    const fileIdMatch = inv.linkPDF.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const downloadUrl = fileIdMatch ? `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}` : inv.linkPDF;
    setPreviewPdfUrl({
      original: inv.linkPDF,
      preview: url,
      download: downloadUrl,
      title: inv.noInvoice || 'Dokumen Invoice'
    });
  };

  useEffect(() => { loadData(); }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.filter-dropdown-container') && !e.target.closest('.filter-toggle-btn')) {
        setActiveFilterMenu(null);
      }
    };
    if (activeFilterMenu) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeFilterMenu]);

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

  // Indonesian Month Name Mapping & Normalizer
  const monthIndoToEng = {
    'Januari': 'January', 'Februari': 'February', 'Maret': 'March', 'April': 'April',
    'Mei': 'May', 'Juni': 'June', 'Juli': 'July', 'Agustus': 'August',
    'September': 'September', 'Oktober': 'October', 'November': 'November', 'Desember': 'December'
  };

  const monthEngToIndo = {
    'January': 'Januari', 'February': 'Februari', 'March': 'Maret', 'April': 'April',
    'May': 'Mei', 'June': 'Juni', 'July': 'Juli', 'August': 'Agustus',
    'September': 'September', 'October': 'Oktober', 'November': 'November', 'Desember': 'Desember'
  };

  const normalizePeriodeIndo = (periode) => {
    if (!periode) return '';
    const parts = periode.trim().split(/\s+/);
    if (parts.length < 2) return periode;
    const [month, ...rest] = parts;
    const year = rest.join(' ');
    const indoMonth = monthEngToIndo[month] || month;
    return `${indoMonth} ${year}`.trim();
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchUnit = filterUnit.length > 0 
      ? filterUnit.some(u => inv.pilihUnit.startsWith(u)) 
      : true;

    const matchStatus = filterStatus.length > 0 
      ? filterStatus.some(st => st === 'OVERDUE' ? inv.isOverdue : inv.statusKirim === st) 
      : true;

    const matchPeriode = filterPeriode.length > 0 
      ? filterPeriode.includes(normalizePeriodeIndo(inv.periode)) 
      : true;
    
    const term = searchTerm.toLowerCase();
    const matchSearch = term ? (
      inv.noInvoice.toLowerCase().includes(term) ||
      inv.pilihUnit.toLowerCase().includes(term) ||
      inv.periode.toLowerCase().includes(term) ||
      normalizePeriodeIndo(inv.periode).toLowerCase().includes(term) ||
      inv.statusKirim.toLowerCase().includes(term) ||
      String(inv.no).includes(term)
    ) : true;
    
    return matchUnit && matchStatus && matchPeriode && matchSearch;
  });

  const monthOrder = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
    'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12,
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  // Extract unique normalized periodes for filter dropdown (sorted chronologically)
  const uniquePeriodes = Array.from(new Set(invoices.map(inv => normalizePeriodeIndo(inv.periode)).filter(Boolean)))
    .sort((a, b) => {
      const partsA = String(a || '').trim().split(/\s+/);
      const partsB = String(b || '').trim().split(/\s+/);
      const [mA, yA] = [partsA[0] || '', partsA[1] || ''];
      const [mB, yB] = [partsB[0] || '', partsB[1] || ''];
      if (yA !== yB) return (parseInt(yA) || 0) - (parseInt(yB) || 0);
      return (monthOrder[mA] || 0) - (monthOrder[mB] || 0);
    });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    // 1. Urutkan berdasarkan Tahun
    const partsA = String(a.periode || '').trim().split(/\s+/);
    const partsB = String(b.periode || '').trim().split(/\s+/);
    const [monthA, yearA] = [partsA[0] || '', partsA[1] || ''];
    const [monthB, yearB] = [partsB[0] || '', partsB[1] || ''];
    
    if (yearA !== yearB) return (parseInt(yearA) || 0) - (parseInt(yearB) || 0);
    
    // 2. Urutkan berdasarkan Bulan
    if (monthA !== monthB) return (monthOrder[monthA] || 0) - (monthOrder[monthB] || 0);
    
    // 3. Urutkan berdasarkan Tipe Unit (SCI dulu, baru SLB)
    const unitA = String(a.pilihUnit || '').split(' - ')[0];
    const unitB = String(b.pilihUnit || '').split(' - ')[0];
    
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
    const parts = String(periode).trim().split(/\s+/);
    const [month, ...rest] = parts;
    const year = rest.join(' ');
    return `${monthMap[month] || month} ${year}`.trim();
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processSelectedFile = (file, type) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('File harus berupa dokumen PDF (.pdf)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setAttachedFiles(prev => {
        const filtered = prev.filter(f => f.type !== type);
        return [...filtered, {
          name: file.name,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          base64,
          type
        }];
      });
      setUploadPhase('');
      setUploadProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      processSelectedFile(file, type);
    };
    input.click();
  };

  const submitMergeAttachments = async () => {
    if (!manageTarget || attachedFiles.length === 0) return;
    setActionLoading('merge');
    setUploadPhase('uploading');
    setUploadProgress(10);

    try {
      const res = await api.post(
        '/pdf/merge-attachments',
        {
          rowIndex: manageTarget.rowIndex,
          files: attachedFiles.map(f => ({ base64: f.base64, label: f.type }))
        },
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
              setUploadProgress(Math.max(15, percent));
              if (percent >= 85) {
                setUploadPhase('merging');
              }
            } else {
              setUploadProgress(60);
              setUploadPhase('merging');
            }
          }
        }
      );

      setUploadProgress(100);
      setUploadPhase('success');
      toast.success(res.data.message || 'Berkas berhasil digabungkan!');
      
      // Keep success state visible for 1.5 seconds then refresh
      setTimeout(() => {
        setAttachedFiles([]);
        setUploadPhase('');
        setUploadProgress(0);
        loadData();
      }, 1500);
    } catch (err) {
      setUploadPhase('');
      setUploadProgress(0);
      toast.error(err.response?.data?.message || 'Gagal menggabungkan lampiran');
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

      {/* Active Filter Indicators & Reset (Permanent consistent height bar) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', background: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '46px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Aktif:</span>
        
        {filterUnit.length === 0 && filterStatus.length === 0 && filterPeriode.length === 0 && !searchTerm ? (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Semua data ditampilkan (tidak ada filter aktif)
          </span>
        ) : (
          <>
            {/* Unit Badges */}
            {filterUnit.map(u => (
              <span key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', color: '#4F46E5', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                Unit: {u}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleFilterItem(setFilterUnit, u)} />
              </span>
            ))}

            {/* Periode Badges */}
            {filterPeriode.map(p => (
              <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                {p}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleFilterItem(setFilterPeriode, p)} />
              </span>
            ))}

            {/* Status Badges */}
            {filterStatus.map(st => (
              <span key={st} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                {st}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleFilterItem(setFilterStatus, st)} />
              </span>
            ))}

            {/* Search Term Badge */}
            {searchTerm && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', color: '#4B5563', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                Cari: "{searchTerm}"
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              </span>
            )}

            <button 
              onClick={() => { setFilterUnit([]); setFilterStatus([]); setFilterPeriode([]); setSearchTerm(''); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Reset Semua Filter
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'visible' }}>
        {sortedInvoices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Belum ada data invoice yang sesuai kriteria</p>
            {(filterUnit.length > 0 || filterStatus.length > 0 || filterPeriode.length > 0 || searchTerm) && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => { setFilterUnit([]); setFilterStatus([]); setFilterPeriode([]); setSearchTerm(''); }}
                style={{ marginTop: '12px' }}
              >
                Hapus Filter
              </button>
            )}
          </div>
         ) : (
          <>
            <div className="table-container desktop-table" style={{ border: 'none', borderRadius: 0, overflow: 'visible', position: 'relative' }}>
              <table className="data-table" style={{ overflow: 'visible' }}>
                <thead>
                  <tr>
                    <th>NO</th>

                    {/* UNIT with Multi-select filter dropdown */}
                    <th style={{ position: 'relative', overflow: 'visible' }}>
                      <div 
                        className="filter-toggle-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none', padding: '4px 6px', borderRadius: '6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilterMenu(prev => prev === 'unit' ? null : 'unit');
                        }}
                      >
                        <span style={{ color: filterUnit.length > 0 ? '#4F46E5' : 'inherit', fontWeight: filterUnit.length > 0 ? '800' : 'inherit' }}>
                          UNIT {filterUnit.length > 0 ? `(${filterUnit.length})` : ''}
                        </span>
                        <Filter size={13} color={filterUnit.length > 0 ? '#4F46E5' : '#9CA3AF'} />
                        {activeFilterMenu === 'unit' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>

                      {activeFilterMenu === 'unit' && (
                        <div 
                          className="filter-dropdown-container"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 9999,
                            background: '#fff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.22)',
                            minWidth: '200px',
                            padding: '6px 0',
                            marginTop: '4px',
                            textAlign: 'left'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pilih Unit</span>
                            {filterUnit.length > 0 && (
                              <button 
                                onClick={() => setFilterUnit([])}
                                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          
                          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
                            {units.map(u => {
                              const isChecked = filterUnit.includes(u.unit);
                              return (
                                <div 
                                  key={u.unit}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: isChecked ? '#EEF2FF' : 'transparent',
                                    color: isChecked ? '#4F46E5' : '#374151',
                                    fontWeight: isChecked ? '700' : '500'
                                  }}
                                  onClick={() => toggleFilterItem(setFilterUnit, u.unit)}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {}} 
                                    style={{ cursor: 'pointer', accentColor: '#4F46E5', width: '14px', height: '14px' }} 
                                  />
                                  <span>{u.unit}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </th>

                    <th>NO INVOICE</th>
                    {hasSLB && <th>NO PO / DP</th>}

                    {/* PERIODE with Multi-select filter dropdown */}
                    <th style={{ position: 'relative', overflow: 'visible' }}>
                      <div 
                        className="filter-toggle-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none', padding: '4px 6px', borderRadius: '6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilterMenu(prev => prev === 'periode' ? null : 'periode');
                        }}
                      >
                        <span style={{ color: filterPeriode.length > 0 ? '#16A34A' : 'inherit', fontWeight: filterPeriode.length > 0 ? '800' : 'inherit' }}>
                          PERIODE {filterPeriode.length > 0 ? `(${filterPeriode.length})` : ''}
                        </span>
                        <Filter size={13} color={filterPeriode.length > 0 ? '#16A34A' : '#9CA3AF'} />
                        {activeFilterMenu === 'periode' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>

                      {activeFilterMenu === 'periode' && (
                        <div 
                          className="filter-dropdown-container"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 9999,
                            background: '#fff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.22)',
                            minWidth: '200px',
                            maxHeight: '300px',
                            padding: '6px 0',
                            marginTop: '4px',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pilih Periode</span>
                            {filterPeriode.length > 0 && (
                              <button 
                                onClick={() => setFilterPeriode([])}
                                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Reset
                              </button>
                            )}
                          </div>

                          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
                            {uniquePeriodes.map(p => {
                              const isChecked = filterPeriode.includes(p);
                              return (
                                <div 
                                  key={p}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: isChecked ? '#F0FDF4' : 'transparent',
                                    color: isChecked ? '#16A34A' : '#374151',
                                    fontWeight: isChecked ? '700' : '500'
                                  }}
                                  onClick={() => toggleFilterItem(setFilterPeriode, p)}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {}} 
                                    style={{ cursor: 'pointer', accentColor: '#16A34A', width: '14px', height: '14px' }} 
                                  />
                                  <span>{formatPeriodeIndo(p)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </th>

                    <th>TGL DOKUMEN</th>
                    <th>TGL KIRIM</th>
                    <th>JATUH TEMPO</th>

                    {/* STATUS with Multi-select filter dropdown */}
                    <th style={{ position: 'relative', overflow: 'visible' }}>
                      <div 
                        className="filter-toggle-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none', padding: '4px 6px', borderRadius: '6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilterMenu(prev => prev === 'status' ? null : 'status');
                        }}
                      >
                        <span style={{ color: filterStatus.length > 0 ? '#D97706' : 'inherit', fontWeight: filterStatus.length > 0 ? '800' : 'inherit' }}>
                          STATUS {filterStatus.length > 0 ? `(${filterStatus.length})` : ''}
                        </span>
                        <Filter size={13} color={filterStatus.length > 0 ? '#D97706' : '#9CA3AF'} />
                        {activeFilterMenu === 'status' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>

                      {activeFilterMenu === 'status' && (
                        <div 
                          className="filter-dropdown-container"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 9999,
                            background: '#fff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.22)',
                            minWidth: '190px',
                            padding: '6px 0',
                            marginTop: '4px',
                            textAlign: 'left'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pilih Status</span>
                            {filterStatus.length > 0 && (
                              <button 
                                onClick={() => setFilterStatus([])}
                                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Reset
                              </button>
                            )}
                          </div>

                          <div style={{ padding: '4px 0' }}>
                            {['PENDING', 'MENUNGGU PO', 'DIKIRIM', 'LUNAS', 'OVERDUE'].map(st => {
                              const isChecked = filterStatus.includes(st);
                              return (
                                <div 
                                  key={st}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: isChecked ? '#FEF3C7' : 'transparent',
                                    color: isChecked ? '#D97706' : '#374151',
                                    fontWeight: isChecked ? '700' : '500'
                                  }}
                                  onClick={() => toggleFilterItem(setFilterStatus, st)}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {}} 
                                    style={{ cursor: 'pointer', accentColor: '#D97706', width: '14px', height: '14px' }} 
                                  />
                                  <span>{st === 'OVERDUE' ? '⚠️ OVERDUE' : st}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </th>

                    {user && <th>AKSI</th>}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {inv.linkPDF ? (
                              <button
                                className="btn btn-sm"
                                title="Lihat PDF"
                                onClick={() => handlePreviewPdf(inv)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#EEF2FF',
                                  color: '#4F46E5',
                                  borderRadius: '6px',
                                  border: '1px solid #C7D2FE',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Eye size={15} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm"
                                disabled
                                title="PDF belum ada"
                                style={{
                                  padding: '6px 8px',
                                  background: '#F3F4F6',
                                  color: '#9CA3AF',
                                  borderRadius: '6px',
                                  border: '1px solid #E5E7EB',
                                  cursor: 'not-allowed',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Eye size={15} />
                              </button>
                            )}

                            <button
                              className="btn btn-sm"
                              onClick={() => {
                                setManageTarget(inv);
                                setUpdateStatus(inv.statusKirim);
                                setUpdateTglKirim(inv.tglPengiriman || new Date().toISOString().split('T')[0]);
                                setInputPO(inv.noPO || '');
                                setInputGR('');
                                setInputTglInvoice(new Date().toISOString().split('T')[0]);
                                setInputDP(inv.noDP || '');
                                setAttachedFiles([]);
                              }}
                              style={{ padding: '6px 10px', background: '#F3F4F6', color: '#4B5563', borderRadius: '6px', whiteSpace: 'nowrap' }}
                            >
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
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        {inv.linkPDF ? (
                          <button
                            className="btn btn-sm"
                            title="Lihat PDF"
                            onClick={() => handlePreviewPdf(inv)}
                            style={{
                              padding: '8px 12px',
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              borderRadius: '8px',
                              border: '1px solid #C7D2FE',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Eye size={15} /> PDF
                          </button>
                        ) : null}

                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => {
                            setManageTarget(inv);
                            setUpdateStatus(inv.statusKirim);
                            setUpdateTglKirim(inv.tglPengiriman || new Date().toISOString().split('T')[0]);
                            setInputPO(inv.noPO || '');
                            setInputGR('');
                            setInputTglInvoice(new Date().toISOString().split('T')[0]);
                            setInputDP(inv.noDP || '');
                            setAttachedFiles([]);
                          }}
                        >
                          <Settings size={14} /> Kelola Invoice
                        </button>
                      </div>
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

      {manageTarget && createPortal(
        <div style={{
          position: 'fixed', 
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 9999, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', 
          animation: 'fadeIn 0.2s ease-out',
          padding: '24px'
        }} onClick={() => setManageTarget(null)}>
          <div className="card" style={{ 
            padding: '24px', 
            maxWidth: '550px', 
            width: '100%', 
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Kelola Invoice</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setManageTarget(null)} style={{ borderRadius: '10px' }}>Tutup</button>
            </div>

            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '20px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong>{manageTarget.noInvoice}</strong><br/>
              {manageTarget.pilihUnit}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-danger" onClick={() => { setDeleteTarget(manageTarget); setManageTarget(null); }}>
                <Trash2 size={14} /> Hapus Invoice
              </button>
            </div>

            {/* Lampiran Berkas (PDF) - Unified Modern Upload with Animated Progress Bar */}
            {manageTarget.statusKirim !== 'MENUNGGU PO' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={15} />
                    </div>
                    Lampiran Berkas (PDF)
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                    {manageTarget.pilihUnit.startsWith('SLB') ? 'PO & Faktur' : 'Faktur Pajak'}
                  </span>
                </div>

                {/* Dropzone Area (if files not yet selected) */}
                <div style={{ display: 'grid', gridTemplateColumns: manageTarget.pilihUnit.startsWith('SLB') ? '1fr 1fr' : '1fr', gap: '10px', marginBottom: '12px' }}>
                  {/* Slot PO Client (SLB only) */}
                  {manageTarget.pilihUnit.startsWith('SLB') && (
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: actionLoading === 'merge' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.background = '#EEF2FF'; }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FFFFFF'; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.background = '#FFFFFF';
                        if (actionLoading !== 'merge' && e.dataTransfer.files?.[0]) {
                          processSelectedFile(e.dataTransfer.files[0], 'PO');
                        }
                      }}
                      onClick={() => {
                        if (actionLoading !== 'merge') handleFileSelect('PO');
                      }}
                    >
                      <Upload size={18} style={{ margin: '0 auto 4px', color: '#4F46E5' }} />
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>Pilih File PO Client</div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Format .PDF (Tarik file ke sini)</div>
                    </div>
                  )}

                  {/* Slot Faktur Pajak */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center',
                      cursor: actionLoading === 'merge' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.background = '#EEF2FF'; }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FFFFFF'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.background = '#FFFFFF';
                      if (actionLoading !== 'merge' && e.dataTransfer.files?.[0]) {
                        processSelectedFile(e.dataTransfer.files[0], 'Faktur');
                      }
                    }}
                    onClick={() => {
                      if (actionLoading !== 'merge') handleFileSelect('Faktur');
                    }}
                  >
                    <Upload size={18} style={{ margin: '0 auto 4px', color: '#4F46E5' }} />
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>Pilih Faktur Pajak</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Format .PDF (Tarik file ke sini)</div>
                  </div>
                </div>

                {/* Selected Files Animated Cards */}
                {attachedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {attachedFiles.map((file) => (
                      <div
                        key={file.type}
                        className={uploadPhase === 'uploading' ? 'upload-card-active' : ''}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* File Icon Badge */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: uploadPhase === 'success' ? '#ECFDF5' : '#FEF2F2',
                            color: uploadPhase === 'success' ? '#10B981' : '#EF4444',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontWeight: '800',
                            fontSize: '9px',
                            letterSpacing: '0.5px'
                          }}>
                            {uploadPhase === 'success' ? (
                              <Check size={18} color="#10B981" />
                            ) : (
                              <>
                                <FileText size={16} />
                                <span>PDF</span>
                              </>
                            )}
                          </div>

                          {/* File Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}>
                                {file.type === 'PO' ? 'PO Client' : 'Faktur Pajak'}
                              </span>
                              <strong style={{ fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.name}
                              </strong>
                            </div>

                            {/* Status subtitle */}
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {uploadPhase === 'uploading' && (
                                <span style={{ color: '#4F46E5', fontWeight: '600' }}>
                                  Mengunggah {uploadProgress}% • {file.formattedSize || 'PDF'}
                                </span>
                              )}
                              {uploadPhase === 'merging' && (
                                <span style={{ color: '#D97706', fontWeight: '600' }}>
                                  Menggabungkan ke PDF Utama...
                                </span>
                              )}
                              {uploadPhase === 'success' && (
                                <span style={{ color: '#16A34A', fontWeight: '600' }}>
                                  ✓ Selesai digabungkan
                                </span>
                              )}
                              {!uploadPhase && (
                                <span>
                                  Siap digabung • {file.formattedSize || 'PDF'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action / Remove Button */}
                          {uploadPhase !== 'uploading' && uploadPhase !== 'merging' && (
                            <button
                              type="button"
                              onClick={() => setAttachedFiles(prev => prev.filter(f => f.type !== file.type))}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                border: 'none',
                                background: '#F1F5F9',
                                color: '#64748B',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              title="Hapus / ganti file"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Progress Bar Line */}
                        {uploadPhase && (
                          <div style={{ marginTop: '10px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              className={uploadPhase === 'uploading' ? 'upload-progress-bar-animated' : ''}
                              style={{
                                height: '100%',
                                width: `${uploadProgress}%`,
                                background: uploadPhase === 'success' ? '#10B981' : 'linear-gradient(90deg, #4F46E5, #6366F1)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Merge Button */}
                <button
                  className="btn btn-primary"
                  disabled={attachedFiles.length === 0 || actionLoading === 'merge'}
                  onClick={submitMergeAttachments}
                  style={{
                    width: '100%',
                    background: uploadPhase === 'success' ? '#10B981' : '#4F46E5',
                    borderRadius: '10px',
                    padding: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {uploadPhase === 'uploading' ? (
                    <>Mengunggah Berkas ({uploadProgress}%)...</>
                  ) : uploadPhase === 'merging' ? (
                    <>Menggabungkan ke PDF Utama...</>
                  ) : uploadPhase === 'success' ? (
                    <><Check size={16} /> Berhasil Digabungkan!</>
                  ) : (
                    <>Gabungkan {attachedFiles.length} Berkas ke PDF Utama</>
                  )}
                </button>
                <p style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '6px' }}>
                  * Lampiran otomatis digabungkan ke halaman akhir dokumen PDF utama di Google Drive.
                </p>
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
        </div>,
        document.body
      )}

      {/* PDF Preview Modal */}
      {previewPdfUrl && createPortal(
        <div style={{
          position: 'fixed', 
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 10000, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', 
          animation: 'fadeIn 0.2s ease-out',
          padding: '24px'
        }} onClick={() => setPreviewPdfUrl(null)}>
          <div style={{ 
            margin: 'auto',
            width: '100%', 
            maxWidth: '850px', 
            height: '80vh', 
            background: '#fff', 
            borderRadius: '12px', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#323639', color: '#f1f1f1', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '4px', color: '#f1f1f1', opacity: 0.8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'sans-serif', letterSpacing: '0.3px', color: '#f1f1f1' }}>
                  {previewPdfUrl.title}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <a href={previewPdfUrl.download} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f1f1f1', textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px' }}>
                  <Download size={14} /> Download
                </a>
                <a href={previewPdfUrl.original} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f1f1f1', textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px' }}>
                  <ExternalLink size={14} /> Buka Asli
                </a>
                <button onClick={() => setPreviewPdfUrl(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f1f1f1', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>✕</span>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, padding: '0', display: 'flex', justifyContent: 'center', background: '#525659' }}>
              <iframe 
                src={previewPdfUrl.preview} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title="PDF Preview"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


