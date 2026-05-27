import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Giả lập độ trễ đăng nhập một chút cho chuyên nghiệp
      await new Promise(resolve => setTimeout(resolve, 600));
      const res = await login(username, password);
      setLoading(false);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setLoading(false);
      setError('Đăng nhập thất bại do lỗi hệ thống.');
    }
  };

  // Điền nhanh thông tin đăng nhập demo để kiểm thử nhanh chóng
  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'doctor') {
      setUsername('doctor');
      setPassword('doctor123');
    } else if (role === 'patient') {
      setUsername('patient');
      setPassword('patient123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">🏥</div>
          <h2>Hệ Thống Phòng Khám</h2>
          <p>Đăng nhập để tiếp tục làm việc hoặc đặt lịch khám bệnh</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập / Số điện thoại / Email</label>
            <input
              id="username"
              type="text"
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="quick-login-section">
          <p>Đăng nhập nhanh với tài khoản Demo:</p>
          <div className="quick-login-buttons">
            <button 
              type="button" 
              onClick={() => handleQuickLogin('admin')}
              className="btn-quick-login admin-color"
              title="Tài khoản Quản trị hệ thống"
            >
              🔑 Admin
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickLogin('doctor')}
              className="btn-quick-login doctor-color"
              title="Tài khoản Bác sĩ khám chữa bệnh"
            >
              🥼 Bác sĩ
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickLogin('patient')}
              className="btn-quick-login patient-color"
              title="Tài khoản Bệnh nhân đặt lịch"
            >
              👤 Bệnh nhân
            </button>
          </div>
          <small className="help-text">Mật khẩu tương ứng là: [tên_đăng_nhập]123 (Ví dụ: admin123)</small>
        </div>
      </div>
    </div>
  );
}
