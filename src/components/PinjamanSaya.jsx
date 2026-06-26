import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, AlertCircle, Bookmark, DollarSign, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

export default function PinjamanSaya() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadMyLoans();
    }
  }, [user]);

  async function loadMyLoans() {
    try {
      setLoading(true);
      setError('');
      // Filter by current logged in user ID
      const data = await apiFetch(`/peminjaman?idUser=${user.id}`);
      setLoans(data);
    } catch (err) {
      setError('Gagal memuat data peminjaman: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Separate active and returned
  const activeLoans = loans.filter(l => l.status === 'dipinjam');
  const historyLoans = loans.filter(l => l.status === 'dikembalikan');

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
        <h2 style={styles.title}>Pinjaman Saya</h2>
        <p style={styles.subtitle}>Pantau status peminjaman aktif Anda, tanggal jatuh tempo, dan riwayat pengembalian.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={loadMyLoans} className="btn btn-secondary" style={styles.refreshBtn}>
          <RefreshCw size={14} /> Refresh Status
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* SECTION 1: SEDANG DIPINJAM */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '35px' }}>
        <h3 style={styles.sectionTitle}>
          <Bookmark size={18} /> Buku yang Sedang Dipinjam ({activeLoans.length})
        </h3>
        
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Memuat data...</div>
        ) : activeLoans.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
            Anda tidak sedang meminjam buku apa pun saat ini.
          </p>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Judul Buku</th>
                  <th>Kode Copy</th>
                  <th>Tanggal Pinjam</th>
                  <th>Jatuh Tempo</th>
                  <th>Status / Denda Berjalan</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map(loan => {
                  // Calculate real-time estimated denda
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const dueDate = new Date(loan.tanggalJatuhTempo);
                  dueDate.setHours(0,0,0,0);
                  
                  let lateDays = 0;
                  let fineAmount = 0;
                  let isOverdue = false;

                  if (today > dueDate) {
                    const diff = Math.abs(today - dueDate);
                    lateDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    fineAmount = lateDays * 2000;
                    isOverdue = true;
                  }

                  return (
                    <tr key={loan.id}>
                      <td>
                        <strong>{loan.stokBuku.masterBuku.judul}</strong><br/>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          oleh {loan.stokBuku.masterBuku.penulis}
                        </span>
                      </td>
                      <td><code>{loan.stokBuku.kodeInventaris}</code></td>
                      <td>{new Date(loan.tanggalPinjam).toLocaleDateString('id-ID')}</td>
                      <td>
                        <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-main)', fontWeight: isOverdue ? '600' : 'normal' }}>
                          {new Date(loan.tanggalJatuhTempo).toLocaleDateString('id-ID')}
                        </span>
                      </td>
                      <td>
                        {isOverdue ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="badge badge-danger" style={{ alignSelf: 'flex-start' }}>
                              Terlambat {lateDays} Hari
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: '600' }}>
                              Denda Berjalan: {formatRupiah(fineAmount)}
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-success">
                            Sedang Dipinjam (Rp 0)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: RIWAYAT PENGEMBALIAN */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={styles.sectionTitle}>
          <CheckCircle2 size={18} /> Riwayat Pengembalian Buku ({historyLoans.length})
        </h3>
        
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Memuat data...</div>
        ) : historyLoans.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
            Belum ada riwayat pengembalian buku sebelumnya.
          </p>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Judul Buku</th>
                  <th>Kode Copy</th>
                  <th>Tanggal Pinjam</th>
                  <th>Jatuh Tempo</th>
                  <th>Tanggal Kembali</th>
                  <th>Denda Terbayar</th>
                </tr>
              </thead>
              <tbody>
                {historyLoans.map(loan => {
                  const hasFine = loan.denda && parseFloat(loan.denda.totalDenda) > 0;
                  const isPaid = loan.denda && loan.denda.statusBayar === 'lunas';

                  return (
                    <tr key={loan.id}>
                      <td>
                        <strong>{loan.stokBuku.masterBuku.judul}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          oleh {loan.stokBuku.masterBuku.penulis}
                        </span>
                      </td>
                      <td><code>{loan.stokBuku.kodeInventaris}</code></td>
                      <td>{new Date(loan.tanggalPinjam).toLocaleDateString('id-ID')}</td>
                      <td>{new Date(loan.tanggalJatuhTempo).toLocaleDateString('id-ID')}</td>
                      <td>{new Date(loan.tanggalKembali).toLocaleDateString('id-ID')}</td>
                      <td>
                        {hasFine ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontWeight: '600', color: isPaid ? 'var(--success)' : 'var(--danger)' }}>
                              {formatRupiah(parseFloat(loan.denda.totalDenda))}
                            </span>
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'flex-start', fontSize: '10px' }}>
                              {isPaid ? 'Lunas' : 'Belum Bayar'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Rp 0 (Tepat Waktu)</span>
                        )}
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
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  refreshBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }
};
