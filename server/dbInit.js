const sql = require('mssql');
require('dotenv').config();

const isTrusted = process.env.DB_TRUSTED_CONNECTION === 'true';
const dbName = process.env.DB_DATABASE || 'PhongKhamDB';
const serverName = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';

const masterConfig = isTrusted
  ? {
      connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=master;Trusted_Connection=yes;TrustServerCertificate=yes;`,
      driver: 'msnodesqlv8',
      options: {
        trustServerCertificate: true
      }
    }
  : {
      server: serverName,
      database: 'master',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      }
    };

// Data sets
const INITIAL_PATIENTS = [
  { id: 'pat_1', name: 'Trần Thị Mai', dob: '1990-05-15', gender: 'Nữ', phone: '0912345678', email: 'mai.tran@example.com', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội' },
  { id: 'pat_2', name: 'Nguyễn Văn Nam', dob: '1985-11-20', gender: 'Nam', phone: '0987654321', email: 'nam.nguyen@example.com', address: '456 Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
  { id: 'pat_3', name: 'Phạm Minh Khôi', dob: '2018-02-10', gender: 'Nam', phone: '0905556677', email: 'khoi.pham@example.com', address: '789 Trần Hưng Đạo, Hải Châu, Đà Nẵng' }
];

const INITIAL_DOCTORS = [
  { id: 'doc_1', name: 'BS. Nguyễn Văn An', specialty: 'Tim mạch', phone: '0933112233', email: 'an.nguyen@phongkham.vn', room: 'Phòng 101 - Khu A' },
  { id: 'doc_2', name: 'BS. Lê Thị Bình', specialty: 'Nhi khoa', phone: '0944223344', email: 'binh.le@phongkham.vn', room: 'Phòng 102 - Khu A' },
  { id: 'doc_3', name: 'BS. Trần Minh Đức', specialty: 'Tiêu hóa', phone: '0955334455', email: 'duc.tran@phongkham.vn', room: 'Phòng 201 - Khu B' },
  { id: 'doc_4', name: 'BS. Phạm Thanh Hằng', specialty: 'Da liễu', phone: '0966445566', email: 'hang.pham@phongkham.vn', room: 'Phòng 202 - Khu B' },
  { id: 'doc_5', name: 'BS. Vũ Hoàng Long', specialty: 'Cơ xương khớp', phone: '0977556677', email: 'long.vu@phongkham.vn', room: 'Phòng 301 - Khu C' }
];

const INITIAL_APPOINTMENTS = [
  { id: 'apt_1', patientId: 'pat_1', patientName: 'Trần Thị Mai', doctorId: 'doc_1', doctorName: 'BS. Nguyễn Văn An', date: '2026-05-26', time: '09:00', symptoms: 'Đau tức ngực, hồi hộp, tim đập nhanh', specialty: 'Tim mạch', status: 'Đã khám' },
  { id: 'apt_2', patientId: 'pat_2', patientName: 'Nguyễn Văn Nam', doctorId: 'doc_3', doctorName: 'BS. Trần Minh Đức', date: '2026-05-26', time: '14:30', symptoms: 'Đau dạ dày âm ỉ, trào ngược ợ chua', specialty: 'Tiêu hóa', status: 'Chờ khám' },
  { id: 'apt_3', patientId: 'pat_3', patientName: 'Phạm Minh Khôi', doctorId: 'doc_2', doctorName: 'BS. Lê Thị Bình', date: '2026-05-27', time: '08:30', symptoms: 'Quấy khóc, biếng ăn, sốt ở trẻ', specialty: 'Nhi khoa', status: 'Chờ khám' }
];

const INITIAL_MEDICAL_RECORDS = [
  { id: 'mr_1', patientId: 'pat_1', patientName: 'Trần Thị Mai', doctorId: 'doc_1', doctorName: 'BS. Nguyễn Văn An', date: '2026-05-26', symptoms: 'Đau tức ngực, hồi hộp, tim đập nhanh', diagnosis: 'Thiếu máu cơ tim cục bộ nhẹ', treatment: 'Nghỉ ngơi hợp lý, tránh stress, tái khám sau 1 tháng.', prescription: 'Aspirin 81mg - 1 viên/ngày (uống sau ăn sáng)\nAtorvastatin 10mg - 1 viên/ngày (uống trước khi đi ngủ)' }
];

const INITIAL_USERS = [
  { id: 'admin_sys', username: 'admin', password: 'admin123', name: 'Quản trị viên Hệ thống', role: 'admin', refId: null },
  { id: 'user_doc_1', username: 'doctor', password: 'doctor123', name: 'BS. Nguyễn Văn An', role: 'doctor', refId: 'doc_1' },
  { id: 'user_pat_1', username: 'patient', password: 'patient123', name: 'Trần Thị Mai', role: 'patient', refId: 'pat_1' }
];

async function initializeDatabase() {
  const mssqlClient = isTrusted ? require('mssql/msnodesqlv8') : sql;
  let pool;
  
  try {
    console.log('Connecting to SQL Server master database to check/create PhongKhamDB...');
    pool = await mssqlClient.connect(masterConfig);
    
    // Check if database exists
    const dbCheckResult = await pool.request()
      .query(`SELECT database_id FROM sys.databases WHERE name = '${dbName}'`);
      
    if (dbCheckResult.recordset.length === 0) {
      console.log(`Database "${dbName}" not found. Creating database...`);
      await pool.request().query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
    
    await pool.close();
    
    // Now connect to the new/existing database
    const appConfig = isTrusted
      ? {
          connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;TrustServerCertificate=yes;`,
          driver: 'msnodesqlv8',
          options: {
            trustServerCertificate: true
          }
        }
      : {
          server: serverName,
          database: dbName,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          options: {
            encrypt: false,
            trustServerCertificate: true,
          }
        };

    console.log(`Connecting directly to database "${dbName}" to setup tables...`);
    pool = await mssqlClient.connect(appConfig);
    
    // Create Patients table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Patients' AND xtype='U')
      BEGIN
          CREATE TABLE Patients (
              id VARCHAR(50) PRIMARY KEY,
              name NVARCHAR(100) NOT NULL,
              dob DATE,
              gender NVARCHAR(20),
              phone VARCHAR(20),
              email VARCHAR(100),
              address NVARCHAR(255)
          );
      END
    `);
    console.log('Verified Patients table.');
    
    // Create Doctors table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Doctors' AND xtype='U')
      BEGIN
          CREATE TABLE Doctors (
              id VARCHAR(50) PRIMARY KEY,
              name NVARCHAR(100) NOT NULL,
              specialty NVARCHAR(100),
              phone VARCHAR(20),
              email VARCHAR(100),
              room NVARCHAR(100)
          );
      END
    `);
    console.log('Verified Doctors table.');
    
    // Create Appointments table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
      BEGIN
          CREATE TABLE Appointments (
              id VARCHAR(50) PRIMARY KEY,
              patientId VARCHAR(50) REFERENCES Patients(id) ON DELETE CASCADE,
              patientName NVARCHAR(100),
              doctorId VARCHAR(50) REFERENCES Doctors(id) ON DELETE CASCADE,
              doctorName NVARCHAR(100),
              date DATE,
              time VARCHAR(10),
              symptoms NVARCHAR(MAX),
              specialty NVARCHAR(100),
              status NVARCHAR(50)
          );
      END
    `);
    console.log('Verified Appointments table.');
    
    // Create MedicalRecords table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MedicalRecords' AND xtype='U')
      BEGIN
          CREATE TABLE MedicalRecords (
              id VARCHAR(50) PRIMARY KEY,
              patientId VARCHAR(50) REFERENCES Patients(id) ON DELETE CASCADE,
              patientName NVARCHAR(100),
              doctorId VARCHAR(50) REFERENCES Doctors(id) ON DELETE CASCADE,
              doctorName NVARCHAR(100),
              date DATE,
              symptoms NVARCHAR(MAX),
              diagnosis NVARCHAR(MAX),
              treatment NVARCHAR(MAX),
              prescription NVARCHAR(MAX)
          );
      END
    `);
    console.log('Verified MedicalRecords table.');
    
    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      BEGIN
          CREATE TABLE Users (
              id VARCHAR(50) PRIMARY KEY,
              username VARCHAR(100) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              name NVARCHAR(100),
              role VARCHAR(20),
              refId VARCHAR(50)
          );
      END
    `);
    console.log('Verified Users table.');

    console.log('Seeding initial data...');
    await seedData(pool);
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function seedData(pool) {
  // Check if Patients table is empty
  const patientCount = await pool.request().query('SELECT COUNT(*) as count FROM Patients');
  if (patientCount.recordset[0].count === 0) {
    console.log('Seeding Patients...');
    for (const p of INITIAL_PATIENTS) {
      await pool.request()
        .input('id', sql.VarChar(50), p.id)
        .input('name', sql.NVarChar(100), p.name)
        .input('dob', sql.Date, p.dob)
        .input('gender', sql.NVarChar(20), p.gender)
        .input('phone', sql.VarChar(20), p.phone)
        .input('email', sql.VarChar(100), p.email)
        .input('address', sql.NVarChar(255), p.address)
        .query('INSERT INTO Patients (id, name, dob, gender, phone, email, address) VALUES (@id, @name, @dob, @gender, @phone, @email, @address)');
    }
  }

  // Check if Doctors table is empty
  const doctorCount = await pool.request().query('SELECT COUNT(*) as count FROM Doctors');
  if (doctorCount.recordset[0].count === 0) {
    console.log('Seeding Doctors...');
    for (const d of INITIAL_DOCTORS) {
      await pool.request()
        .input('id', sql.VarChar(50), d.id)
        .input('name', sql.NVarChar(100), d.name)
        .input('specialty', sql.NVarChar(100), d.specialty)
        .input('phone', sql.VarChar(20), d.phone)
        .input('email', sql.VarChar(100), d.email)
        .input('room', sql.NVarChar(100), d.room)
        .query('INSERT INTO Doctors (id, name, specialty, phone, email, room) VALUES (@id, @name, @specialty, @phone, @email, @room)');
    }
  }

  // Check if Appointments table is empty
  const aptCount = await pool.request().query('SELECT COUNT(*) as count FROM Appointments');
  if (aptCount.recordset[0].count === 0) {
    console.log('Seeding Appointments...');
    for (const a of INITIAL_APPOINTMENTS) {
      await pool.request()
        .input('id', sql.VarChar(50), a.id)
        .input('patientId', sql.VarChar(50), a.patientId)
        .input('patientName', sql.NVarChar(100), a.patientName)
        .input('doctorId', sql.VarChar(50), a.doctorId)
        .input('doctorName', sql.NVarChar(100), a.doctorName)
        .input('date', sql.Date, a.date)
        .input('time', sql.VarChar(10), a.time)
        .input('symptoms', sql.NVarChar(sql.MAX), a.symptoms)
        .input('specialty', sql.NVarChar(100), a.specialty)
        .input('status', sql.NVarChar(50), a.status)
        .query('INSERT INTO Appointments (id, patientId, patientName, doctorId, doctorName, date, time, symptoms, specialty, status) VALUES (@id, @patientId, @patientName, @doctorId, @doctorName, @date, @time, @symptoms, @specialty, @status)');
    }
  }

  // Check if MedicalRecords table is empty
  const mrCount = await pool.request().query('SELECT COUNT(*) as count FROM MedicalRecords');
  if (mrCount.recordset[0].count === 0) {
    console.log('Seeding Medical Records...');
    for (const m of INITIAL_MEDICAL_RECORDS) {
      await pool.request()
        .input('id', sql.VarChar(50), m.id)
        .input('patientId', sql.VarChar(50), m.patientId)
        .input('patientName', sql.NVarChar(100), m.patientName)
        .input('doctorId', sql.VarChar(50), m.doctorId)
        .input('doctorName', sql.NVarChar(100), m.doctorName)
        .input('date', sql.Date, m.date)
        .input('symptoms', sql.NVarChar(sql.MAX), m.symptoms)
        .input('diagnosis', sql.NVarChar(sql.MAX), m.diagnosis)
        .input('treatment', sql.NVarChar(sql.MAX), m.treatment)
        .input('prescription', sql.NVarChar(sql.MAX), m.prescription)
        .query('INSERT INTO MedicalRecords (id, patientId, patientName, doctorId, doctorName, date, symptoms, diagnosis, treatment, prescription) VALUES (@id, @patientId, @patientName, @doctorId, @doctorName, @date, @symptoms, @diagnosis, @treatment, @prescription)');
    }
  }

  // Check if Users table is empty
  const userCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
  if (userCount.recordset[0].count === 0) {
    console.log('Seeding Users...');
    for (const u of INITIAL_USERS) {
      await pool.request()
        .input('id', sql.VarChar(50), u.id)
        .input('username', sql.VarChar(100), u.username)
        .input('password', sql.VarChar(255), u.password)
        .input('name', sql.NVarChar(100), u.name)
        .input('role', sql.VarChar(20), u.role)
        .input('refId', sql.VarChar(50), u.refId)
        .query('INSERT INTO Users (id, username, password, name, role, refId) VALUES (@id, @username, @password, @name, @role, @refId)');
    }
  }
}

async function resetDatabase() {
  const mssqlClient = isTrusted ? require('mssql/msnodesqlv8') : sql;
  const appConfig = isTrusted
    ? {
        connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;TrustServerCertificate=yes;`,
        driver: 'msnodesqlv8',
        options: {
          trustServerCertificate: true
        }
      }
    : {
        server: serverName,
        database: dbName,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        }
      };

  let pool;
  try {
    pool = await mssqlClient.connect(appConfig);
    console.log('Resetting all tables...');
    await pool.request().query('DELETE FROM MedicalRecords');
    await pool.request().query('DELETE FROM Appointments');
    await pool.request().query('DELETE FROM Patients');
    await pool.request().query('DELETE FROM Doctors');
    await pool.request().query('DELETE FROM Users');
    
    console.log('Seeding fresh mock data...');
    await seedData(pool);
    console.log('Database reset completed.');
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

module.exports = {
  initializeDatabase,
  resetDatabase
};

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
