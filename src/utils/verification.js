require("dotenv").config();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const OTPModel = require("../models/otp_model");

const transporter = nodemailer.createTransport({
  host: "mail.oxcytech.com",
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const generateOTP = () => {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const insertOTP = async (email, otp) => {
  try {
    const expiryDate = new Date();
     expiryDate.setHours(expiryDate.getHours() + 1);
    const otpData = {
      email,
      otp: otp.toString(),
      expiryDate,
    };
    await OTPModel.create(otpData);
    return true;
  } catch (error) {
    return false;
  }
};

const verifyOTP = async (email, otp) => {
  try {
    const storedOTP = await OTPModel.findOne({ email });
    if (storedOTP) {
      return storedOTP.otp === otp;
    } else {
      throw new Error("OTP not found for the given email");
    }
  } catch (error) {
    throw new Error("Failed to verify OTP");
  }
};


const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  transporter,
  generateOTP,
  insertOTP,
  verifyOTP,
  generateVerificationToken,
};
