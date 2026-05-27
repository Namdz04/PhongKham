import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getSpecialtySuggestion } from '../services/aiSuggestion';

export default function Appointments() {
  const { 
    appointments, 
    patients, 
    doctors, 
    addAppointment, 
    updateAppointmentStatus, 
    deleteAppointment 
  } = useData();
  const { user } = useAuth();

  // Các bộ lọc tìm kiếm trên giao diện
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Trạng thái mở Form đặt lịch mới
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Dữ liệu trong form đặt lịch hẹn
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '08:00',
    symptoms: '',
    specialty: 'Nội tổng quát'
  });

  // Trạng thái lưu trữ gợi ý từ dịch vụ AI
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Tự động điền mặc định thông tin bệnh nhân nếu vai trò là Patient
  useEffect(() => {
    if (user.role === 'patient') {
      setFormData(prev => ({ ...prev, patientId: user.id }));
    } else if (patients.length > 0) {
      setFormData(prev => ({ ...prev, patientId: patients[0].id }));
    }
  }, [user, patients, isFormOpen]);

  // Bộ lọc bác sĩ theo chuyên khoa đã chọn
  const filteredDoctorsForBooking = doctors.filter(doc => doc.specialty === formData.specialty);

  // Tự động chọn bác sĩ đầu tiên của chuyên khoa đó khi thay đổi chuyên khoa
  useEffect(() => {
    if (filteredDoctorsForBooking.length > 0) {
      setFormData(prev => ({ ...prev, doctorId: filteredDoctorsForBooking[0].id }));
    } else {
      setFormData(prev => ({ ...prev, doctorId: '' }));
    }
  }, [formData.specialty, doctors]);

  // Xử lý kích hoạt gợi ý chuyên khoa bằng AI dựa trên triệu chứng nhập vào
  const handleAiSuggest = () => {
    if (!formData.symptoms.trim() || formData.symptoms.trim().length < 3) {
      alert('Vui lòng mô tả chi tiết triệu chứng của bạn (tối thiểu 3 ký tự) để AI phân tích!');
      return;
    }

    setIsAnalyzing(true);
    
    // Giả lập độ trễ xử lý của mô hình AI cho chân thực
    setTimeout(() => {
      const suggestions = getSpecialtySuggestion(formData.symptoms);
      setAiSuggestions(suggestions);
      setIsAnalyzing(false);
    }, 500);
  };

  // Áp dụng chuyên khoa được gợi ý bởi AI vào Form
  const applySpecialtySuggestion = (specName) => {
    setFormData(prev => ({
      ...prev,
      specialty: specName
    }));
    setAiSuggestions([]); // Đóng danh sách gợi ý sau khi chọn
  };

  // Submit form đặt lịch khám
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    const selectedPatient = patients.find(p => p.id === formData.patientId) || { name: user.name };
    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);

    if (!selectedDoctor) {
      alert('Vui lòng chọn bác sĩ khám bệnh!');
      return;
    }

    const appointmentPayload = {
      patientId: formData.patientId,
      patientName: selectedPatient.name,
      doctorId: formData.doctorId,
      doctorName: selectedDoctor.name,
      date: formData.date,
      time: formData.time,
      symptoms: formData.symptoms,
      specialty: formData.specialty,
      status: 'Chờ khám'
    };

    addAppointment(appointmentPayload);
    alert('Đặt lịch khám bệnh thành công!');
    setIsFormOpen(false);
    // Reset form
    setFormData({
      patientId: user.role === 'patient' ? user.id : (patients[0]?.id || ''),
      doctorId: '',
      date: '',
      time: '08:00',
      symptoms: '',
      specialty: 'Nội tổng quát'
    });
    setAiSuggestions([]);
  };

  // Xóa lịch khám (Chỉ dành cho Admin)
  const handleDeleteApt = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch khám này khỏi danh sách?')) {
      deleteAppointment(id);
      alert('Xóa lịch khám thành công!');
    }
  };

  // Cập nhật trạng thái lịch khám (Đã khám, Hủy khám)
  const handleUpdateStatus = (id, newStatus) => {
    updateAppointmentStatus(id, newStatus);
    alert(`Cập nhật trạng thái lịch khám thành: "${newStatus}"`);
  };

  // Lọc lịch hẹn hiển thị dựa trên vai trò của người đăng nhập
  const visibleAppointments = appointments.filter(apt => {
    // 1. Phân quyền hiển thị theo Vai trò
    if (user.role === 'patient' && apt.patientId !== user.id) return false;
    if (user.role === 'doctor' && apt.doctorId !== user.id) return false;

    // 2. Tìm kiếm theo tên bệnh nhân / tên bác sĩ
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.symptoms && apt.symptoms.toLowerCase().includes(searchTerm.toLowerCase()));

    // 3. Lọc theo trạng thái
    const matchesStatus = statusFilter === '' || apt.status === statusFilter;

    // 4. Lọc theo ngày khám
    const matchesDate = dateFilter === '' || apt.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="management-container">
      <div className="view-header">
        <h2>Quản Lý Lịch Khám Bệnh</h2>
        <button className="btn-primary" onClick={() => setIsFormOpen(true)}>📅 Đặt Lịch Khám Mới</button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="filter-bar">
        <div className="search-box">
          🔍 <input 
            type="text" 
            placeholder="Tìm theo tên bệnh nhân, bác sĩ, triệu chứng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ khám">Chờ khám</option>
            <option value="Đã khám">Đã khám</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
        </div>
        <div className="filter-date">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Modal đặt lịch khám mới */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Đặt Lịch Hẹn Khám Bệnh</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Lựa chọn bệnh nhân (Chỉ hiển thị cho Admin/Bác sĩ) */}
              {user.role !== 'patient' ? (
                <div className="form-group">
                  <label>Chọn Bệnh nhân *</label>
                  <select 
                    value={formData.patientId} 
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    required
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - SĐT: {p.phone}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Bệnh nhân đăng ký</label>
                  <input type="text" value={user.name} disabled className="input-disabled" />
                </div>
              )}

              {/* Mô tả triệu chứng và gợi ý chuyên khoa AI */}
              <div className="form-group">
                <label>Triệu chứng / Lý do khám bệnh *</label>
                <div className="symptom-input-row">
                  <textarea 
                    rows="3" 
                    required
                    placeholder="Mô tả các triệu chứng của bạn (Ví dụ: Đau đầu, chóng mặt, mất ngủ nhiều ngày...)"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  ></textarea>
                  <button 
                    type="button" 
                    className="btn-ai-suggest"
                    onClick={handleAiSuggest}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? '⚡ Đang phân tích...' : '🤖 AI Gợi Ý Chuyên Khoa'}
                  </button>
                </div>
              </div>

              {/* Danh sách hiển thị gợi ý AI */}
              {aiSuggestions.length > 0 && (
                <div className="ai-suggestions-panel">
                  <h4>💡 Gợi ý Chuyên khoa từ trợ lý AI:</h4>
                  <p className="help-text">Nhấp vào một chuyên khoa để tự động chọn chuyên khoa đó trong biểu mẫu.</p>
                  <div className="suggestions-list">
                    {aiSuggestions.map(s => (
                      <div 
                        key={s.specialty} 
                        className="suggestion-item"
                        onClick={() => applySpecialtySuggestion(s.specialty)}
                      >
                        <div className="suggestion-spec">
                          <strong>Chuyên khoa: {s.specialty}</strong>
                          <span className="confidence-badge">Mức độ khớp: {s.confidence}</span>
                        </div>
                        <p className="suggestion-desc">{s.description}</p>
                        {s.matchedKeywords.length > 0 && (
                          <div className="matched-keywords">
                            Từ khóa khớp: {s.matchedKeywords.map(k => <span key={k} className="keyword-tag">{k}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lựa chọn chuyên khoa và Bác sĩ */}
              <div className="form-row">
                <div className="form-group">
                  <label>Chuyên khoa khám</label>
                  <select 
                    value={formData.specialty} 
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  >
                    <option value="Tim mạch">Tim mạch</option>
                    <option value="Nhi khoa">Nhi khoa</option>
                    <option value="Da liễu">Da liễu</option>
                    <option value="Thần kinh">Thần kinh</option>
                    <option value="Tiêu hóa">Tiêu hóa</option>
                    <option value="Cơ xương khớp">Cơ xương khớp</option>
                    <option value="Mắt">Mắt</option>
                    <option value="Tai Mũi Họng">Tai Mũi Họng</option>
                    <option value="Nội tổng quát">Nội tổng quát</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bác sĩ phụ trách *</label>
                  <select 
                    value={formData.doctorId} 
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    required
                  >
                    {filteredDoctorsForBooking.length === 0 ? (
                      <option value="">(Không có bác sĩ chuyên khoa này)</option>
                    ) : (
                      filteredDoctorsForBooking.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name} - Phòng: {doc.room}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Ngày giờ khám */}
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày hẹn khám *</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Giờ hẹn khám *</label>
                  <select 
                    value={formData.time} 
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  >
                    <option value="08:00">08:00</option>
                    <option value="08:30">08:30</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                    <option value="10:00">10:00</option>
                    <option value="10:30">10:30</option>
                    <option value="14:00">14:00</option>
                    <option value="14:30">14:30</option>
                    <option value="15:00">15:00</option>
                    <option value="15:30">15:30</option>
                    <option value="16:00">16:00</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsFormOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-submit" disabled={filteredDoctorsForBooking.length === 0}>Xác nhận đặt lịch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách các lịch hẹn */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã lịch</th>
              <th>Bệnh nhân</th>
              <th>Bác sĩ</th>
              <th>Chuyên khoa</th>
              <th>Thời gian</th>
              <th>Triệu chứng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleAppointments.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">Không tìm thấy lịch khám bệnh nào.</td>
              </tr>
            ) : (
              visibleAppointments.map(apt => (
                <tr key={apt.id}>
                  <td><code>{apt.id}</code></td>
                  <td><strong>{apt.patientName}</strong></td>
                  <td>{apt.doctorName}</td>
                  <td><span className="badge-specialty">{apt.specialty}</span></td>
                  <td>{apt.date}<br/><small>{apt.time}</small></td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }} title={apt.symptoms}>{apt.symptoms}</td>
                  <td>
                    <span className={`status-badge ${
                      apt.status === 'Chờ khám' ? 'status-pending' : 
                      apt.status === 'Đã khám' ? 'status-completed' : 'status-cancelled'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {/* Bác sĩ/Admin thay đổi trạng thái thành Đã khám */}
                      {(user.role === 'admin' || user.role === 'doctor') && apt.status === 'Chờ khám' && (
                        <button 
                          className="btn-complete-sm"
                          onClick={() => handleUpdateStatus(apt.id, 'Đã khám')}
                        >
                          ✓ Khám xong
                        </button>
                      )}
                      
                      {/* Bệnh nhân tự hủy lịch hoặc Bác sĩ/Admin hủy */}
                      {apt.status === 'Chờ khám' && (
                        <button 
                          className="btn-cancel-sm"
                          onClick={() => handleUpdateStatus(apt.id, 'Đã hủy')}
                        >
                          ✗ Hủy hẹn
                        </button>
                      )}

                      {/* Chỉ Admin được quyền xóa lịch hoàn toàn */}
                      {user.role === 'admin' && (
                        <button 
                          className="btn-delete-sm"
                          onClick={() => handleDeleteApt(apt.id)}
                        >
                          🗑️ Xóa
                        </button>
                      )}

                      {apt.status !== 'Chờ khám' && <span className="text-muted">-</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
