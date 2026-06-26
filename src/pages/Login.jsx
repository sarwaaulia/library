import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, LogIn, UserPlus, Shield } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tipeUser, setTipeUser] = useState('tetap');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          nama,
          email,
          password,
          noHp,
          alamat,
          tipeUser,
        });
        // Success register -> auto login or toggle to login page
        setIsRegister(false);
        setError('Registrasi berhasil! Silakan masuk dengan akun Anda.');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-panel animated-fade">
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Shield size={32} />
          </div>
          <h2 style={styles.title}>
            E-Library <span className="gradient-text">Sarwa Aulia</span>
          </h2>
          <p style={styles.subtitle}>
            {isRegister ? 'Daftar akun anggota baru perpustakaan' : 'Masuk untuk mengelola dan meminjam buku'}
          </p>
        </div>

        {error && (
          <div className={error.includes('berhasil') ? 'alert alert-success' : 'alert alert-danger'}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Lengkap"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>


              <div className="form-group">
                <label className="form-label">Nomor WhatsApp / HP</label>
                <div style={styles.inputWrapper}>
                  <Phone size={18} style={styles.inputIcon} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Contoh: 0812345678"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Rumah</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Alamat Lengkap"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                className="form-input"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi (Password)</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              'Memproses...'
            ) : isRegister ? (
              <>
                <UserPlus size={18} /> Daftar Sekarang
              </>
            ) : (
              <>
                <LogIn size={18} /> Masuk Akun
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <button
            style={styles.toggleBtn}
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar anggota baru'}
          </button>
        </div>

        {!isRegister && (
          <div style={styles.demoAccounts} className="glass-panel">
            <h4 style={styles.demoTitle}>Akun Simulasi Cepat:</h4>
            <div style={styles.demoGrid}>
              <div style={styles.demoItem} onClick={() => { setEmail('admin@library.com'); setPassword('admin123'); }}>
                <strong>Pustakawan</strong><br/>admin@library.com (admin123)
              </div>
              <div style={styles.demoItem} onClick={() => { setEmail('budi@example.com'); setPassword('user123'); }}>
                <strong>Member</strong><br/>budi@example.com (user123)
              </div>
            </div>
            <div style={styles.demoInfo}>
              <em>Catatan: Masuk sebagai Pustakawan untuk mengelola peminjaman dan denda.</em>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px 30px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px',
  },
  logoContainer: {
    display: 'inline-flex',
    padding: '12px',
    borderRadius: '0',
    background: '#ffffff',
    marginBottom: '15px',
    border: '1px solid #000000',
  },
  title: {
    fontSize: '26px',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  form: {
    marginTop: '10px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '48px',
  },
  submitBtn: {
    width: '100%',
    marginTop: '10px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'underline',
  },
  demoAccounts: {
    marginTop: '25px',
    padding: '15px',
    borderRadius: '12px',
  },
  demoTitle: {
    fontSize: '13px',
    color: 'var(--text-main)',
    marginBottom: '8px',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  demoItem: {
    fontSize: '11px',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition)',
  },
  demoInfo: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '8px',
    textAlign: 'center',
  }
};