import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { RefreshCw } from 'lucide-react';

export default function BukuTerpinjam() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBorrowedBooks();
  }, []);

  async function loadBorrowedBooks() {
    try {
      setLoading(true);
      setError('');
      // Fetch currently active loans (status: 'dipinjam')
      const data = await apiFetch('/peminjaman?status=dipinjam');
      setLoans(data);
    } catch (err) {
      setError('Gagal memuat daftar buku terpinjam: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

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
        <h2 style={styles.title}>Daftar Buku Terpinjam</h2>
        <p style={styles.subtitle}>Pantau seluruh unit copy buku perpustakaan yang saat ini sedang dibawa oleh anggota.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '16px', margin: '0' }}>Daftar Peminjaman Aktif ({loans.length})</h3>
          <button onClick={loadBorrowedBooks} className="btn btn-secondary" style={styles.refreshBtn}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Memuat data...</div>
        ) : loans.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Tidak ada buku yang sedang dipinjam saat ini.
          </p>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Peminjam</th>
                  <th>Judul Buku</th>
                  <th>Kode Copy</th>
                  <th>Tanggal Pinjam</th>
                  <th>Jatuh Tempo</th>
                  <th>Status / Denda</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, idx) => {
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
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{loan.user.nama}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {loan.user.email} ({loan.user.tipeUser === 'tetap' ? 'Member' : 'Guest'})
                        </span>
                      </td>
                      <td><strong>{loan.stokBuku.masterBuku.judul}</strong></td>
                      <td><code>{loan.stokBuku.kodeInventaris}</code></td>
                      <td>{new Date(loan.tanggalPinjam).toLocaleDateString('id-ID')}</td>
                      <td>{new Date(loan.tanggalJatuhTempo).toLocaleDateString('id-ID')}</td>
                      <td>
                        {isOverdue ? (
                          <span className="badge badge-danger">
                            Terlambat {lateDays} Hari ({formatRupiah(fineAmount)})
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            Sedang Dipinjam
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
  refreshBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }
};
