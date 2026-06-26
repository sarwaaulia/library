import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { DollarSign, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DendaList() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua'); // 'semua', 'belum', 'lunas'

  // Manual input states
  const [activeLoans, setActiveLoans] = useState([]);
  const [showInputForm, setShowInputForm] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [totalDendaInput, setTotalDendaInput] = useState('');
  const [hariTerlambatInput, setHariTerlambatInput] = useState('');

  useEffect(() => {
    loadFines();
    loadActiveLoans();
  }, [statusFilter]);

  async function loadActiveLoans() {
    try {
      const data = await apiFetch('/peminjaman?status=dipinjam');
      setActiveLoans(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadFines() {
    try {
      setLoading(true);
      setError('');
      let path = '/denda';
      if (statusFilter !== 'semua') {
        path += `?statusBayar=${statusFilter}`;
      }
      const data = await apiFetch(path);
      setFines(data);
    } catch (err) {
      setError('Gagal memuat data denda: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handlePayFine = async (idDenda) => {
    if (!window.confirm('Simulasikan pembayaran denda ini hingga lunas?')) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiFetch('/denda/bayar', {
        method: 'POST',
        body: { idDenda }
      });
      setSuccess('Denda berhasil dibayar dan dilunasi!');
      await loadFines();
    } catch (err) {
      setError(err.message || 'Gagal melunasi denda');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFineSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoanId || !totalDendaInput) {
      setError('Harap pilih Transaksi Peminjaman dan masukkan jumlah denda.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiFetch('/denda', {
        method: 'POST',
        body: {
          idPeminjaman: parseInt(selectedLoanId),
          totalDenda: parseFloat(totalDendaInput),
          hariTerlambat: parseInt(hariTerlambatInput) || 0
        }
      });
      setSuccess('Denda manual berhasil dicatat.');
      setSelectedLoanId('');
      setTotalDendaInput('');
      setHariTerlambatInput('');
      setShowInputForm(false);
      await loadFines();
    } catch (err) {
      setError(err.message || 'Gagal mencatat denda');
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
        <h2 style={styles.title}>Denda Keterlambatan</h2>
        <p style={styles.subtitle}>Pantau status denda anggota dan simulasikan pembayaran kasir.</p>
      </div>

      {/* Filter and Actions Row */}
      <div style={styles.filterRow}>
        <div style={styles.filterBtns}>
          <button
            onClick={() => setStatusFilter('semua')}
            style={{ ...styles.filterBtn, ...(statusFilter === 'semua' ? styles.filterBtnActive : {}) }}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('belum')}
            style={{ ...styles.filterBtn, ...(statusFilter === 'belum' ? styles.filterBtnActive : {}) }}
          >
            Belum Lunas
          </button>
          <button
            onClick={() => setStatusFilter('lunas')}
            style={{ ...styles.filterBtn, ...(statusFilter === 'lunas' ? styles.filterBtnActive : {}) }}
          >
            Sudah Lunas
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowInputForm(!showInputForm)} className="btn btn-primary">
            {showInputForm ? 'Tutup Form' : 'Input Denda Manual'}
          </button>
          <button onClick={loadFines} className="btn btn-secondary" style={styles.refreshBtn}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showInputForm && (
        <div className="glass-panel animated-fade" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3>Input Denda Manual / Kustom</h3>
          <form onSubmit={handleCreateFineSubmit} style={{ border: 'none', padding: '0', marginTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">Pilih Transaksi Peminjaman Aktif</label>
                <select
                  className="form-input"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Transaksi --</option>
                  {activeLoans.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      ID: {loan.id} | {loan.user.nama} - {loan.stokBuku.masterBuku.judul}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nominal Denda (Rp)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Contoh: 15000"
                  value={totalDendaInput}
                  onChange={(e) => setTotalDendaInput(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Hari Telat (Opsional)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Contoh: 3"
                  value={hariTerlambatInput}
                  onChange={(e) => setHariTerlambatInput(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Simpan Catatan Denda</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowInputForm(false)}>Batal</button>
          </form>
        </div>
      )}



      {/* Table List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {fines.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
            Tidak ada catatan denda yang sesuai filter.
          </p>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Peminjam</th>
                  <th>Buku</th>
                  <th>Keterlambatan</th>
                  <th>Jumlah Denda</th>
                  <th>Status Bayar</th>
                  <th>Aksi / Info</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((fine, idx) => {
                  const isPaid = fine.statusBayar === 'lunas';
                  return (
                    <tr key={fine.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{fine.peminjaman.user.nama}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {fine.peminjaman.user.email}
                        </span>
                      </td>
                      <td>
                        <strong>{fine.peminjaman.stokBuku.masterBuku.judul}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Copy: {fine.peminjaman.stokBuku.kodeInventaris}
                        </span>
                      </td>
                      <td>{fine.hariTerlambat} Hari</td>
                      <td>
                        <strong style={{ color: isPaid ? 'var(--text-main)' : 'var(--danger)' }}>
                          {formatRupiah(fine.totalDenda)}
                        </strong>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Tarif: {formatRupiah(fine.tarifPerHari)} / hari
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {isPaid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {isPaid ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td>
                        {isPaid ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Lunas pada:<br/>
                            {new Date(fine.tanggalBayar).toLocaleDateString('id-ID')}
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePayFine(fine.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--secondary-glow)', boxShadow: 'none' }}
                          >
                            <DollarSign size={14} /> Bayar Lunas
                          </button>
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
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  filterBtns: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
  },
  filterBtn: {
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
  filterBtnActive: {
    background: 'rgba(168, 85, 247, 0.08)',
    color: 'var(--primary)',
  },
  refreshBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }
};
