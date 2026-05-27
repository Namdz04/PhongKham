import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Doctors from './components/Doctors';
import Appointments from './components/Appointments';
import MedicalRecords from './components/MedicalRecords';
import TestingPanel from './components/TestingPanel';
import './App.css';

// Thành phần giao diện chính sau khi đã xác thực tài khoản
function AppContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập
  if (!user) {
    return <Login />;
  }

  // Hàm hỗ trợ render component tương ứng với Tab đang hoạt động
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors />;
      case 'appointments':
        return <Appointments />;
      case 'records':
        return <MedicalRecords />;
      case 'testing':
        return <TestingPanel />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar - Thanh điều hướng bên trái (Ẩn khi in ấn) */}
      <aside className="app-sidebar no-print">
        <div className="sidebar-brand">
          <span className="brand-logo">🏥</span>
          <div>
            <h1>Phòng Khám</h1>
            <p>Hệ Thống Quản Trị</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <span className="nav-icon">📊</span> Bảng điều khiển
            </li>
            
            <li className={activeTab === 'patients' ? 'active' : ''} onClick={() => setActiveTab('patients')}>
              <span className="nav-icon">👤</span> Bệnh nhân
            </li>

            <li className={activeTab === 'doctors' ? 'active' : ''} onClick={() => setActiveTab('doctors')}>
              <span className="nav-icon">🥼</span> Đội ngũ bác sĩ
            </li>

            <li className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>
              <span className="nav-icon">📅</span> Lịch khám bệnh
            </li>

            <li className={activeTab === 'records' ? 'active' : ''} onClick={() => setActiveTab('records')}>
              <span className="nav-icon">📂</span> Hồ sơ bệnh án
            </li>

            <li className={activeTab === 'testing' ? 'active' : ''} onClick={() => setActiveTab('testing')}>
              <span className="nav-icon">⚙️</span> Kiểm thử hệ thống
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.role === 'admin' && 'Quản trị viên'}
                {user.role === 'doctor' && 'Bác sĩ'}
                {user.role === 'patient' && 'Bệnh nhân'}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Khu vực hiển thị nội dung chính của ứng dụng */}
      <main className="app-main-content">
        <header className="main-header no-print">
          <div className="header-title-box">
            <h2>
              {activeTab === 'dashboard' && 'Bảng Điều Khiển & Thống Kê'}
              {activeTab === 'patients' && 'Quản Lý Hồ Sơ Bệnh Nhân'}
              {activeTab === 'doctors' && 'Danh Sách Bác Sĩ Chuyên Khoa'}
              {activeTab === 'appointments' && 'Lịch Hẹn Khám Bệnh'}
              {activeTab === 'records' && 'Hồ sơ Bệnh Án & Kê Đơn Thuốc'}
              {activeTab === 'testing' && 'Giao Diện Kiểm Thử Hệ Thống'}
            </h2>
            <p>Hệ thống phòng khám đa khoa kỹ thuật số thông minh</p>
          </div>
          <div className="header-actions">
            <span className="time-badge">🕒 {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </header>

        <div className="page-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Bọc ứng dụng trong các Provider tương ứng
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
