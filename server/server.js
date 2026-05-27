const express = require('express');
const cors = require('cors');
const { getPool, sql } = require('./db');
const { resetDatabase } = require('./dbInit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to query the pool
async function query(sqlQuery, params = {}) {
  const pool = await getPool();
  const request = pool.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }
  return request.query(sqlQuery);
}

// ================= AUTH API =================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username và password.' });
  }

  const trimmedUsername = username.trim().toLowerCase();

  try {
    // 1. Check in Users table
    const userResult = await query(
      'SELECT * FROM Users WHERE LOWER(username) = @username',
      { username: trimmedUsername }
    );

    if (userResult.recordset.length > 0) {
      const dbUser = userResult.recordset[0];
      if (dbUser.password === password) {
        return res.json({
          success: true,
          user: {
            username: dbUser.username,
            name: dbUser.name,
            role: dbUser.role,
            id: dbUser.refId || dbUser.id
          }
        });
      }
    }

    // 2. Custom check for doctors added dynamically
    if (trimmedUsername.startsWith('doc_') || trimmedUsername.includes('@phongkham.vn')) {
      const docResult = await query(
        'SELECT * FROM Doctors WHERE LOWER(id) = @id OR LOWER(email) = @email',
        { id: trimmedUsername, email: trimmedUsername }
      );
      if (docResult.recordset.length > 0 && password === 'doctor123') {
        const doctor = docResult.recordset[0];
        return res.json({
          success: true,
          user: {
            username: doctor.email,
            name: doctor.name,
            role: 'doctor',
            id: doctor.id
          }
        });
      }
    }

    // 3. Custom check for patients added dynamically
    const patientResult = await query(
      'SELECT * FROM Patients WHERE LOWER(id) = @id OR LOWER(email) = @email OR phone = @phone',
      { id: trimmedUsername, email: trimmedUsername, phone: username.trim() }
    );
    if (patientResult.recordset.length > 0 && password === 'patient123') {
      const patient = patientResult.recordset[0];
      return res.json({
        success: true,
        user: {
          username: patient.email || patient.phone,
          name: patient.name,
          role: 'patient',
          id: patient.id
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Sai tên đăng nhập hoặc mật khẩu! Gợi ý: admin/admin123, doctor/doctor123, patient/patient123'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình đăng nhập.' });
  }
});


// ================= PATIENTS API =================
app.get('/api/patients', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Patients ORDER BY id DESC');
    // Format dob to YYYY-MM-DD
    const patients = result.recordset.map(p => ({
      ...p,
      dob: p.dob ? p.dob.toISOString().split('T')[0] : null
    }));
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách bệnh nhân.' });
  }
});

