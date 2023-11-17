require("dotenv").config();
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.oxcytech.com",
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  transporter,
  generateVerificationToken,
};
