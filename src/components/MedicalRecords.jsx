import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function MedicalRecords() {
  const { 
    medicalRecords, 
    patients, 
    doctors, 
    addMedicalRecord, 
    updateMedicalRecord, 
    deleteMedicalRecord 
  } = useData();
  const { user } = useAuth();

  // Trạng thái tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // Các trạng thái Form (Thêm/Sửa)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescription: ''
  });

  // Trạng thái xem chi tiết để in PDF/Đơn thuốc
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Phân quyền
  const isDoctorOrAdmin = user.role === 'admin' || user.role === 'doctor';
  const isAdmin = user.role === 'admin';

  // Lọc hồ sơ bệnh án hiển thị dựa trên vai trò
  const visibleRecords = medicalRecords.filter(rec => {
    // 1. Phân quyền hiển thị theo Vai trò
    if (user.role === 'patient' && rec.patientId !== user.id) return false;
    if (user.role === 'doctor' && rec.doctorId !== user.id) return false;

    // 2. Tìm kiếm theo tên bệnh nhân, bác sĩ hoặc chẩn đoán
    const matchesSearch = 
      rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Mở form thêm bệnh án mới
  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      symptoms: '',
      diagnosis: '',
      treatment: '',
      prescription: ''
    });
    setIsFormOpen(true);
  };

  // Mở form chỉnh sửa bệnh án
  const handleOpenEditForm = (record) => {
    setEditingId(record.id);
    setFormData({
      patientId: record.patientId,
      doctorId: record.doctorId,
      date: record.date,
      symptoms: record.symptoms,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription
    });
    setIsFormOpen(true);
  };

  // Submit Form tạo/sửa bệnh án
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.diagnosis.trim()) {
      alert('Vui lòng chọn Bệnh nhân, Bác sĩ và nhập Chẩn đoán bệnh!');
      return;
    }

    const patient = patients.find(p => p.id === formData.patientId);
    const doctor = doctors.find(d => d.id === formData.doctorId);

    const recordPayload = {
      patientId: formData.patientId,
      patientName: patient?.name || 'Ẩn danh',
      doctorId: formData.doctorId,
      doctorName: doctor?.name || 'Ẩn danh',
      date: formData.date,
      symptoms: formData.symptoms,
      diagnosis: formData.diagnosis,
      treatment: formData.treatment,
      prescription: formData.prescription
    };

    if (editingId) {
      updateMedicalRecord(editingId, recordPayload);
      alert('Cập nhật hồ sơ bệnh án thành công!');
    } else {
      addMedicalRecord(recordPayload);
      alert('Thêm hồ sơ bệnh án thành công!');
    }
    setIsFormOpen(false);
  };

  // Xóa hồ sơ bệnh án
  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ bệnh án này không?')) {
      deleteMedicalRecord(id);
      alert('Xóa hồ sơ bệnh án thành công!');
    }
  };

  // Xuất danh sách hồ sơ bệnh án hiện tại ra file CSV/Excel
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // BOM tiếng Việt
    csvContent += 'Mã bệnh án,Ngày khám,Tên bệnh nhân,Bác sĩ phụ trách,Triệu chứng,Chẩn đoán,Đơn thuốc\n';
    
    visibleRecords.forEach(r => {
      // Thay thế dấu xuống dòng trong đơn thuốc thành dấu chấm phẩy hoặc khoảng trắng để không làm vỡ cấu trúc CSV
      const prescriptionClean = r.prescription.replace(/\n/g, '; ');
      csvContent += `"${r.id}","${r.date}","${r.patientName}","${r.doctorName}","${r.symptoms}","${r.diagnosis}","${prescriptionClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_benh_an_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kích hoạt lệnh in đơn thuốc / bệnh án PDF của hệ thống
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="management-container">
      {/* 
        Khu vực IN ẤN chuyên nghiệp (Sẽ ẩn trên trình duyệt và chỉ hiện khi ấn lệnh in PDF)
        Cấu hình in ấn này được hỗ trợ thông qua @media print trong App.css
      */}
      {selectedRecord && (
        <div id="print-area" className="printable-prescription">
          <div className="print-header">
            <div className="clinic-logo">🏥 PHÒNG KHÁM ĐA KHOA ANTIGRAVITY</div>
            <div className="clinic-address">
              <p>Địa chỉ: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội</p>
              <p>Hotline: 1900-123-456 | Website: www.phongkhamantigravity.vn</p>
            </div>
          </div>
          <hr className="print-divider" />
          <h2 className="print-title">HỒ SƠ BỆNH ÁN & ĐƠN THUỐC</h2>
          <div className="print-meta-grid">
            <p><strong>Mã bệnh án:</strong> {selectedRecord.id}</p>
            <p><strong>Ngày khám:</strong> {selectedRecord.date}</p>
            <p><strong>Bệnh nhân:</strong> {selectedRecord.patientName}</p>
            <p><strong>Bác sĩ khám:</strong> {selectedRecord.doctorName}</p>
          </div>

          <div className="print-section">
            <h4>1. Triệu chứng lâm sàng</h4>
            <p>{selectedRecord.symptoms || 'Không ghi nhận'}</p>
          </div>

          <div className="print-section">
            <h4>2. Chẩn đoán y khoa</h4>
            <p className="highlight-text"><strong>{selectedRecord.diagnosis}</strong></p>
          </div>

          <div className="print-section">
            <h4>3. Phương án điều trị</h4>
            <p>{selectedRecord.treatment || 'Chưa ghi nhận'}</p>
          </div>

          <div className="print-section">
            <h4>4. Đơn thuốc kê khai</h4>
            <pre className="prescription-content">{selectedRecord.prescription || 'Không có thuốc kê đơn'}</pre>
          </div>

          <div className="print-footer-signature">
            <div className="signature-box">
              <p>Hà Nội, Ngày ..... tháng ..... năm 2026</p>
              <p className="signature-title">Bác sĩ điều trị</p>
              <div className="signature-space"></div>
              <p className="signature-name">{selectedRecord.doctorName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Giao diện chính của tab Hồ sơ bệnh án */}
      <div className="view-header no-print">
        <h2>Quản Lý Hồ Sơ Bệnh Án</h2>
        <div className="action-buttons-group">
          {isDoctorOrAdmin && (
            <button className="btn-primary" onClick={handleOpenAddForm}>➕ Thêm Bệnh Án Mới</button>
          )}
          <button className="btn-secondary" onClick={handleExportCSV}>📤 Xuất Báo Cáo (CSV)</button>
        </div>
      </div>

      {/* Thanh bộ lọc */}
      <div className="filter-bar no-print">
        <div className="search-box">
          🔍 <input 
            type="text" 
            placeholder="Tìm theo Tên bệnh nhân, Chẩn đoán, Bác sĩ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Modal Thêm/Sửa Hồ sơ bệnh án */}
      {isFormOpen && (
        <div className="modal-overlay no-print">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>{editingId ? 'Cập nhật hồ sơ bệnh án' : 'Lập hồ sơ bệnh án mới'}</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Chọn Bệnh nhân *</label>
                  <select 
                    value={formData.patientId} 
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    required
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Ngày sinh: {p.dob})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bác sĩ phụ trách *</label>
                  <select 
                    value={formData.doctorId} 
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    required
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày lập bệnh án</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Chẩn đoán bệnh *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Thiếu máu cơ tim nhẹ, Viêm xoang cấp..."
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Triệu chứng lâm sàng</label>
                <textarea 
                  rows="2"
                  placeholder="Ghi lại các triệu chứng lâm sàng người bệnh khai..."
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Phương hướng điều trị / Lời khuyên</label>
                <textarea 
                  rows="2"
                  placeholder="Nghỉ ngơi, ăn uống lành mạnh, tái khám..."
                  value={formData.treatment}
                  onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Đơn thuốc chỉ định</label>
                <textarea 
                  rows="4"
                  className="prescription-textarea"
                  placeholder="Tên thuốc - Liều dùng (Ví dụ: Paracetamol 500mg - 2 viên/ngày chia sáng tối...)"
                  value={formData.prescription}
                  onChange={(e) => setFormData({...formData, prescription: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{editingId ? 'Cập nhật' : 'Tạo hồ sơ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách các hồ sơ bệnh án */}
      <div className="table-responsive no-print">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã bệnh án</th>
              <th>Ngày khám</th>
              <th>Bệnh nhân</th>
              <th>Bác sĩ</th>
              <th>Chẩn đoán</th>
              <th>Triệu chứng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Không có hồ sơ bệnh án nào được tìm thấy.</td>
              </tr>
            ) : (
              visibleRecords.map(rec => (
                <tr key={rec.id}>
                  <td><code>{rec.id}</code></td>
                  <td>{rec.date}</td>
                  <td><strong>{rec.patientName}</strong></td>
                  <td>{rec.doctorName}</td>
                  <td><strong className="diagnosis-highlight">{rec.diagnosis}</strong></td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>{rec.symptoms || '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button 
                        className="btn-print-sm" 
                        onClick={() => {
                          setSelectedRecord(rec);
                          // Chờ React cập nhật DOM rồi kích hoạt in
                          setTimeout(handlePrintPDF, 100);
                        }}
                        title="Xem bản in & Tải PDF đơn thuốc"
                      >
                        🖨️ In PDF
                      </button>
                      
                      {isDoctorOrAdmin && (
                        <button className="btn-edit-sm" onClick={() => handleOpenEditForm(rec)} title="Sửa">
                          ✏️ Sửa
                        </button>
                      )}

                      {isAdmin && (
                        <button className="btn-delete-sm" onClick={() => handleDelete(rec.id)} title="Xóa">
                          🗑️ Xóa
                        </button>
                      )}
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
