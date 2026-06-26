import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Book, Users, RefreshCw, DollarSign } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalBuku: 0,
    totalAnggota: 0,
    pinjamAktif: 0,
    totalDenda: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [books, users, loans, fines] = await Promise.all([
          apiFetch('/master-buku'),
          apiFetch('/pengguna'),
          apiFetch('/peminjaman'),
          apiFetch('/denda')
        ]);

        const activeLoans = loans.filter(l => l.status === 'dipinjam').length;
        const unpaidFines = fines
          .filter(f => f.statusBayar === 'belum')
          .reduce((sum, f) => sum + parseFloat(f.totalDenda), 0);

        setStats({
          totalBuku: books.length,
          totalAnggota: users.length,
          pinjamAktif: activeLoans,
          totalDenda: unpaidFines
        });
      } catch (err) {
        console.error('Gagal mengambil data statistik:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Memuat ringkasan data...</div>;
  }

  const cardData = [
    { label: 'Total Judul Buku', value: stats.totalBuku, icon: Book },
    { label: 'Total Anggota', value: stats.totalAnggota, icon: Users },
    { label: 'Peminjaman Aktif', value: stats.pinjamAktif, icon: RefreshCw },
    { label: 'Denda Tertunggak', value: formatRupiah(stats.totalDenda), icon: DollarSign }
  ];

  return (
    <div className="animated-fade">
      <div style={styles.header}>
        <h2 style={styles.title}>Selamat Datang Pustakawan</h2>
        <p style={styles.subtitle}>Berikut ringkasan status operasional perpustakaan Anda saat ini.</p>
      </div>

      <div style={styles.grid}>
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel" style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>{card.label}</span>
                <div style={styles.iconWrapper}>
                  <Icon size={20} />
                </div>
              </div>
              <div style={styles.cardValue}>{card.value}</div>
            </div>
          );
        })}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  card: {
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  cardLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  iconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '0',
    border: '1px solid #000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
  },
  quickStartCard: {
    padding: '30px',
    marginTop: '20px',
  },
  stepList: {
    paddingLeft: '20px',
    fontSize: '14px',
    lineHeight: '2',
    color: 'var(--text-main)',
  }
};
