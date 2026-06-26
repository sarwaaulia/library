import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { RefreshCw, UserCheck, UserX } from 'lucide-react';

export default function DataAnggota() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/pengguna');
      setUsers(data);
    } catch (err) {
      setError('Gagal memuat data anggota: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';
    if (!window.confirm(`Ubah status anggota ini menjadi ${newStatus}?`)) return;
    
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/pengguna/${id}`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      setSuccess('Status anggota berhasil diperbarui.');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Gagal mengubah status anggota');
    }
  };

  return (
    <div className="animated-fade">
      <div style={styles.header}>
        <h2 style={styles.title}>Data Anggota Perpustakaan</h2>
        <p style={styles.subtitle}>Lihat daftar semua anggota tetap dan guest, serta kelola status keaktifan mereka.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
          <button onClick={loadUsers} className="btn btn-secondary" style={styles.refreshBtn}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Memuat data anggota...</div>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Belum ada anggota terdaftar.</p>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Lengkap</th>
                  <th>Kontak / Email</th>
                  <th>Alamat</th>
                  <th>Tipe Member</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.nama}</strong></td>
                    <td>
                      {u.email}<br/>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HP: {u.noHp || '-'}</span>
                    </td>
                    <td>{u.alamat || '-'}</td>
                    <td>
                      <span className={`badge ${u.tipeUser === 'tetap' ? 'badge-success' : 'badge-warning'}`}>
                        {u.tipeUser === 'tetap' ? 'Member Tetap' : 'Guest'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className="btn btn-secondary"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {u.status === 'aktif' ? (
                          <>
                            <UserX size={12} /> Nonaktifkan
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} /> Aktifkan
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
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
