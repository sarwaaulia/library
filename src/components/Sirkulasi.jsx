import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Calendar, User, BookOpen, Shield, ArrowRightLeft, FileText, CheckCircle, RefreshCw } from 'lucide-react';

export default function Sirkulasi() {
  const [subTab, setSubTab] = useState('pinjam'); // 'pinjam' or 'kembali'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown options
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);

  // Form Pinjam State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().slice(0, 10));
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [jenisJaminan, setJenisJaminan] = useState('ktp');
  const [detailJaminan, setDetailJaminan] = useState('');

  // Selected User Object (for Guest check)
  const [selectedUserObj, setSelectedUserObj] = useState(null);

  // Guest Walk-in / Tanpa Akun State
  const [borrowerType, setBorrowerType] = useState('registered'); // 'registered' or 'walkin'
  const [walkInNama, setWalkInNama] = useState('');
  const [walkInNoHp, setWalkInNoHp] = useState('');
  const [walkInJenisJaminan, setWalkInJenisJaminan] = useState('ktp');
  const [walkInDetailJaminan, setWalkInDetailJaminan] = useState('');

  // Form Kembali State (Drawer / Modal simulation)
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [tanggalKembali, setTanggalKembali] = useState(new Date().toISOString().slice(0, 10));
  const [dendaManual, setDendaManual] = useState('');

  // Load basic data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [uList, bList, lList] = await Promise.all([
        apiFetch('/pengguna'),
        apiFetch('/master-buku'),
        apiFetch('/peminjaman?status=dipinjam')
      ]);
      setUsers(uList);
      setBooks(bList);
      setActiveLoans(lList);
    } catch (err) {
      setError('Gagal memuat data sirkulasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle selected user change
  useEffect(() => {
    if (selectedUserId) {
      const found = users.find(u => u.id === parseInt(selectedUserId));
      setSelectedUserObj(found || null);
      if (found && found.tipeUser === 'tetap') {
        setJenisJaminan('none');
        setDetailJaminan('');
      } else {
        setJenisJaminan('ktp');
      }
    } else {
      setSelectedUserObj(null);
    }
  }, [selectedUserId, users]);

  // Handle borrow submit
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (borrowerType === 'walkin') {
      if (!walkInNama || !walkInNoHp || !selectedBookId || !walkInDetailJaminan) {
        setError('Harap isi Nama, No HP, Buku, dan Detail Jaminan.');
        setLoading(false);
        return;
      }
    } else {
      if (!selectedUserId || !selectedBookId) {
        setError('Harap pilih Anggota dan Buku terlebih dahulu.');
        setLoading(false);
        return;
      }
    }

    try {
      let targetUserId = null;

      if (borrowerType === 'walkin') {
        // Cari apakah user dengan noHp tersebut sudah terdaftar
        const existing = users.find(u => u.noHp === walkInNoHp);
        if (existing) {
          targetUserId = existing.id;
        } else {
          // Buat akun guest otomatis di latar belakang
          const regRes = await apiFetch('/auth/daftar', {
            method: 'POST',
            body: {
              nama: walkInNama,
              email: `guest_${walkInNoHp}@library.com`,
              password: 'guest123',
              noHp: walkInNoHp,
              alamat: 'Guest Walk-in (Tanpa Akun)',
              tipeUser: 'guest'
            }
          });
          targetUserId = regRes.idUser;
        }
      } else {
        targetUserId = parseInt(selectedUserId);
      }

      const payload = {
        idUser: targetUserId,
        idMasterBuku: parseInt(selectedBookId),
        tanggalPinjam,
        tanggalJatuhTempo,
      };

      if (borrowerType === 'walkin') {
        payload.jenisJaminan = walkInJenisJaminan;
        payload.detailJaminan = walkInDetailJaminan;
      } else if (selectedUserObj && selectedUserObj.tipeUser === 'guest') {
        payload.jenisJaminan = jenisJaminan;
        payload.detailJaminan = detailJaminan;
      }

      const res = await apiFetch('/peminjaman/pinjam', {
        method: 'POST',
        body: payload
      });

      setSuccess(`Peminjaman berhasil dicatat! ID Transaksi: ${res.idPeminjaman}. Jatuh tempo: ${res.tanggalJatuhTempo}`);
      
      // Reset form
      setSelectedUserId('');
      setSelectedBookId('');
      setDetailJaminan('');
      setWalkInNama('');
      setWalkInNoHp('');
      setWalkInDetailJaminan('');
      
      // Reload lists
      await loadData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat meminjam buku');
    } finally {
      setLoading(false);
    }
  };

  // Calculate simulated denda
  const calculateSimulatedDenda = () => {
    if (!selectedLoan) return { days: 0, amount: 0 };
    const returnDate = new Date(tanggalKembali);
    returnDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(selectedLoan.tanggalJatuhTempo);
    dueDate.setHours(0, 0, 0, 0);

    if (returnDate > dueDate) {
      const diff = Math.abs(returnDate - dueDate);
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return { days, amount: days * 2000 };
    }
    return { days: 0, amount: 0 };
  };

  // Handle return submit
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await apiFetch('/peminjaman/kembali', {
        method: 'POST',
        body: {
          idPeminjaman: selectedLoan.id,
          tanggalKembali,
          dendaManual: dendaManual !== '' ? parseFloat(dendaManual) : undefined
        }
      });

      let fineText = '';
      if (res.jumlahDenda > 0) {
        fineText = ` Terkena denda sebesar Rp ${res.jumlahDenda.toLocaleString('id-ID')} karena terlambat ${res.hariTerlambat} hari.`;
      }
      
      let guaranteeText = '';
      if (res.jaminanDikembalikan) {
        guaranteeText = ' Jaminan guest telah ditandai dikembalikan.';
      }

      setSuccess(`Buku berhasil dikembalikan!${fineText}${guaranteeText}`);
      setSelectedLoan(null);
      setDendaManual('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memproses pengembalian');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="animated-fade">
      <div style={styles.header}>
        <h2 style={styles.title}>Sirkulasi Perpustakaan</h2>
        <p style={styles.subtitle}>Kelola pencatatan peminjaman baru dan pengembalian buku di sini.</p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => { setSubTab('pinjam'); setError(''); setSuccess(''); }}
          style={{ ...styles.tabBtn, ...(subTab === 'pinjam' ? styles.tabBtnActive : {}) }}
        >
          <ArrowRightLeft size={16} /> Catat Peminjaman Baru
        </button>
        <button
          onClick={() => { setSubTab('kembali'); setError(''); setSuccess(''); }}
          style={{ ...styles.tabBtn, ...(subTab === 'kembali' ? styles.tabBtnActive : {}) }}
        >
          <CheckCircle size={16} /> Proses Pengembalian Buku ({activeLoans.length})
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Catat Peminjaman */}
      {subTab === 'pinjam' && (
        <div style={styles.formContainer} className="glass-panel">
          <h3 style={styles.sectionTitle}>Formulir Peminjaman Buku</h3>
          
          {/* Selector Tipe Peminjam */}
          <div style={styles.borrowerTypeSelector}>
            <button
              type="button"
              onClick={() => { setBorrowerType('registered'); setError(''); setSuccess(''); }}
              style={{ ...styles.typeBtn, ...(borrowerType === 'registered' ? styles.typeBtnActive : {}) }}
            >
              Anggota Terdaftar (Member/Guest)
            </button>
            <button
              type="button"
              onClick={() => { setBorrowerType('walkin'); setError(''); setSuccess(''); }}
              style={{ ...styles.typeBtn, ...(borrowerType === 'walkin' ? styles.typeBtnActive : {}) }}
            >
              Guest Walk-in (Tanpa Akun / Langsung KTP & No HP)
            </button>
          </div>

          <form onSubmit={handleBorrowSubmit}>
            <div style={styles.formGrid}>
              
              {/* Select User / Walkin Guest */}
              {borrowerType === 'registered' ? (
                <div className="form-group">
                  <label className="form-label">Nama Peminjam / Anggota</label>
                  <div style={styles.selectWrapper}>
                    <User size={16} style={styles.iconInside} />
                    <select
                      className="form-input"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                      style={{ paddingLeft: '40px' }}
                    >
                      <option value="">-- Pilih Anggota --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nama} ({u.email}) - {u.tipeUser === 'tetap' ? 'Member Tetap' : 'Guest'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Nama Guest Walk-in *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama Lengkap Guest"
                      value={walkInNama}
                      onChange={(e) => setWalkInNama(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor HP Guest *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 08123456789"
                      value={walkInNoHp}
                      onChange={(e) => setWalkInNoHp(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Select Book */}
              <div className="form-group">
                <label className="form-label">Judul Buku</label>
                <div style={styles.selectWrapper}>
                  <BookOpen size={16} style={styles.iconInside} />
                  <select
                    className="form-input"
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  >
                    <option value="">-- Pilih Buku --</option>
                    {books.map(b => {
                      const totalStock = b.stokBuku ? b.stokBuku.length : 0;
                      const availableStock = b.stokBuku ? b.stokBuku.filter(s => s.status === 'tersedia').length : 0;
                      return (
                        <option key={b.id} value={b.id} disabled={availableStock === 0}>
                          {b.judul} oleh {b.penulis} ({availableStock}/{totalStock} tersedia)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="form-group">
                <label className="form-label">Tanggal Pinjam</label>
                <div style={styles.selectWrapper}>
                  <Calendar size={16} style={styles.iconInside} />
                  <input
                    type="date"
                    className="form-input"
                    value={tanggalPinjam}
                    onChange={(e) => setTanggalPinjam(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Jatuh Tempo (Default 7 Hari)</label>
                <div style={styles.selectWrapper}>
                  <Calendar size={16} style={styles.iconInside} />
                  <input
                    type="date"
                    className="form-input"
                    value={tanggalJatuhTempo}
                    onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

            </div>

            {/* Dynamic Guarantee Panel for Guests */}
            {((selectedUserObj && selectedUserObj.tipeUser === 'guest') || borrowerType === 'walkin') && (
              <div style={styles.guaranteePanel} className="glass-panel animated-fade">
                <div style={styles.guaranteeHeader}>
                  <Shield size={18} />
                  <h4 style={{ fontSize: '15px' }}>Wajib Jaminan (Guest/Tamu)</h4>
                </div>
                <p style={styles.guaranteeText}>
                  Anggota Guest wajib meninggalkan jaminan fisik KTP atau deposit uang untuk melakukan peminjaman buku.
                </p>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Jenis Jaminan</label>
                    <select
                      className="form-input"
                      value={borrowerType === 'walkin' ? walkInJenisJaminan : jenisJaminan}
                      onChange={(e) => {
                        if (borrowerType === 'walkin') {
                          setWalkInJenisJaminan(e.target.value);
                        } else {
                          setJenisJaminan(e.target.value);
                        }
                      }}
                    >
                      <option value="ktp">Kartu Tanda Penduduk (KTP / ID Card)</option>
                      <option value="uang">Uang Tunai (Deposit)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {(borrowerType === 'walkin' ? walkInJenisJaminan === 'ktp' : jenisJaminan === 'ktp') 
                        ? 'Nomor KTP / Identitas Fisik' 
                        : 'Jumlah Nominal Uang Deposit (Rp)'}
                    </label>
                    <input
                      type={(borrowerType === 'walkin' ? walkInJenisJaminan === 'uang' : jenisJaminan === 'uang') ? 'number' : 'text'}
                      className="form-input"
                      placeholder={(borrowerType === 'walkin' ? walkInJenisJaminan === 'ktp' : jenisJaminan === 'ktp') ? 'Contoh: 3201234567890001' : 'Contoh: 50000'}
                      value={borrowerType === 'walkin' ? walkInDetailJaminan : detailJaminan}
                      onChange={(e) => {
                        if (borrowerType === 'walkin') {
                          setWalkInDetailJaminan(e.target.value);
                        } else {
                          setDetailJaminan(e.target.value);
                        }
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={styles.formFooter}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Transaksi Peminjaman'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pengembalian & List Peminjaman Aktif */}
      {subTab === 'kembali' && (
        <div>
          {/* Simulated Return Form (Drawer/Section) when a loan is selected */}
          {selectedLoan && (
            <div style={styles.drawerContainer} className="glass-panel animated-fade">
              <div style={styles.drawerHeader}>
                <h3>Proses Pengembalian Buku</h3>
                <button style={styles.closeBtn} onClick={() => setSelectedLoan(null)}>×</button>
              </div>

              <form onSubmit={handleReturnSubmit} style={{ marginTop: '15px' }}>
                <div style={styles.drawerDetails}>
                  <div style={styles.detailRow}>
                    <strong>Peminjam:</strong> <span>{selectedLoan.user.nama}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Judul Buku:</strong> <span>{selectedLoan.stokBuku.masterBuku.judul}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Kode Copy:</strong> <span>{selectedLoan.stokBuku.kodeInventaris}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Tgl Pinjam:</strong> <span>{new Date(selectedLoan.tanggalPinjam).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Jatuh Tempo:</strong> <span>{new Date(selectedLoan.tanggalJatuhTempo).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label">Simulasikan Tanggal Pengembalian</label>
                  <input
                    type="date"
                    className="form-input"
                    value={tanggalKembali}
                    onChange={(e) => setTanggalKembali(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Input Denda Manual / Kerusakan (Opsional, Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Kosongkan untuk kalkulasi otomatis"
                    value={dendaManual}
                    onChange={(e) => setDendaManual(e.target.value)}
                  />
                </div>

                {/* Simulated late fee output */}
                {(() => {
                  const { days, amount } = calculateSimulatedDenda();
                  return (
                    <div style={styles.simulatedResultPanel} className="glass-panel">
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status Keterlambatan:</div>
                      {dendaManual !== '' ? (
                        <div style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
                          Kustom Denda: {formatRupiah(parseFloat(dendaManual))}
                        </div>
                      ) : days > 0 ? (
                        <div style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
                          Terlambat {days} Hari ({formatRupiah(amount)})
                        </div>
                      ) : (
                        <div style={{ color: 'var(--success)', fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
                          Tepat Waktu (Denda Rp 0)
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        <em>Tarif denda default perpustakaan: Rp 2.000 / hari.</em>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Memproses...' : 'Proses Pengembalian'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedLoan(null)}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Loans Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '18px' }}>Buku yang Sedang Dipinjam</h3>
              <button style={styles.refreshBtn} onClick={loadData} className="btn btn-secondary">
                <RefreshCw size={14} /> Refresh Data
              </button>
            </div>

            {activeLoans.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
                Tidak ada peminjaman buku yang aktif saat ini.
              </p>
            ) : (
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Peminjam</th>
                      <th>Judul Buku</th>
                      <th>Kode Copy</th>
                      <th>Tgl Pinjam</th>
                      <th>Jatuh Tempo</th>
                      <th>Denda Berjalan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map(loan => {
                      // Calculate real-time estimated denda based on current local date
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const dueDate = new Date(loan.tanggalJatuhTempo);
                      dueDate.setHours(0,0,0,0);
                      
                      let fineStr = 'Rp 0';
                      let overdue = false;
                      
                      if (today > dueDate) {
                        const diff = Math.abs(today - dueDate);
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        fineStr = `Rp ${(days * 2000).toLocaleString('id-ID')}`;
                        overdue = true;
                      }

                      return (
                        <tr key={loan.id}>
                          <td>
                            <strong>{loan.user.nama}</strong><br/>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Member {loan.user.tipeUser === 'tetap' ? 'Tetap' : 'Guest'}
                            </span>
                          </td>
                          <td>{loan.stokBuku.masterBuku.judul}</td>
                          <td>
                            <code>{loan.stokBuku.kodeInventaris}</code>
                          </td>
                          <td>{new Date(loan.tanggalPinjam).toLocaleDateString('id-ID')}</td>
                          <td>
                            <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-main)', fontWeight: overdue ? '600' : 'normal' }}>
                              {new Date(loan.tanggalJatuhTempo).toLocaleDateString('id-ID')}
                            </span>
                          </td>
                          <td>
                            <span className={overdue ? 'badge badge-danger' : 'badge badge-success'}>
                              {fineStr}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setTanggalKembali(new Date().toISOString().slice(0, 10));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Kembalikan Buku
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-muted)',
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '25px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '15px',
    fontWeight: '600',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    transition: 'var(--transition)',
  },
  tabBtnActive: {
    background: 'rgba(168, 85, 247, 0.08)',
    color: 'var(--primary)',
  },
  formContainer: {
    padding: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  iconInside: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  guaranteePanel: {
    marginTop: '25px',
    padding: '20px',
    background: 'rgba(245, 158, 11, 0.03)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
  },
  guaranteeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  guaranteeText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '15px',
  },
  formFooter: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    padding: '24px',
    marginBottom: '30px',
    border: '1px solid var(--primary)',
    background: 'rgba(168, 85, 247, 0.03)',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  drawerDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '14px',
    marginTop: '15px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '15px',
    borderRadius: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    paddingBottom: '6px',
    paddingRight: '10px',
  },
  simulatedResultPanel: {
    marginTop: '15px',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  refreshBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  borrowerTypeSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    width: 'fit-content'
  },
  typeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  typeBtnActive: {
    background: 'rgba(168, 85, 247, 0.08)',
    color: 'var(--primary)',
  }
};
