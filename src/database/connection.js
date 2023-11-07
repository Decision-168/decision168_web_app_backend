// require("dotenv").config();
// const mongoose = require("mongoose");

// // Use environment variable to get the MongoDB connection URL
// const url =
//   process.env.NODE_ENV === "production"
//     ? process.env.MONGODB_URL_PROD
//     : process.env.MONGODB_URL_DEV;

// mongoose
//   .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log("Connected Successfully to MongoDB");
//   })
//   .catch((err) => {
//     console.error("Error connecting to MongoDB:", err);
//   });

// module.exports = mongoose.connection;

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "decision168",
});

module.exports = pool;
