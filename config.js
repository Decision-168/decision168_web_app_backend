// config.js

require("dotenv").config();

const config = {
  development: {
    verificationLink: `http://decesion168-s3-cicd.s3-website-us-east-1.amazonaws.com/`,
  },
  local: {
    verificationLink: `http://localhost:5173/`,
  },
  production: {
    verificationLink: process.env.PRODUCTION || "",
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
