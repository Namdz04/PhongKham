const { initializeDatabase } = require('./dbInit');

console.log('Testing connection to SQL Server...');
initializeDatabase()
  .then(() => {
    console.log('\nSUCCESS: Connected to SQL Server and database has been verified/initialized!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nERROR: Failed to connect or initialize SQL Server.');
    console.error('Details of error below:');
    console.error(err);
    process.exit(1);
  });
