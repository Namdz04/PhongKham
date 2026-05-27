import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Patients() {
  const { patients, addPatient, updatePatient, deletePatient, importPatientsJSON } = useData();
  const { user } = useAuth();

  // Các biến trạng thái tìm kiếm và bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Các trạng thái Form (Thêm/Sửa)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Nam',
    phone: '',
    email: '',
    address: ''
  });

  // Trạng thái Import dữ liệu
  const [importText, setImportText] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Quyền truy cập: Bệnh nhân thông thường không thể tự xem danh sách bệnh nhân khác
  const isAuthorized = user.role === 'admin' || user.role === 'doctor';

  // Lọc danh sách bệnh nhân dựa trên điều kiện tìm kiếm và lọc
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGender = genderFilter === '' || p.gender === genderFilter;

    return matchesSearch && matchesGender;
  });

  // Xử lý mở form Thêm mới bệnh nhân
  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      dob: '',
      gender: 'Nam',
      phone: '',
      email: '',
      address: ''
    });
    setIsFormOpen(true);
  };

  // Xử lý mở form Chỉnh sửa bệnh nhân
  const handleOpenEditForm = (patient) => {
    setEditingId(patient.id);
    setFormData({
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address
    });
    setIsFormOpen(true);
  };

  // Xử lý gửi Form Thêm/Sửa
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Họ tên và Số điện thoại là bắt buộc!');
      return;
    }

    if (editingId) {
      updatePatient(editingId, formData);
      alert('Cập nhật thông tin bệnh nhân thành công!');
    } else {
      addPatient(formData);
      alert('Thêm bệnh nhân mới thành công!');
    }
    setIsFormOpen(false);
  };

  // Xử lý Xóa bệnh nhân
  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bệnh nhân "${name}"? Thao tác này cũng sẽ xóa lịch khám liên quan.`)) {
      deletePatient(id);
      alert('Xóa thành công!');
    }
  };

  // Xuất danh sách bệnh nhân sang định dạng CSV (đáp ứng xuất Excel)
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // Thêm BOM để Excel đọc được ký tự tiếng Việt UTF-8
    csvContent += 'Mã BN,Họ tên,Ngày sinh,Giới tính,Số điện thoại,Email,Địa chỉ\n';
    
    filteredPatients.forEach(p => {
      csvContent += `"${p.id}","${p.name}","${p.dob}","${p.gender}","${p.phone}","${p.email || ''}","${p.address || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_benh_nhan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Xử lý nhập dữ liệu JSON giả lập
  const handleImportSubmit = (e) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');

    if (!importText.trim()) {
      setImportError('Vui lòng dán chuỗi dữ liệu JSON vào ô dưới.');
      return;
    }

    const result = importPatientsJSON(importText);
    if (result.success) {
      setImportSuccess(`Đã nhập thành công ${result.count} bệnh nhân mới!`);
      setImportText('');
      setTimeout(() => setIsImportOpen(false), 1500);
    } else {
      setImportError(`Lỗi nhập dữ liệu: ${result.message}`);
    }
  };

  // Gợi ý dữ liệu mẫu để người dùng copy test tính năng import
  const insertSampleImportData = () => {
    const sample = [
      {
        name: "Lê Văn Cường",
        dob: "1992-08-25",
        gender: "Nam",
        phone: "0944888999",
        email: "cuong.le@example.com",
        address: "72 Nguyễn Chí Thanh, Hà Nội"
      },
      {
        name: "Ngô Thị Thu",
        dob: "1995-03-12",
        gender: "Nữ",
        phone: "0966777888",
        email: "thu.ngo@example.com",
        address: "102 Kim Mã, Hà Nội"
      }
    ];
    setImportText(JSON.stringify(sample, null, 2));
  };

  // Nếu người đăng nhập là bệnh nhân, hiển thị hồ sơ cá nhân thay vì danh sách
  if (!isAuthorized) {
    const myProfile = patients.find(p => p.id === user.id) || {
      id: user.id,
      name: user.name,
      dob: 'Chưa cập nhật',
      gender: 'Chưa cập nhật',
      phone: 'Chưa cập nhật',
      email: user.username,
      address: 'Chưa cập nhật'
    };

    return (
      <div className="patient-profile-view">
        <h2>Thông tin cá nhân của bạn</h2>
        <div className="profile-card">
          <div className="profile-avatar">👤</div>
          <div className="profile-details">
            <p><strong>Mã bệnh nhân:</strong> {myProfile.id}</p>
            <p><strong>Họ và tên:</strong> {myProfile.name}</p>
            <p><strong>Ngày sinh:</strong> {myProfile.dob}</p>
            <p><strong>Giới tính:</strong> {myProfile.gender}</p>
            <p><strong>Số điện thoại:</strong> {myProfile.phone}</p>
            <p><strong>Email:</strong> {myProfile.email}</p>
            <p><strong>Địa chỉ liên lạc:</strong> {myProfile.address}</p>
          </div>
        </div>
        <div className="alert-box note-box">
          Để cập nhật thông tin cá nhân, quý khách vui lòng liên hệ quầy tiếp đón phòng khám để được hỗ trợ.
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="view-header">
        <h2>Quản Lý Danh Sách Bệnh Nhân</h2>
        <div className="action-buttons-group">
          <button className="btn-primary" onClick={handleOpenAddForm}>➕ Thêm Bệnh Nhân</button>
          <button className="btn-secondary" onClick={() => setIsImportOpen(true)}>📥 Import Dữ Liệu</button>
          <button className="btn-secondary" onClick={handleExportCSV}>📤 Xuất Excel (CSV)</button>
        </div>
      </div>

      {/* Thanh bộ lọc và tìm kiếm */}
      <div className="filter-bar">
        <div className="search-box">
          🔍 <input 
            type="text" 
            placeholder="Tìm kiếm theo Tên, SĐT, Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select">
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
      </div>

      {/* Form thêm/sửa bệnh nhân ẩn/hiện */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Chỉnh sửa thông tin bệnh nhân' : 'Thêm mới bệnh nhân'}</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Họ và tên *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên bệnh nhân..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select 
                    value={formData.gender} 
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="Nhập SĐT liên hệ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    placeholder="ví dụ: email@gmail.com..."
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea 
                  rows="2"
                  placeholder="Nhập địa chỉ chỗ ở hiện tại..."
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import JSON dữ liệu */}
      {isImportOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nhập dữ liệu Bệnh nhân từ JSON</h3>
              <button className="close-btn" onClick={() => setIsImportOpen(false)}>×</button>
            </div>
            <form onSubmit={handleImportSubmit} className="modal-form">
              <p className="help-text">Dán chuỗi dữ liệu JSON (dạng mảng các object chứa thông tin bệnh nhân) để nhập nhanh danh sách.</p>
              
              {importError && <div className="alert-danger">{importError}</div>}
              {importSuccess && <div className="alert-success">{importSuccess}</div>}

              <div className="form-group">
                <textarea
                  rows="8"
                  className="code-textarea"
                  placeholder='[{"name": "...", "phone": "..."}]'
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={insertSampleImportData}>📋 Dữ liệu mẫu</button>
                <button type="button" className="btn-cancel" onClick={() => setIsImportOpen(false)}>Hủy</button>
                <button type="submit" className="btn-submit">Bắt đầu Import</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bảng danh sách bệnh nhân */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã BN</th>
              <th>Họ tên</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              {user.role === 'admin' && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={user.role === 'admin' ? 7 : 6} className="no-data">Không tìm thấy bệnh nhân nào khớp với từ khóa tìm kiếm.</td>
              </tr>
            ) : (
              filteredPatients.map(p => (
                <tr key={p.id}>
                  <td><code>{p.id}</code></td>
                  <td><strong>{p.name}</strong><br/><small>{p.email}</small></td>
                  <td>{p.dob}</td>
                  <td>{p.gender}</td>
                  <td>{p.phone}</td>
                  <td>{p.address}</td>
                  {user.role === 'admin' && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-edit" onClick={() => handleOpenEditForm(p)} title="Sửa">✏️ Sửa</button>
                        <button className="btn-delete" onClick={() => handleDelete(p.id, p.name)} title="Xóa">🗑️ Xóa</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
