// utils/auth.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;
const generateToken = (id) => {
  const payload = {
    id: id,
  };
  const token = jwt.sign(payload, secretKey, { expiresIn: "90d" });
  return token;
};

module.exports = generateToken;
