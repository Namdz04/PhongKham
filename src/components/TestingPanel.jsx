import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getSpecialtySuggestion } from '../services/aiSuggestion';

export default function TestingPanel() {
  const dataContext = useData();
  const authContext = useAuth();
  
  const [testLogs, setTestLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testSummary, setTestSummary] = useState(null);

  // Hàm ghi lại vết nhật ký kiểm thử (log trace)
  const addLog = (message, status = 'info') => {
    setTestLogs(prev => [...prev, { message, status, id: Date.now() + Math.random() }]);
  };

  // Hàm chạy toàn bộ các kịch bản kiểm thử tích hợp (Integration Tests)
  const runTestSuite = async () => {
    setIsRunning(true);
    setTestLogs([]);
    setTestSummary(null);
    addLog('🚀 Bắt đầu khởi chạy Bộ kiểm thử tự động của Hệ thống phòng khám...', 'info');

    let passedCount = 0;
    let totalCount = 5;

    // Chờ 300ms cho mượt
    await new Promise(resolve => setTimeout(resolve, 300));

    // ================= TEST CASE 1: CRUD Bệnh nhân =================
    try {
      addLog('📝 [Test 1] Kiểm thử chức năng thêm mới bệnh nhân (CRUD)...', 'info');
      const initialCount = dataContext.patients.length;
      
      const newPatientData = {
        name: 'Nguyễn Thị Thử Nghiệm',
        dob: '1995-12-12',
        gender: 'Nữ',
        phone: '0999888777',
        email: 'test.patient@phongkham.vn',
        address: 'Phòng Lab Kiểm thử, Hà Nội'
      };

      const added = dataContext.addPatient(newPatientData);
      
      if (added && added.id.startsWith('pat_')) {
        addLog(`✔️ Thêm bệnh nhân thành công. Tạo mã bệnh nhân tự động: ${added.id}`, 'pass');
        const afterCount = dataContext.patients.length;
        if (afterCount === initialCount + 1) {
          addLog(`✔️ Khớp số lượng: Trước kiểm thử (${initialCount}) -> Sau kiểm thử (${afterCount})`, 'pass');
          passedCount++;
        } else {
          addLog(`❌ Lỗi kiểm tra: Số lượng bệnh nhân không đổi`, 'fail');
        }
      } else {
        addLog('❌ Lỗi kiểm tra: Không tạo được thực thể bệnh nhân mới hợp lệ', 'fail');
      }
    } catch (err) {
      addLog(`❌ Gặp ngoại lệ ở Test 1: ${err.message}`, 'fail');
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // ================= TEST CASE 2: Kiểm tra phân quyền Đăng nhập =================
    try {
      addLog('🔐 [Test 2] Kiểm thử Đăng nhập phân quyền...', 'info');
      
      // Thử đăng nhập sai
      const loginFail = authContext.login('invalid_user', 'wrong_pass');
      if (!loginFail.success) {
        addLog('✔️ Xác minh: Chặn đăng nhập với thông tin sai thành công.', 'pass');
      } else {
        addLog('❌ Lỗi kiểm tra: Vẫn đăng nhập thành công với tài khoản sai!', 'fail');
      }

      // Thử đăng nhập Admin
      const loginAdmin = authContext.login('admin', 'admin123');
      if (loginAdmin.success && loginAdmin.user.role === 'admin') {
        addLog(`✔️ Xác minh: Đăng nhập Admin thành công. Quyền hạn: ${loginAdmin.user.role}`, 'pass');
        passedCount++;
      } else {
        addLog('❌ Lỗi kiểm tra: Không thể đăng nhập bằng tài khoản Admin', 'fail');
      }

      // Khôi phục phiên làm việc cũ sau khi kiểm thử
      authContext.logout();
    } catch (err) {
      addLog(`❌ Gặp ngoại lệ ở Test 2: ${err.message}`, 'fail');
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // ================= TEST CASE 3: AI Gợi ý chuyên khoa =================
    try {
      addLog('🤖 [Test 3] Kiểm thử Trợ lý AI gợi ý chuyên khoa theo triệu chứng...', 'info');
      
      const symptoms = "Tôi cảm thấy đau tức ngực, hồi hộp, tim đập nhanh và thỉnh thoảng bị khó thở khi vận động mạnh";
      addLog(`Mô tả triệu chứng giả lập: "${symptoms}"`, 'info');
      
      const suggestions = getSpecialtySuggestion(symptoms);
      const topSuggestion = suggestions[0];
      
      addLog(`AI trả về chuyên khoa gợi ý cao nhất: "${topSuggestion.specialty}" (Độ tin cậy: ${topSuggestion.confidence})`, 'info');
      
      if (topSuggestion.specialty === 'Tim mạch') {
        addLog('✔️ Xác minh: AI gợi ý đúng chuyên khoa "Tim mạch" cho các triệu chứng liên quan.', 'pass');
        passedCount++;
      } else {
        addLog(`❌ Lỗi kiểm tra: AI gợi ý chuyên khoa "${topSuggestion.specialty}" (Mong đợi: "Tim mạch")`, 'fail');
      }
    } catch (err) {
      addLog(`❌ Gặp ngoại lệ ở Test 3: ${err.message}`, 'fail');
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // ================= TEST CASE 4: Đặt lịch khám và lọc Bác sĩ =================
    try {
      addLog('📅 [Test 4] Kiểm thử luồng Đặt lịch khám & Tự động lọc bác sĩ chuyên khoa...', 'info');
      
      // Lọc bác sĩ chuyên khoa Nhi khoa
      const pediatricDocs = dataContext.doctors.filter(d => d.specialty === 'Nhi khoa');
      addLog(`Kiểm tra bác sĩ chuyên khoa Nhi khoa: tìm thấy ${pediatricDocs.length} bác sĩ`, 'info');
      
      if (pediatricDocs.length > 0 && pediatricDocs.some(d => d.name === 'BS. Lê Thị Bình')) {
        addLog('✔️ Xác minh: Đã tìm thấy BS. Lê Thị Bình đảm nhận chuyên khoa Nhi khoa.', 'pass');
      } else {
        addLog('❌ Lỗi kiểm tra: Không tìm thấy BS. Lê Thị Bình của khoa Nhi khoa', 'fail');
      }

      // Đặt lịch
      const initialAptCount = dataContext.appointments.length;
      const aptPayload = {
        patientId: 'pat_2',
        patientName: 'Nguyễn Văn Nam',
        doctorId: 'doc_2',
        doctorName: 'BS. Lê Thị Bình',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        symptoms: 'Trẻ bị sốt cao, phát ban toàn thân',
        specialty: 'Nhi khoa',
        status: 'Chờ khám'
      };

      const addedApt = dataContext.addAppointment(aptPayload);
      const afterAptCount = dataContext.appointments.length;

      if (addedApt && afterAptCount === initialAptCount + 1) {
        addLog(`✔️ Đặt lịch khám thành công! Mã lịch: ${addedApt.id}, Trạng thái: ${addedApt.status}`, 'pass');
        passedCount++;
      } else {
        addLog('❌ Lỗi kiểm tra: Không tăng số lượng lịch khám sau khi đặt', 'fail');
      }
    } catch (err) {
      addLog(`❌ Gặp ngoại lệ ở Test 4: ${err.message}`, 'fail');
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // ================= TEST CASE 5: Tạo hồ sơ bệnh án khám xong =================
    try {
      addLog('📂 [Test 5] Kiểm thử luồng Bác sĩ hoàn thành khám & Lập hồ sơ bệnh án...', 'info');
      
      const recordPayload = {
        patientId: 'pat_2',
        patientName: 'Nguyễn Văn Nam',
        doctorId: 'doc_2',
        doctorName: 'BS. Lê Thị Bình',
        date: new Date().toISOString().split('T')[0],
        symptoms: 'Trẻ bị sốt cao, phát ban toàn thân',
        diagnosis: 'Sởi lành tính ở trẻ em',
        treatment: 'Hạ sốt, bổ sung vitamin A, tắm rửa sạch sẽ, cách ly tại nhà.',
        prescription: 'Paracetamol 250mg - 3 gói/ngày chia 3 lần\nVitamin A 100.000 IU - 1 viên uống duy nhất'
      };

      const initialRecordCount = dataContext.medicalRecords.length;
      const addedRecord = dataContext.addMedicalRecord(recordPayload);
      const afterRecordCount = dataContext.medicalRecords.length;

      if (addedRecord && afterRecordCount === initialRecordCount + 1) {
        addLog(`✔️ Tạo bệnh án thành công! Mã bệnh án: ${addedRecord.id}, Chẩn đoán: ${addedRecord.diagnosis}`, 'pass');
        passedCount++;
      } else {
        addLog('❌ Lỗi kiểm tra: Số lượng bệnh án không tăng lên', 'fail');
      }
    } catch (err) {
      addLog(`❌ Gặp ngoại lệ ở Test 5: ${err.message}`, 'fail');
    }

    setIsRunning(false);
    setTestSummary({
      passed: passedCount,
      total: totalCount,
      success: passedCount === totalCount
    });
    addLog(`🏁 Kết thúc quá trình kiểm thử tự động. Kết quả: ${passedCount}/${totalCount} ĐẠT`, passedCount === totalCount ? 'pass' : 'fail');
  };

  // Khôi phục toàn bộ trạng thái dữ liệu mẫu và xóa lịch sử kiểm thử
  const handleClearTestData = () => {
    if (window.confirm('Bạn có muốn khôi phục cơ sở dữ liệu phòng khám về trạng thái mặc định ban đầu không? Dữ liệu kiểm thử sinh ra sẽ bị xóa.')) {
      dataContext.resetToSampleData();
      setTestLogs([]);
      setTestSummary(null);
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  return (
    <div className="management-container">
      <div className="view-header">
        <h2>Hệ Thống Kiểm Thử Tự Động (Testing Dashboard)</h2>
        <div className="action-buttons-group">
          <button 
            className="btn-primary" 
            onClick={runTestSuite} 
            disabled={isRunning}
          >
            {isRunning ? '⏳ Đang kiểm thử...' : '⚙️ Chạy Toàn Bộ Bộ Kiểm Thử'}
          </button>
          <button 
            className="btn-danger" 
            onClick={handleClearTestData}
            disabled={isRunning}
          >
            🔄 Khôi Phục Dữ Liệu Gốc
          </button>
        </div>
      </div>

      <div className="alert-box info-box">
        <h4>ℹ️ Hướng dẫn kiểm thử tích hợp:</h4>
        <p>Hệ thống hỗ trợ chạy bộ kiểm thử tự động kiểm chứng trực tiếp tính toàn vẹn dữ liệu của các luồng nghiệp vụ cốt lõi: <strong>CRUD bệnh nhân, Đăng nhập phân quyền, Bộ máy phân tích triệu chứng AI, Luồng đặt lịch khám hẹn</strong> và <strong>Tạo lập hồ sơ bệnh án của bác sĩ</strong>.</p>
      </div>

      {testSummary && (
        <div className={`test-summary-banner ${testSummary.success ? 'summary-pass' : 'summary-fail'}`}>
          <h3>{testSummary.success ? '🎉 BỘ KIỂM THỬ ĐẠT CHUẨN (100% SUCCESS)' : '⚠️ CÓ LỖI XẢY RA TRONG KIỂM THỬ'}</h3>
          <p>Đã chạy thành công <strong>{testSummary.passed}/{testSummary.total}</strong> kịch bản kiểm thử giả lập.</p>
        </div>
      )}

      {/* Logs màn hình kiểm thử giả lập */}
      <div className="testing-terminal">
        <div className="terminal-header">
          <span className="terminal-dot red-dot"></span>
          <span className="terminal-dot yellow-dot"></span>
          <span className="terminal-dot green-dot"></span>
          <span className="terminal-title">Console Output - Integration Tests</span>
        </div>
        <div className="terminal-body">
          {testLogs.length === 0 ? (
            <p className="terminal-placeholder">Ấn nút "Chạy Toàn Bộ Bộ Kiểm Thử" ở trên để bắt đầu...</p>
          ) : (
            testLogs.map(log => (
              <div key={log.id} className={`terminal-line line-${log.status}`}>
                {log.status === 'pass' && '🟢 '}
                {log.status === 'fail' && '🔴 '}
                {log.status === 'info' && '🔵 '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
