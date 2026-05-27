import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useData();
  const { user } = useAuth();

  // Biến tìm kiếm và bộ lọc chuyên khoa
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // Các trạng thái Form (Thêm/Sửa)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Nội tổng quát',
    phone: '',
    email: '',
    room: ''
  });

  // Danh sách các chuyên khoa hiện có
  const specialties = [
    'Tim mạch',
    'Nhi khoa',
    'Da liễu',
    'Thần kinh',
    'Tiêu hóa',
    'Cơ xương khớp',
    'Mắt',
    'Tai Mũi Họng',
    'Nội tổng quát'
  ];

  // Quyền thao tác sửa/xóa bác sĩ: Chỉ Admin mới có quyền
  const isAdmin = user.role === 'admin';

  // Lọc danh sách bác sĩ dựa trên tìm kiếm và chuyên khoa
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.phone.includes(searchTerm);

    const matchesSpecialty = specialtyFilter === '' || d.specialty === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  // Mở Form thêm mới bác sĩ
  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      specialty: 'Nội tổng quát',
      phone: '',
      email: '',
      room: ''
    });
    setIsFormOpen(true);
  };

  // Mở Form sửa bác sĩ
  const handleOpenEditForm = (doctor) => {
    setEditingId(doctor.id);
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty,
      phone: doctor.phone,
      email: doctor.email,
      room: doctor.room
    });
    setIsFormOpen(true);
  };

  // Submit form Thêm/Sửa
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.room.trim()) {
      alert('Tên bác sĩ và Phòng làm việc là bắt buộc!');
      return;
    }

    if (editingId) {
      updateDoctor(editingId, formData);
      alert('Cập nhật thông tin bác sĩ thành công!');
    } else {
      addDoctor(formData);
      alert('Thêm bác sĩ mới thành công!');
    }
    setIsFormOpen(false);
  };

  // Xử lý xóa bác sĩ
  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bác sĩ "${name}"? Thao tác này cũng sẽ xóa lịch khám liên quan.`)) {
      deleteDoctor(id);
      alert('Xóa bác sĩ thành công!');
    }
  };

  return (
    <div className="management-container">
      <div className="view-header">
        <h2>Đội Ngũ Bác Sĩ Chuyên Khoa</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={handleOpenAddForm}>➕ Thêm Bác Sĩ</button>
        )}
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="filter-bar">
        <div className="search-box">
          🔍 <input 
            type="text" 
            placeholder="Tìm kiếm bác sĩ theo Tên, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select">
          <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
            <option value="">Tất cả chuyên khoa</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form modal thêm/sửa bác sĩ */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm mới bác sĩ'}</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Họ và tên bác sĩ *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên bác sĩ (Ví dụ: BS. Nguyễn Văn A)..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Chuyên khoa chính</label>
                  <select 
                    value={formData.specialty} 
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  >
                    {specialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Phòng khám / Phòng làm việc *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Phòng 101 - Khu A..."
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input 
                    type="tel" 
                    placeholder="Số điện thoại liên hệ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email liên hệ</label>
                  <input 
                    type="email" 
                    placeholder="email@phongkham.vn..."
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hiển thị danh sách bác sĩ dạng Card Grid hiện đại */}
      {filteredDoctors.length === 0 ? (
        <div className="no-data-panel">
          <p className="no-data">Không tìm thấy bác sĩ nào phù hợp.</p>
        </div>
      ) : (
        <div className="doctors-card-grid">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="doctor-card">
              <div className="doctor-avatar-circle">
                👨‍⚕️
              </div>
              <div className="doctor-info-box">
                <h4>{doc.name}</h4>
                <span className="doctor-specialty-tag">{doc.specialty}</span>
                
                <div className="doctor-detail-lines">
                  <p>📍 <strong>Phòng:</strong> {doc.room}</p>
                  <p>📞 <strong>SĐT:</strong> {doc.phone || 'Chưa cập nhật'}</p>
                  <p>✉️ <strong>Email:</strong> {doc.email || 'Chưa cập nhật'}</p>
                </div>

                {isAdmin && (
                  <div className="doctor-card-actions">
                    <button className="btn-edit" onClick={() => handleOpenEditForm(doc)}>✏️ Sửa</button>
                    <button className="btn-delete" onClick={() => handleDelete(doc.id, doc.name)}>🗑️ Xóa</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