app.post('/api/patients', async (req, res) => {
  const { name, dob, gender, phone, email, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Tên bệnh nhân là bắt buộc.' });
  }
  const id = `pat_${Date.now()}`;
  try {
    await query(
      'INSERT INTO Patients (id, name, dob, gender, phone, email, address) VALUES (@id, @name, @dob, @gender, @phone, @email, @address)',
      { id, name, dob: dob || null, gender: gender || null, phone: phone || null, email: email || null, address: address || null }
    );

    // Fetch and return the newly created patient
    const result = await query('SELECT * FROM Patients WHERE id = @id', { id });
    const newPatient = result.recordset[0];
    newPatient.dob = newPatient.dob ? newPatient.dob.toISOString().split('T')[0] : null;
    res.status(201).json(newPatient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Lỗi tạo bệnh nhân.' });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, dob, gender, phone, email, address } = req.body;
  try {
    await query(
      'UPDATE Patients SET name = @name, dob = @dob, gender = @gender, phone = @phone, email = @email, address = @address WHERE id = @id',
      { id, name, dob: dob || null, gender: gender || null, phone: phone || null, email: email || null, address: address || null }
    );

    // Cascade update names in Appointments and MedicalRecords
    await query('UPDATE Appointments SET patientName = @name WHERE patientId = @id', { id, name });
    await query('UPDATE MedicalRecords SET patientName = @name WHERE patientId = @id', { id, name });

    const result = await query('SELECT * FROM Patients WHERE id = @id', { id });
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh nhân.' });
    }
    const updatedPatient = result.recordset[0];
    updatedPatient.dob = updatedPatient.dob ? updatedPatient.dob.toISOString().split('T')[0] : null;
    res.json(updatedPatient);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Lỗi cập nhật bệnh nhân.' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete patient will automatically delete related records due to ON DELETE CASCADE
    const result = await query('DELETE FROM Patients WHERE id = @id', { id });
    res.json({ success: true, message: 'Đã xóa bệnh nhân.' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Lỗi xóa bệnh nhân.' });
  }
});

app.post('/api/patients/import', async (req, res) => {
  const { patients } = req.body;
  if (!Array.isArray(patients)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu import không hợp lệ.' });
  }

  try {
    let count = 0;
    for (const p of patients) {
      const id = p.id || `pat_${Date.now()}_${count}`;
      const name = p.name;
      const dob = p.dob || '1990-01-01';
      const gender = p.gender || 'Khác';
      const phone = p.phone || '';
      const email = p.email || '';
      const address = p.address || '';

      // Check if duplicate phone or email exists
      let checkResult;
      if (phone || email) {
        checkResult = await query(
          'SELECT COUNT(*) as count FROM Patients WHERE (phone = @phone AND @phone <> \'\') OR (email = @email AND @email <> \'\')',
          { phone, email }
        );
      }

      if (!checkResult || checkResult.recordset[0].count === 0) {
        await query(
          'INSERT INTO Patients (id, name, dob, gender, phone, email, address) VALUES (@id, @name, @dob, @gender, @phone, @email, @address)',
          { id, name, dob, gender, phone, email, address }
        );
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (error) {
    console.error('Import patients error:', error);
    res.status(500).json({ success: false, message: 'Lỗi import bệnh nhân.' });
  }
});


// ================= DOCTORS API =================
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Doctors ORDER BY id DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ.' });
  }
});

app.post('/api/doctors', async (req, res) => {
  const { name, specialty, phone, email, room } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Tên bác sĩ là bắt buộc.' });
  }
  const id = `doc_${Date.now()}`;
  try {
    await query(
      'INSERT INTO Doctors (id, name, specialty, phone, email, room) VALUES (@id, @name, @specialty, @phone, @email, @room)',
      { id, name, specialty: specialty || null, phone: phone || null, email: email || null, room: room || null }
    );

    const result = await query('SELECT * FROM Doctors WHERE id = @id', { id });
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ message: 'Lỗi tạo bác sĩ.' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, specialty, phone, email, room } = req.body;
  try {
    await query(
      'UPDATE Doctors SET name = @name, specialty = @specialty, phone = @phone, email = @email, room = @room WHERE id = @id',
      { id, name, specialty: specialty || null, phone: phone || null, email: email || null, room: room || null }
    );

    // Cascade update names in Appointments and MedicalRecords
    await query('UPDATE Appointments SET doctorName = @name WHERE doctorId = @id', { id, name });
    await query('UPDATE MedicalRecords SET doctorName = @name WHERE doctorId = @id', { id, name });

    const result = await query('SELECT * FROM Doctors WHERE id = @id', { id });
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bác sĩ.' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ message: 'Lỗi cập nhật bác sĩ.' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM Doctors WHERE id = @id', { id });
    res.json({ success: true, message: 'Đã xóa bác sĩ.' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ message: 'Lỗi xóa bác sĩ.' });
  }
});


// ================= APPOINTMENTS API =================
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Appointments ORDER BY id DESC');
    const appointments = result.recordset.map(a => ({
      ...a,
      date: a.date ? a.date.toISOString().split('T')[0] : null
    }));
    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách lịch khám.' });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { patientId, patientName, doctorId, doctorName, date, time, symptoms, specialty, status } = req.body;
  if (!patientId || !doctorId) {
    return res.status(400).json({ message: 'Bệnh nhân và bác sĩ là bắt buộc.' });
  }
  const id = `apt_${Date.now()}`;
  try {
    await query(
      'INSERT INTO Appointments (id, patientId, patientName, doctorId, doctorName, date, time, symptoms, specialty, status) VALUES (@id, @patientId, @patientName, @doctorId, @doctorName, @date, @time, @symptoms, @specialty, @status)',
      { id, patientId, patientName, doctorId, doctorName, date: date || null, time: time || null, symptoms: symptoms || null, specialty: specialty || null, status: status || 'Chờ khám' }
    );

    const result = await query('SELECT * FROM Appointments WHERE id = @id', { id });
    const newApt = result.recordset[0];
    newApt.date = newApt.date ? newApt.date.toISOString().split('T')[0] : null;
    res.status(201).json(newApt);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Lỗi tạo lịch khám.' });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await query('UPDATE Appointments SET status = @status WHERE id = @id', { id, status });

    const result = await query('SELECT * FROM Appointments WHERE id = @id', { id });
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch khám.' });
    }
    const updatedApt = result.recordset[0];
    updatedApt.date = updatedApt.date ? updatedApt.date.toISOString().split('T')[0] : null;
    res.json(updatedApt);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Lỗi cập nhật lịch khám.' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM Appointments WHERE id = @id', { id });
    res.json({ success: true, message: 'Đã xóa lịch khám.' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Lỗi xóa lịch khám.' });
  }
});


