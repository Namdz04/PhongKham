import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE_URL = 'http://localhost:5000/api';

const PRESET_USERS = {
  admin: {
    username: 'admin',
    name: 'Quản trị viên Hệ thống',
    role: 'admin',
    id: 'admin_sys'
  },
  doctor: {
    username: 'doctor',
    name: 'BS. Nguyễn Văn An',
    role: 'doctor',
    id: 'doc_1'
  },
  patient: {
    username: 'patient',
    name: 'Trần Thị Mai',
    role: 'patient',
    id: 'pat_1'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pk_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('pk_current_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Sai tên đăng nhập hoặc mật khẩu!' };
      }
    } catch (error) {
      console.error('Auth error:', error);
      return { success: false, message: 'Không thể kết nối đến máy chủ xác thực.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pk_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, presetUsers: PRESET_USERS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
