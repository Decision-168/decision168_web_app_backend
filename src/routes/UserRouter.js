require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const bcrypt = require("bcrypt");
const { isEmail } = require("validator");
const generateEmailTemplate = require("../utils/emailTemplate");
const {
  generateVerificationToken,
  transporter,
} = require("../utils/verification");
const generateToken = require("../utils/auth");

//User RegistrationSS
router.post("/user/register", async (req, res) => {
  try {
    let { full_name, email_address, password } = req.body;

    if (!isEmail(email_address)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    const nameParts = full_name.split(" ");
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

    delete req.body.full_name;
    const verificationToken = generateVerificationToken();
    const currentDate = new Date();
    const formattedDate = currentDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const additionalFields = {
      verification_code: verificationToken,
      verified: "no",
      first_name,
      middle_name,
      last_name,
      login_password: password,
      reg_date: formattedDate,
      msg_flag: 0,
      reg_acc_status: "activated",
      package_id: 1,
      package_start: formattedDate,
      package_expiry: "free_forever",
    };

    const requestBodyWithAdditionalFields = {
      ...req.body,
      ...additionalFields,
    };

    if (requestBodyWithAdditionalFields.password) {
      const hashedPassword = await bcrypt.hash(
        requestBodyWithAdditionalFields.password,
        10
      );
      requestBodyWithAdditionalFields.password = hashedPassword;
    }

    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertRegistration(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const verificationLink = `http://localhost:3000/user/verify/${verificationToken}`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email_address,
      subject: "Email Verification",
      html: generateEmailTemplate(
        `Hello ${full_name}! Your Decision168 account's verification link is provided below:`,
        `Click <a href="${verificationLink}">here</a> to verify your email address.`
      ),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).json({ error: "Failed to send verification email." });
      } else {
        res.status(201).json({
          message: "Registration successful. Verification email sent.",
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//User Verification
router.get("/user/verify/:token", async (req, res) => {
  const token = req.params.token;
  try {
    const [rows] = await pool.execute("CALL verifyUser(?)", [token]);

    if (rows && rows[0] && rows[0][0]) {
      const user = rows[0][0];
      const userId = user.reg_id;
      const dynamicFieldsValues = `verified = 'yes'`;
      const id = `reg_id  = '${userId}'`;
      await pool.execute("CALL UpdateRegistration(?, ?)", [
        dynamicFieldsValues,
        id,
      ]);
      return res
        .status(200)
        .json({ message: "Email verification successful." });
    } else {
      return res
        .status(400)
        .json({ error: "Invalid token or user not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//User Login
router.post("/user/login", async (req, res) => {
  const { email_address, password } = req.body;
  try {
    const [data] = await pool.execute("CALL selectLogin(?)", [email_address]);
    if (data[0][0]?.verified === "no") {
      return res.status(401).json({ error: "Email not verified." });
    }
    const passwordMatch = await bcrypt.compare(password, data[0][0]?.password);
    if (passwordMatch) {
      const token = generateToken(data[0][0].reg_id);
      await pool.execute("CALL checkLogin(?,?)", [
        email_address,
        passwordMatch,
      ]);
      res.status(201).json({ message: "Login successful.", token });
    } else {
      res.status(401).json({ error: "Incorrect password." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//User Reset-Password
router.post("/user/forgot-password", async (req, res) => {
  const { email_address } = req.body;
  try {
    const [rows] = await pool.execute("CALL forgotPassword(?)", [
      email_address,
    ]);
    const userId = rows[0][0]?.reg_id;
    const userName = rows[0][0]?.first_name;
    const resetPasswordLink = `http://localhost:3000/user/change-password/${userId}`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email_address,
      subject: "Reset Password",
      html: generateEmailTemplate(
        `Hello ${userName}! Your Decision168 account's Reset Password link is provided below:`,
        `Click <a href="${resetPasswordLink}">here</a> to Reset your password.`
      ),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).json({ error: "Failed to send verification email." });
      } else {
        res.status(201).json({
          message: "Reset Link has been send on your Registered Email Address.",
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.patch("/user/change-password/:id", async (req, res) => {
  const { password } = req.body;
  try {
    const userId = req.params.id;

    if (userId) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const dynamicFieldsValues = `password = '${hashedPassword}', login_password = '${password}'`;
      const id = `reg_id  = '${userId}'`;
      await pool.execute("CALL UpdateRegistration(?, ?)", [
        dynamicFieldsValues,
        id,
      ]);
      res.status(201).json({ message: "Password reset successfully." });
    } else {
      return res
        .status(400)
        .json({ error: "Invalid token or user not found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