// ================= MEDICAL RECORDS API =================
app.get('/api/medical-records', async (req, res) => {
  try {
    const result = await query('SELECT * FROM MedicalRecords ORDER BY id DESC');
    const records = result.recordset.map(r => ({
      ...r,
      date: r.date ? r.date.toISOString().split('T')[0] : null
    }));
    res.json(records);
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách hồ sơ bệnh án.' });
  }
});

app.post('/api/medical-records', async (req, res) => {
  const { patientId, patientName, doctorId, doctorName, date, symptoms, diagnosis, treatment, prescription } = req.body;
  if (!patientId || !doctorId) {
    return res.status(400).json({ message: 'Bệnh nhân và bác sĩ là bắt buộc.' });
  }
  const id = `mr_${Date.now()}`;
  const recordDate = date || new Date().toISOString().split('T')[0];

  try {
    await query(
      'INSERT INTO MedicalRecords (id, patientId, patientName, doctorId, doctorName, date, symptoms, diagnosis, treatment, prescription) VALUES (@id, @patientId, @patientName, @doctorId, @doctorName, @date, @symptoms, @diagnosis, @treatment, @prescription)',
      { id, patientId, patientName, doctorId, doctorName, date: recordDate, symptoms: symptoms || null, diagnosis: diagnosis || null, treatment: treatment || null, prescription: prescription || null }
    );

    const result = await query('SELECT * FROM MedicalRecords WHERE id = @id', { id });
    const newRecord = result.recordset[0];
    newRecord.date = newRecord.date ? newRecord.date.toISOString().split('T')[0] : null;
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ message: 'Lỗi tạo hồ sơ bệnh án.' });
  }
});

app.put('/api/medical-records/:id', async (req, res) => {
  const { id } = req.params;
  const { symptoms, diagnosis, treatment, prescription } = req.body;
  try {
    await query(
      'UPDATE MedicalRecords SET symptoms = @symptoms, diagnosis = @diagnosis, treatment = @treatment, prescription = @prescription WHERE id = @id',
      { id, symptoms: symptoms || null, diagnosis: diagnosis || null, treatment: treatment || null, prescription: prescription || null }
    );

    const result = await query('SELECT * FROM MedicalRecords WHERE id = @id', { id });
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ bệnh án.' });
    }
    const updatedRecord = result.recordset[0];
    updatedRecord.date = updatedRecord.date ? updatedRecord.date.toISOString().split('T')[0] : null;
    res.json(updatedRecord);
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ message: 'Lỗi cập nhật hồ sơ bệnh án.' });
  }
});

app.delete('/api/medical-records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM MedicalRecords WHERE id = @id', { id });
    res.json({ success: true, message: 'Đã xóa hồ sơ bệnh án.' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({ message: 'Lỗi xóa hồ sơ bệnh án.' });
  }
});


// ================= DB RESET API =================
app.post('/api/db/reset', async (req, res) => {
  try {
    await resetDatabase();
    res.json({ success: true, message: 'Đã thiết lập lại dữ liệu mẫu thành công.' });
  } catch (error) {
    console.error('Reset database API error:', error);
    res.status(500).json({ success: false, message: 'Lỗi thiết lập lại cơ sở dữ liệu.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
