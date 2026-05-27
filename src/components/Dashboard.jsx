import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ setActiveTab }) {
  const { patients, doctors, appointments, medicalRecords } = useData();
  const { user } = useAuth();

  // Định dạng ngày hôm nay ở định dạng YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Tính toán số liệu thống kê cho Admin/Bác sĩ
  const totalPatients = patients.length;
  const totalDoctors = doctors.length;
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const totalApts = appointments.length;
  const pendingApts = appointments.filter(a => a.status === 'Chờ khám').length;
  const completedApts = appointments.filter(a => a.status === 'Đã khám').length;

  // Lọc lịch khám và bệnh án riêng cho bệnh nhân đang đăng nhập
  const myAppointments = appointments.filter(a => a.patientId === user.id);
  const myUpcomingApts = myAppointments.filter(a => a.status === 'Chờ khám');
  const myMedicalRecords = medicalRecords.filter(m => m.patientId === user.id);

  // Lọc lịch khám riêng cho bác sĩ đang đăng nhập
  const docAppointments = appointments.filter(a => a.doctorId === user.id);
  const docUpcomingApts = docAppointments.filter(a => a.status === 'Chờ khám');
  const docTodayApts = docAppointments.filter(a => a.date === todayStr);

  // Thống kê phân bố lịch khám theo chuyên khoa
  const specialtyStats = appointments.reduce((acc, curr) => {
    const spec = curr.specialty || 'Nội tổng quát';
    acc[spec] = (acc[spec] || 0) + 1;
    return acc;
  }, {});

  const specialtyList = Object.entries(specialtyStats).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / (totalApts || 1)) * 100)
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="dashboard-container">
      {/* Lời chào chào đón người dùng */}
      <div className="welcome-banner">
        <div>
          <h2>Xin chào, {user.name}! 👋</h2>
          <p>
            {user.role === 'admin' && 'Chào mừng Quản trị viên hệ thống. Dưới đây là phân tích hoạt động phòng khám hôm nay.'}
            {user.role === 'doctor' && `Hôm nay bác sĩ có ${docTodayApts.length} lịch hẹn khám bệnh. Hãy xem chi tiết bên dưới.`}
            {user.role === 'patient' && 'Cảm ơn bạn đã lựa chọn phòng khám của chúng tôi. Bạn có thể đặt lịch khám nhanh chóng qua hệ thống.'}
          </p>
        </div>
        <div className="banner-badge">
          Vai trò: <strong>{user.role === 'admin' ? 'Quản trị viên' : user.role === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}</strong>
        </div>
      </div>

      {/* HIỂN THỊ CHO ADMIN HOẶC BÁC SĨ */}
      {(user.role === 'admin' || user.role === 'doctor') && (
        <>
          {/* Hàng thẻ thống kê số liệu */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveTab('patients')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon patient-icon">👤</div>
              <div className="stat-info">
                <h3>{totalPatients}</h3>
                <p>Tổng bệnh nhân</p>
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('doctors')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon doctor-icon">🥼</div>
              <div className="stat-info">
                <h3>{totalDoctors}</h3>
                <p>Đội ngũ bác sĩ</p>
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('appointments')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon appointment-icon">📅</div>
              <div className="stat-info">
                <h3>{todayAppointments.length}</h3>
                <p>Lịch khám hôm nay</p>
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('records')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon record-icon">📂</div>
              <div className="stat-info">
                <h3>{medicalRecords.length}</h3>
                <p>Hồ sơ bệnh án</p>
              </div>
            </div>
          </div>

          <div className="dashboard-content-grid">
            {/* Cột trái: Lịch hẹn sắp diễn ra */}
            <div className="dashboard-panel">
              <div className="panel-header">
                <h3>Lịch hẹn sắp khám</h3>
                <button className="btn-link" onClick={() => setActiveTab('appointments')}>Xem tất cả</button>
              </div>
              <div className="panel-body">
                {user.role === 'admin' ? (
                  appointments.filter(a => a.status === 'Chờ khám').length === 0 ? (
                    <p className="no-data">Không có lịch hẹn nào đang chờ.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Bệnh nhân</th>
                            <th>Bác sĩ</th>
                            <th>Thời gian</th>
                            <th>Chuyên khoa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.filter(a => a.status === 'Chờ khám').slice(0, 5).map(apt => (
                            <tr key={apt.id}>
                              <td><strong>{apt.patientName}</strong></td>
                              <td>{apt.doctorName}</td>
                              <td>{apt.date} - {apt.time}</td>
                              <td><span className="badge-specialty">{apt.specialty}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  docUpcomingApts.length === 0 ? (
                    <p className="no-data">Bác sĩ không có lịch hẹn khám nào sắp tới.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Bệnh nhân</th>
                            <th>Thời gian</th>
                            <th>Triệu chứng</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docUpcomingApts.slice(0, 5).map(apt => (
                            <tr key={apt.id}>
                              <td><strong>{apt.patientName}</strong></td>
                              <td>{apt.date} - {apt.time}</td>
                              <td className="text-truncate" style={{ maxWidth: '180px' }}>{apt.symptoms}</td>
                              <td>
                                <button 
                                  className="btn-action btn-primary-sm"
                                  onClick={() => {
                                    setActiveTab('records');
                                    // Chúng ta có thể truyền state hoặc mở modal tạo bệnh án mới ở tab bệnh án
                                  }}
                                >
                                  Khám & Ghi bệnh án
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Cột phải: Thống kê tỷ lệ Chuyên khoa */}
            <div className="dashboard-panel">
              <div className="panel-header">
                <h3>Thống kê lượt khám theo Chuyên khoa</h3>
              </div>
              <div className="panel-body">
                {specialtyList.length === 0 ? (
                  <p className="no-data">Chưa có dữ liệu thống kê lịch khám.</p>
                ) : (
                  <div className="specialty-stats-list">
                    {specialtyList.map(item => (
                      <div key={item.name} className="specialty-stat-item">
                        <div className="specialty-info">
                          <span>{item.name}</span>
                          <strong>{item.count} lượt ({item.percentage}%)</strong>
                        </div>
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Các phím hành động nhanh */}
                <div className="quick-actions-box">
                  <h4>Thao tác nhanh</h4>
                  <div className="quick-actions-buttons">
                    <button className="btn-secondary" onClick={() => setActiveTab('appointments')}>📅 Đặt lịch mới</button>
                    {user.role === 'admin' && (
                      <button className="btn-secondary" onClick={() => setActiveTab('patients')}>➕ Thêm bệnh nhân</button>
                    )}
                    <button className="btn-secondary" onClick={() => setActiveTab('records')}>📝 Viết hồ sơ bệnh án</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HIỂN THỊ DÀNH RIÊNG CHO BỆNH NHÂN */}
      {user.role === 'patient' && (
        <div className="patient-dashboard-grid">
          {/* Lịch hẹn sắp diễn ra của bản thân */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3>Lịch khám sắp tới của bạn</h3>
              <button className="btn-primary" onClick={() => setActiveTab('appointments')}>📅 Đặt lịch khám ngay</button>
            </div>
            <div className="panel-body">
              {myUpcomingApts.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn không có lịch hẹn khám nào sắp tới.</p>
                  <p className="sub-text">Hãy nhấn nút Đặt lịch khám ngay để hẹn gặp bác sĩ chuyên khoa.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Bác sĩ</th>
                        <th>Thời gian</th>
                        <th>Chuyên khoa</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myUpcomingApts.map(apt => (
                        <tr key={apt.id}>
                          <td><strong>{apt.doctorName}</strong></td>
                          <td>{apt.date} - {apt.time}</td>
                          <td><span className="badge-specialty">{apt.specialty}</span></td>
                          <td><span className="status-badge status-pending">{apt.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Lịch sử bệnh án của bệnh nhân */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3>Hồ sơ bệnh án & Kết quả của bạn</h3>
              <button className="btn-link" onClick={() => setActiveTab('records')}>Xem tất cả hồ sơ</button>
            </div>
            <div className="panel-body">
              {myMedicalRecords.length === 0 ? (
                <p className="no-data">Bạn chưa có hồ sơ bệnh án nào được ghi nhận tại phòng khám.</p>
              ) : (
                <div className="medical-records-timeline">
                  {myMedicalRecords.slice(0, 3).map(rec => (
                    <div key={rec.id} className="timeline-item">
                      <div className="timeline-date">{rec.date}</div>
                      <div className="timeline-content">
                        <h4>Bác sĩ phụ trách: {rec.doctorName}</h4>
                        <p><strong>Triệu chứng:</strong> {rec.symptoms}</p>
                        <p><strong>Chẩn đoán:</strong> {rec.diagnosis}</p>
                        <p className="prescription-teaser">
                          <strong>Thuốc kê đơn:</strong> <span className="pre-wrap">{rec.prescription}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
