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

const generateOTP = () => {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

// const insertOTP = async (email, otp) => {
//   try {
//     const expiryDate = new Date();
//      expiryDate.setHours(expiryDate.getHours() + 1);
//     const otpData = {
//       email,
//       otp: otp.toString(),
//       expiryDate,
//     };
//     await OTPModel.create(otpData);
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

// const verifyOTP = async (email, otp) => {
//   try {
//     const storedOTP = await OTPModel.findOne({ email });
//     if (storedOTP) {
//       return storedOTP.otp === otp;
//     } else {
//       throw new Error("OTP not found for the given email");
//     }
//   } catch (error) {
//     throw new Error("Failed to verify OTP");
//   }
// };


const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Function to convert dynamic object to stored procedure parameters
function convertObjectToProcedureParams(data) {
  // Check if data is defined and not null
  if (data === undefined || data === null) {
    console.error('Invalid data object:', data);
    return null; // or return a default value if needed
  }

  // Extract the keys and values from the object
  const entries = Object.entries(data);

  // Convert each entry to the desired format
  const formattedEntries = entries.map(([key, value]) => `${key} = "${value}"`);

  // Join the formatted entries with commas
  const formattedParams = formattedEntries.join(', ');

  return formattedParams;
}

module.exports = {
  transporter,
  generateOTP,
  // insertOTP,
  // verifyOTP,
  generateVerificationToken,
  convertObjectToProcedureParams
};
