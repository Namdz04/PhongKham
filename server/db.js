const sql = require('mssql');
require('dotenv').config();

const isTrusted = process.env.DB_TRUSTED_CONNECTION === 'true';
const dbName = process.env.DB_DATABASE || 'PhongKhamDB';
const serverName = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';

const config = isTrusted
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

let poolPromise;

function getPool() {
  if (!poolPromise) {
    const mssqlClient = isTrusted ? require('mssql/msnodesqlv8') : sql;
    poolPromise = mssqlClient.connect(config)
      .then(pool => {
        console.log('Connected to SQL Server successfully.');
        return pool;
      })
      .catch(err => {
        console.error('Database Connection Failed! ', err);
        poolPromise = null; // Reset so next call will retry
        throw err;
      });
  }
  return poolPromise;
}

module.exports = {
  sql,
  getPool,
  config
};
