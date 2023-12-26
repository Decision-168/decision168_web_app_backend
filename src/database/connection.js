const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "db-decesion-168.czkxgo85sren.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "Decesion_168",
  database: "decision168",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
});

pool
  .getConnection()
  .then((connection) => {
   
    connection.release();
  })
  .catch((error) => {
  
  });

module.exports = pool;
