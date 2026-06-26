import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { BookOpen, Tag, Box, Trash2, Edit3, Plus, RefreshCw, AlertCircle } from 'lucide-react';

export default function MasterData() {
  const [subTab, setSubTab] = useState('buku'); // 'buku', 'kategori', 'stok'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Loaded Lists
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // Forms Toggle
  const [showBookForm, setShowBookForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);

  // 1. Book Form State
  const [judul, setJudul] = useState('');
  const [penulis, setPenulis] = useState('');
  const [penerbit, setPenerbit] = useState('');
  const [isbn, setIsbn] = useState('');
  const [idKategori, setIdKategori] = useState('');
  const [tahunTerbit, setTahunTerbit] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [gambarCover, setGambarCover] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);

  // 2. Category Form State
  const [namaKategori, setNamaKategori] = useState('');

  // 3. Stock Form State
  const [selectedMasterBookId, setSelectedMasterBookId] = useState('');
  const [kodeInventaris, setKodeInventaris] = useState('');
  const [kondisi, setKondisi] = useState('Baru');
  const [statusCopy, setStatusCopy] = useState('tersedia');

  useEffect(() => {
    loadAllData();
  }, [subTab]);

  async function loadAllData() {
    try {
      setLoading(true);
      setError('');
      if (subTab === 'buku') {
        const [bList, cList] = await Promise.all([
          apiFetch('/master-buku'),
          apiFetch('/master-buku/categories/all')
        ]);
        setBooks(bList);
        setCategories(cList);
      } else if (subTab === 'kategori') {
        const cList = await apiFetch('/master-buku/categories/all');
        setCategories(cList);
      } else if (subTab === 'stok') {
        const [sList, bList] = await Promise.all([
          apiFetch('/stok-buku'),
          apiFetch('/master-buku')
        ]);
        setStockItems(sList);
        setBooks(bList);
      }
    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- CRUD MASTER BUKU ---
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        judul,
        penulis,
        penerbit,
        isbn,
        idKategori: idKategori ? parseInt(idKategori) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit) : null,
        deskripsi,
        gambarCover
      };

      if (editingBookId) {
        await apiFetch(`/master-buku/${editingBookId}`, {
          method: 'PUT',
          body: payload
        });
        setSuccess('Buku master berhasil diperbarui.');
      } else {
        await apiFetch('/master-buku', {
          method: 'POST',
          body: payload
        });
        setSuccess('Buku master baru berhasil ditambahkan.');
      }

      // Reset
      setJudul('');
      setPenulis('');
      setPenerbit('');
      setIsbn('');
      setIdKategori('');
      setTahunTerbit('');
      setDeskripsi('');
      setGambarCover('');
      setEditingBookId(null);
      setShowBookForm(false);
      
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan buku');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (book) => {
    setEditingBookId(book.id);
    setJudul(book.judul);
    setPenulis(book.penulis);
    setPenerbit(book.penerbit || '');
    setIsbn(book.isbn || '');
    setIdKategori(book.idKategori || '');
    setTahunTerbit(book.tahunTerbit || '');
    setDeskripsi(book.deskripsi || '');
    setGambarCover(book.gambarCover || '');
    setShowBookForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus buku master ini? Seluruh data unit copy fisik juga akan dihapus.')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/master-buku/${id}`, { method: 'DELETE' });
      setSuccess('Buku master berhasil dihapus.');
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus buku');
    }
  };

  // --- CRUD KATEGORI ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiFetch('/master-buku/categories', {
        method: 'POST',
        body: { namaKategori }
      });
      setSuccess('Kategori baru berhasil ditambahkan.');
      setNamaKategori('');
      setShowCategoryForm(false);
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Hapus kategori ini?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/master-buku/categories/${id}`, { method: 'DELETE' });
      setSuccess('Kategori berhasil dihapus.');
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus kategori. Pastikan tidak ada buku dalam kategori ini.');
    }
  };

  // --- CRUD STOK FISIK ---
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiFetch('/stok-buku', {
        method: 'POST',
        body: {
          idMasterBuku: parseInt(selectedMasterBookId),
          kodeInventaris,
          kondisi,
          status: statusCopy
        }
      });
      setSuccess('Unit copy buku fisik berhasil didaftarkan.');
      setSelectedMasterBookId('');
      setKodeInventaris('');
      setKondisi('Baru');
      setStatusCopy('tersedia');
      setShowStockForm(false);
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan stok copy');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm('Hapus unit copy buku fisik ini?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/stok-buku/${id}`, { method: 'DELETE' });
      setSuccess('Unit copy buku fisik berhasil dihapus.');
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus unit copy');
    }
  };

  const handleUpdateStockStatus = async (id, currentItem, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/stok-buku/${id}`, {
        method: 'PUT',
        body: {
          status: newStatus
        }
      });
      setSuccess('Status copy buku diperbarui.');
      await loadAllData();
    } catch (err) {
      setError(err.message || 'Gagal memperbarui status');
    }
  };

  return (
    <div className="animated-fade">
      <div style={styles.header}>
        <h2 style={styles.title}>Data Master & Inventaris</h2>
        <p style={styles.subtitle}>Kelola master buku, kategori, dan detail stok unit copy fisik.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => { setSubTab('buku'); setError(''); setSuccess(''); setShowBookForm(false); }}
          style={{ ...styles.tabBtn, ...(subTab === 'buku' ? styles.tabBtnActive : {}) }}
        >
          <BookOpen size={16} /> Buku Master ({books.length})
        </button>
        <button
          onClick={() => { setSubTab('kategori'); setError(''); setSuccess(''); setShowCategoryForm(false); }}
          style={{ ...styles.tabBtn, ...(subTab === 'kategori' ? styles.tabBtnActive : {}) }}
        >
          <Tag size={16} /> Kategori Buku ({categories.length})
        </button>
        <button
          onClick={() => { setSubTab('stok'); setError(''); setSuccess(''); setShowStockForm(false); }}
          style={{ ...styles.tabBtn, ...(subTab === 'stok' ? styles.tabBtnActive : {}) }}
        >
          <Box size={16} /> Copy Buku Fisik ({stockItems.length})
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* SUB TAB: MASTER BUKU */}
      {subTab === 'buku' && (
        <div>
          <div style={styles.actionRow}>
            <button
              onClick={() => { setShowBookForm(!showBookForm); setEditingBookId(null); }}
              className="btn btn-primary"
            >
              <Plus size={16} /> {showBookForm ? 'Tutup Form' : 'Tambah Buku Master'}
            </button>
          </div>

          {showBookForm && (
            <div className="glass-panel animated-fade" style={styles.formPanel}>
              <h3 style={{ marginBottom: '20px' }}>
                {editingBookId ? 'Edit Buku Master' : 'Tambah Buku Master Baru'}
              </h3>
              <form onSubmit={handleBookSubmit}>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Judul Buku *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Penulis *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={penulis}
                      onChange={(e) => setPenulis(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Penerbit</label>
                    <input
                      type="text"
                      className="form-input"
                      value={penerbit}
                      onChange={(e) => setPenerbit(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ISBN</label>
                    <input
                      type="text"
                      className="form-input"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-input"
                      value={idKategori}
                      onChange={(e) => setIdKategori(e.target.value)}
                    >
                      <option value="">-- Tanpa Kategori --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.namaKategori}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tahun Terbit</label>
                    <input
                      type="number"
                      className="form-input"
                      value={tahunTerbit}
                      onChange={(e) => setTahunTerbit(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">URL Cover Gambar</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://images.com/cover.jpg"
                      value={gambarCover}
                      onChange={(e) => setGambarCover(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Deskripsi Singkat</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary">
                    {editingBookId ? 'Simpan Perubahan' : 'Simpan Buku Master'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowBookForm(false);
                      setEditingBookId(null);
                    }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Daftar Buku Master</h3>
            {books.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                Belum ada buku master yang terdaftar.
              </p>
            ) : (
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Buku / Judul</th>
                      <th>Penerbit / ISBN</th>
                      <th>Kategori</th>
                      <th>Stok Tersedia</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map(b => {
                      const totalCopies = b.stokBuku ? b.stokBuku.length : 0;
                      const availCopies = b.stokBuku ? b.stokBuku.filter(s => s.status === 'tersedia').length : 0;
                      return (
                        <tr key={b.id}>
                          <td>
                            {b.gambarCover ? (
                              <img src={b.gambarCover} alt={b.judul} style={styles.coverThumb} />
                            ) : (
                              <div style={styles.coverPlaceholder}><BookOpen size={16} /></div>
                            )}
                          </td>
                          <td>
                            <strong>{b.judul}</strong><br/>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>oleh {b.penulis}</span>
                          </td>
                          <td>
                            {b.penerbit || '-'}<br/>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ISBN: {b.isbn || '-'}</span>
                          </td>
                          <td>{b.kategori ? b.kategori.namaKategori : <em style={{ color: 'var(--text-muted)' }}>tidak ada</em>}</td>
                          <td>
                            <span className={availCopies > 0 ? 'badge badge-success' : 'badge badge-danger'}>
                              {availCopies} / {totalCopies} Copy
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleEditBook(b)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(b.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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

      {/* SUB TAB: KATEGORI */}
      {subTab === 'kategori' && (
        <div style={styles.categoriesSplit}>
          {/* Add Category Form */}
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Tambah Kategori Baru</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Novel / Teknologi"
                  value={namaKategori}
                  onChange={(e) => setNamaKategori(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} /> Simpan Kategori
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Daftar Kategori</h3>
            {categories.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Belum ada kategori.</p>
            ) : (
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Nama Kategori</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.namaKategori}</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                          >
                            <Trash2 size={13} /> Hapus
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
      )}

      {/* SUB TAB: COPIES FISIK */}
      {subTab === 'stok' && (
        <div>
          <div style={styles.actionRow}>
            <button onClick={() => setShowStockForm(!showStockForm)} className="btn btn-primary">
              <Plus size={16} /> {showStockForm ? 'Tutup Form' : 'Daftarkan Copy Fisik Baru'}
            </button>
          </div>

          {showStockForm && (
            <div className="glass-panel animated-fade" style={styles.formPanel}>
              <h3 style={{ marginBottom: '20px' }}>Registrasi Unit Copy Buku Fisik</h3>
              <form onSubmit={handleStockSubmit}>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Pilih Buku Master *</label>
                    <select
                      className="form-input"
                      value={selectedMasterBookId}
                      onChange={(e) => setSelectedMasterBookId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Buku Master --</option>
                      {books.map(b => (
                        <option key={b.id} value={b.id}>{b.judul} ({b.penulis})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kode Inventaris / Barcode Unik *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: INV-LP-003"
                      value={kodeInventaris}
                      onChange={(e) => setKodeInventaris(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kondisi Buku</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Baru / Bagus / Rusak Ringan"
                      value={kondisi}
                      onChange={(e) => setKondisi(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Ketersediaan</label>
                    <select
                      className="form-input"
                      value={statusCopy}
                      onChange={(e) => setStatusCopy(e.target.value)}
                    >
                      <option value="tersedia">Tersedia</option>
                      <option value="rusak">Rusak</option>
                      <option value="hilang">Hilang</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary">Simpan Unit Copy</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStockForm(false)}>Batal</button>
                </div>
              </form>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Daftar Copy Buku Fisik (Unit Inventaris)</h3>
            {stockItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                Belum ada copy buku fisik terdaftar.
              </p>
            ) : (
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Kode Inventaris</th>
                      <th>Buku Master</th>
                      <th>Kondisi</th>
                      <th>Status Copy</th>
                      <th>Ubah Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map(item => (
                      <tr key={item.id}>
                        <td><code>{item.kodeInventaris}</code></td>
                        <td>
                          <strong>{item.masterBuku.judul}</strong><br/>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>oleh {item.masterBuku.penulis}</span>
                        </td>
                        <td>{item.kondisi || '-'}</td>
                        <td>
                          <span className={`badge ${
                            item.status === 'tersedia' ? 'badge-success' :
                            item.status === 'dipinjam' ? 'badge-info' : 'badge-danger'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStockStatus(item.id, item, e.target.value)}
                            disabled={item.status === 'dipinjam'}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px', width: '130px' }}
                          >
                            <option value="tersedia">Tersedia</option>
                            <option value="rusak">Rusak</option>
                            <option value="hilang">Hilang</option>
                            <option value="dipinjam" disabled>Dipinjam</option>
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteStock(item.id)}
                            disabled={item.status === 'dipinjam'}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title={item.status === 'dipinjam' ? 'Tidak bisa dihapus karena sedang dipinjam' : 'Hapus copy'}
                          >
                            <Trash2 size={13} />
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
  actionRow: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  formPanel: {
    padding: '24px',
    marginBottom: '35px',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  coverThumb: {
    width: '45px',
    height: '65px',
    borderRadius: '6px',
    objectFit: 'cover',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
  },
  coverPlaceholder: {
    width: '45px',
    height: '65px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
  },
  categoriesSplit: {
    display: 'flex',
    gap: '30px',
    alignItems: 'flex-start',
  }
};
