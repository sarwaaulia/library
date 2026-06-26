import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Search, BookOpen, Filter, Check, X } from 'lucide-react';

export default function KatalogBuku() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadCatalog();
  }, [search, selectedCategory]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cList = await apiFetch('/master-buku/categories/all');
        setCategories(cList);
      } catch (err) {
        console.error('Gagal mengambil kategori:', err);
      }
    }
    loadCategories();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      setError('');
      let path = '/master-buku';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (selectedCategory) params.push(`idKategori=${selectedCategory}`);
      
      if (params.length > 0) {
        path += `?${params.join('&')}`;
      }

      const data = await apiFetch(path);
      setBooks(data);
    } catch (err) {
      setError('Gagal memuat katalog buku: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animated-fade">
      <div style={styles.header}>
        <h2 style={styles.title}>Katalog Perpustakaan</h2>
        <p style={styles.subtitle}>Cari buku referensi, novel, sains, dan cek ketersediaan stok fisiknya.</p>
      </div>

      {/* Search and Filters Bar */}
      <div style={styles.filtersBar} className="glass-panel">
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            className="form-input"
            placeholder="Cari judul buku, penulis, atau ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
        </div>
        
        <div style={styles.filterWrapper}>
          <Filter size={18} style={styles.filterIcon} />
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ paddingLeft: '44px', cursor: 'pointer', width: '200px' }}
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.namaKategori}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Grid of Books */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Memuat katalog...</div>
      ) : books.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '50px' }} className="glass-panel">
          Buku yang Anda cari tidak ditemukan. Coba kata kunci lain.
        </p>
      ) : (
        <div style={styles.grid}>
          {books.map(book => {
            const totalStock = book.stokBuku ? book.stokBuku.length : 0;
            const availableStock = book.stokBuku ? book.stokBuku.filter(s => s.status === 'tersedia').length : 0;
            const isAvailable = availableStock > 0;

            return (
              <div key={book.id} className="glass-panel glass-panel-hover" style={styles.card}>
                <div style={styles.cardCoverSection}>
                  {book.gambarCover ? (
                    <img src={book.gambarCover} alt={book.judul} style={styles.cardCover} />
                  ) : (
                    <div style={styles.coverPlaceholder}><BookOpen size={48} /></div>
                  )}
                  <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`} style={styles.stockBadge}>
                    {isAvailable ? <Check size={12} style={{ marginRight: '4px' }} /> : <X size={12} style={{ marginRight: '4px' }} />}
                    {isAvailable ? `${availableStock} Tersedia` : 'Habis'}
                  </span>
                </div>
                
                <div style={styles.cardDetails}>
                  {book.kategori && (
                    <span style={styles.categoryTag}>{book.kategori.namaKategori}</span>
                  )}
                  <h3 style={styles.bookTitle} title={book.judul}>{book.judul}</h3>
                  <div style={styles.bookAuthor}>Penulis: {book.penulis}</div>
                  <div style={styles.bookMeta}>Penerbit: {book.penerbit || '-'}</div>
                  <div style={styles.bookMeta}>ISBN: {book.isbn || '-'}</div>
                  
                  {book.deskripsi && (
                    <p style={styles.bookDesc} title={book.deskripsi}>{book.deskripsi}</p>
                  )}
                </div>
              </div>
            );
          })}
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
  filtersBar: {
    display: 'flex',
    gap: '15px',
    padding: '16px',
    marginBottom: '30px',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  filterWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  filterIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cardCoverSection: {
    position: 'relative',
    width: '100%',
    height: '240px',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  cardCover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
  },
  stockBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  categoryTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  bookTitle: {
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.4',
    marginBottom: '6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bookAuthor: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  bookMeta: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  },
  bookDesc: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '12px',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    paddingTop: '8px',
  }
};
