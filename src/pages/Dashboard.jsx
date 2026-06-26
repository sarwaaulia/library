import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AdminOverview from '../components/AdminOverview';
import Sirkulasi from '../components/Sirkulasi';
import MasterData from '../components/MasterData';
import DendaList from '../components/DendaList';
import DataAnggota from '../components/DataAnggota';
import KatalogBuku from '../components/KatalogBuku';
import PinjamanSaya from '../components/PinjamanSaya';
import BukuTerpinjam from '../components/BukuTerpinjam';

export default function Dashboard() {
  const { user, simulatedRole } = useAuth();
  const [activeTab, setActiveTab] = useState('ringkasan');

  // Sync activeTab when role changes in simulator
  useEffect(() => {
    if (simulatedRole === 'pustakawan') {
      setActiveTab('ringkasan');
    } else {
      setActiveTab('katalog');
    }
  }, [simulatedRole]);

  // Render the selected tab component
  const renderContent = () => {
    if (simulatedRole === 'pustakawan') {
      switch (activeTab) {
        case 'ringkasan':
          return <AdminOverview />;
        case 'sirkulasi':
          return <Sirkulasi />;
        case 'buku-terpinjam':
          return <BukuTerpinjam />;
        case 'master-buku':
          return <MasterData />;
        case 'denda':
          return <DendaList />;
        case 'pengguna':
          return <DataAnggota />;
        default:
          return <AdminOverview />;
      }
    } else {
      switch (activeTab) {
        case 'katalog':
          return <KatalogBuku />;
        case 'pinjaman-saya':
          return <PinjamanSaya />;
        default:
          return <KatalogBuku />;
      }
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
