import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Users, 
  RefreshCw, 
  DollarSign, 
  LayoutDashboard, 
  LogOut, 
  User as UserIcon,
  Search,
  BookMarked,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout, simulatedRole, toggleSimulatedRole } = useAuth();

  if (!user) return null;

  const menuPustakawan = [
    { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'sirkulasi', label: 'Sirkulasi Peminjaman', icon: RefreshCw },
    { id: 'buku-terpinjam', label: 'Buku Terpinjam', icon: BookMarked },
    { id: 'master-buku', label: 'Master Buku & Stok', icon: BookOpen },
    { id: 'denda', label: 'Denda Keterlambatan', icon: DollarSign },
    { id: 'pengguna', label: 'Data Anggota', icon: Users },
  ];

  const menuAnggota = [
    { id: 'katalog', label: 'Katalog Buku', icon: Search },
    { id: 'pinjaman-saya', label: 'Pinjaman Saya', icon: BookMarked },
  ];

  const currentMenu = simulatedRole === 'pustakawan' ? menuPustakawan : menuAnggota;

  return (
    <div style={styles.sidebar} className="glass-panel">
      {/* Profil User */}
      <div style={styles.profileSection}>
        <div style={styles.avatar}>
          <UserIcon size={24} />
        </div>
        <div style={styles.profileDetails}>
          <h4 style={styles.userName}>{user.nama}</h4>
          <span style={styles.userEmail}>{user.email}</span>
          <div style={styles.badgeWrapper}>
            <span className={`badge ${user.tipeUser === 'tetap' ? 'badge-success' : 'badge-warning'}`}>
              Member {user.tipeUser === 'tetap' ? 'Tetap' : 'Guest'}
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Mode Switcher */}
      <div style={styles.simulatorSection} className="glass-panel">
        <div style={styles.simulatorHeader}>
          <Layers size={14} />
          <span style={styles.simulatorTitle}>Mode Simulasi Uji</span>
        </div>
        <div style={styles.roleText}>
          Role aktif: <strong>{simulatedRole === 'pustakawan' ? 'Pustakawan' : 'Anggota'}</strong>
        </div>
        <button onClick={toggleSimulatedRole} style={styles.switchBtn} className="btn btn-secondary">
          Tukar ke Mode {simulatedRole === 'pustakawan' ? 'Anggota' : 'Pustakawan'}
        </button>
      </div>

      {/* Menu List */}
      <nav style={styles.nav}>
        <div style={styles.menuLabel}>Navigasi Utama</div>
        <ul style={styles.menuList}>
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} style={styles.menuItem}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    ...styles.menuButton,
                    ...(isActive ? styles.menuButtonActive : {}),
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn} className="btn btn-danger">
          <LogOut size={16} />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    borderRadius: '0',
    borderLeft: 'none',
    borderTop: 'none',
    borderBottom: 'none',
    position: 'sticky',
    top: '0',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '20px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '0',
    background: '#ffffff',
    border: '1px solid #000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  userName: {
    fontSize: '15px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  badgeWrapper: {
    marginTop: '4px',
  },
  simulatorSection: {
    padding: '12px 14px',
    marginBottom: '25px',
    borderRadius: '0',
    background: '#ffffff',
    border: '1px solid #000000',
  },
  simulatorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  simulatorTitle: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#000000',
    letterSpacing: '0.05em',
  },
  roleText: {
    fontSize: '12px',
    color: 'var(--text-main)',
    marginBottom: '8px',
  },
  switchBtn: {
    width: '100%',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '6px',
  },
  nav: {
    flex: 1,
  },
  menuLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    marginBottom: '10px',
    paddingLeft: '12px',
  },
  menuList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  menuItem: {
    width: '100%',
  },
  menuButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'none',
    border: 'none',
    borderRadius: '0',
    color: '#000000',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition)',
  },
  menuButtonActive: {
    background: '#f2f2f2',
    border: '1px solid #000000',
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  },
  logoutBtn: {
    width: '100%',
  }
};
