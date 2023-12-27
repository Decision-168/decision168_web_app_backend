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

const nameSplit = (name) => {
  const nameParts = name.split(" ");
  let first_name = "";
  let middle_name = "";
  let last_name = "";

  if (nameParts.length === 1) {
    first_name = nameParts[0];
  } else if (nameParts.length === 2) {
    first_name = nameParts[0];
    last_name = nameParts[1];
  } else if (nameParts.length >= 3) {
    first_name = nameParts[0];
    middle_name = nameParts.slice(1, -1).join(" ");
    last_name = nameParts[nameParts.length - 1];
  }

  return { first_name, middle_name, last_name };
};

const dateConversion = () => {
  const currentDate = new Date();
  const formattedDate = currentDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  return formattedDate;
};

// Function to convert dynamic object to stored procedure parameters
function convertObjectToProcedureParams(data) {
  // Check if data is defined and not null
  if (data === undefined || data === null) {
    return null; // or return a default value if needed
  }

  // Extract the keys and values from the object
  const entries = Object.entries(data);

  // Convert each entry to the desired format
  const formattedEntries = entries.map(([key, value]) => `${key} = "${value}"`);

  // Join the formatted entries with commas
  const formattedParams = formattedEntries.join(", ");

  return formattedParams;
}

module.exports = {
  transporter,
  generateVerificationToken,
  nameSplit,
  dateConversion,
  convertObjectToProcedureParams,
};
