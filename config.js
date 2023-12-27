// config.js

require("dotenv").config();

const config = {
  development: {
    verificationLink: `https://prod.decision168.com/`,
  },
  local: {
    verificationLink: `http://localhost:5173/`,
  },
  production: {
    verificationLink: process.env.PRODUCTION || "",
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
