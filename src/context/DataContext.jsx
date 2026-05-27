import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();
const API_BASE_URL = 'http://localhost:5000/api';

export const DataProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resPatients, resDoctors, resAppointments, resMedicalRecords] = await Promise.all([
          fetch(`${API_BASE_URL}/patients`).then(r => { if (!r.ok) throw new Error('Patients failed'); return r.json(); }),
          fetch(`${API_BASE_URL}/doctors`).then(r => { if (!r.ok) throw new Error('Doctors failed'); return r.json(); }),
          fetch(`${API_BASE_URL}/appointments`).then(r => { if (!r.ok) throw new Error('Appointments failed'); return r.json(); }),
          fetch(`${API_BASE_URL}/medical-records`).then(r => { if (!r.ok) throw new Error('Medical records failed'); return r.json(); })
        ]);

        setPatients(resPatients);
        setDoctors(resDoctors);
        setAppointments(resAppointments);
        setMedicalRecords(resMedicalRecords);
      } catch (err) {
        console.error('Error fetching data from API:', err);
        setError('Không thể kết nối tới cơ sở dữ liệu SQL Server. Vui lòng kiểm tra lại backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= CRUD BỆNH NHÂN =================
  const addPatient = async (patientData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (!res.ok) throw new Error('Lỗi khi thêm bệnh nhân.');
      const newPatient = await res.json();
      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const updatePatient = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Lỗi khi cập nhật bệnh nhân.');
      const updated = await res.json();
      setPatients(prev => prev.map(p => p.id === id ? updated : p));
      
      // Update names in state
      setAppointments(prev => prev.map(a => a.patientId === id ? { ...a, patientName: updated.name } : a));
      setMedicalRecords(prev => prev.map(m => m.patientId === id ? { ...m, patientName: updated.name } : m));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const deletePatient = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Lỗi khi xóa bệnh nhân.');
      setPatients(prev => prev.filter(p => p.id !== id));
      setAppointments(prev => prev.filter(a => a.patientId !== id));
      setMedicalRecords(prev => prev.filter(m => m.patientId !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ================= CRUD BÁC SĨ =================
  const addDoctor = async (doctorData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
      if (!res.ok) throw new Error('Lỗi khi thêm bác sĩ.');
      const newDoctor = await res.json();
      setDoctors(prev => [newDoctor, ...prev]);
      return newDoctor;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const updateDoctor = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Lỗi khi cập nhật bác sĩ.');
      const updated = await res.json();
      setDoctors(prev => prev.map(d => d.id === id ? updated : d));
      
      // Update names in state
      setAppointments(prev => prev.map(a => a.doctorId === id ? { ...a, doctorName: updated.name } : a));
      setMedicalRecords(prev => prev.map(m => m.doctorId === id ? { ...m, doctorName: updated.name } : m));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const deleteDoctor = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Lỗi khi xóa bác sĩ.');
      setDoctors(prev => prev.filter(d => d.id !== id));
      setAppointments(prev => prev.filter(a => a.doctorId !== id));
      setMedicalRecords(prev => prev.filter(m => m.doctorId !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ================= CRUD LỊCH KHÁM =================
  const addAppointment = async (aptData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aptData)
      });
      if (!res.ok) throw new Error('Lỗi khi thêm lịch khám.');
      const newApt = await res.json();
      setAppointments(prev => [newApt, ...prev]);
      return newApt;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Lỗi khi cập nhật trạng thái lịch khám.');
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Lỗi khi xóa lịch khám.');
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ================= CRUD HỒ SƠ BỆNH ÁN =================
  const addMedicalRecord = async (recordData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (!res.ok) throw new Error('Lỗi khi thêm hồ sơ bệnh án.');
      const newRecord = await res.json();
      setMedicalRecords(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const updateMedicalRecord = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/medical-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Lỗi khi cập nhật hồ sơ bệnh án.');
      const updated = await res.json();
      setMedicalRecords(prev => prev.map(m => m.id === id ? updated : m));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const deleteMedicalRecord = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/medical-records/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Lỗi khi xóa hồ sơ bệnh án.');
      setMedicalRecords(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ================= IMPORT / EXPORT DỮ LIỆU =================
  const importPatientsJSON = async (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!Array.isArray(parsed)) throw new Error('Dữ liệu import phải là một mảng.');
      
      const res = await fetch(`${API_BASE_URL}/patients/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients: parsed })
      });
      if (!res.ok) throw new Error('Lỗi khi import bệnh nhân.');
      const data = await res.json();

      // Refresh list
      const updatedPatientsRes = await fetch(`${API_BASE_URL}/patients`);
      const updatedPatients = await updatedPatientsRes.json();
      setPatients(updatedPatients);

      return { success: true, count: data.count };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const resetToSampleData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/db/reset`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Không thể reset database.');
      
      // Reload all
      const [resPatients, resDoctors, resAppointments, resMedicalRecords] = await Promise.all([
        fetch(`${API_BASE_URL}/patients`).then(r => r.json()),
        fetch(`${API_BASE_URL}/doctors`).then(r => r.json()),
        fetch(`${API_BASE_URL}/appointments`).then(r => r.json()),
        fetch(`${API_BASE_URL}/medical-records`).then(r => r.json())
      ]);

      setPatients(resPatients);
      setDoctors(resDoctors);
      setAppointments(resAppointments);
      setMedicalRecords(resMedicalRecords);
      alert('Đã thiết lập lại dữ liệu mẫu thành công!');
    } catch (err) {
      console.error(err);
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <DataContext.Provider value={{
      patients,
      doctors,
      appointments,
      medicalRecords,
      loading,
      error,
      addPatient,
      updatePatient,
      deletePatient,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      addAppointment,
      updateAppointmentStatus,
      deleteAppointment,
      addMedicalRecord,
      updateMedicalRecord,
      deleteMedicalRecord,
      importPatientsJSON,
      resetToSampleData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
