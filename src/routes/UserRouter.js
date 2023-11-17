// const express = require("express");
// const router = express.Router();
// const pool = require("../database/connection"); // Import the database connection
// const bcrypt = require("bcrypt");
// const { isEmail } = require("validator");
// const generateToken = require("../utils/auth");
// const {
//   generateVerificationToken,
//   transporter,
//   generateOTP,
//   verifyOTP,
// } = require("../utils/verification");

// // Registration API
// router.post("/user/register", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!isEmail(email)) {
//       return res.status(400).json({ error: "Invalid email address." });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationToken = generateVerificationToken();

//     const [rows, fields] = await pool.execute(
//       "CALL insertRegistration(?, ?, ?, ?)",
//       [email, hashedPassword, verificationToken, false]
//     );

//     const userId = rows[0][0].userId; // Assuming your stored procedure returns the newly created user ID

//     const verificationLink = `http://localhost:3000/verify/${verificationToken}`;
//     const mailOptions = {
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: "Email Verification",
//       html: generateEmailTemplate(
//         `Hello ${email}! Your Decision168 account's verification link is provided below:`,
//         `Click <a href="${verificationLink}">here</a> to verify your email address.`
//       ),
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         res.status(500).json({ error: "Failed to send verification email." });
//       } else {
//         res.status(201).json({
//           message: "Registration successful. Verification email sent.",
//           userId,
//         });
//       }
//     });
//   } catch (err) {
//     if (err.code === 11000) {
//       return res.status(400).json({ error: "User already exists." });
//     }
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// // Verification API
// router.get("/verify/:token", async (req, res) => {
//   const token = req.params.token;
//   try {
//     const [rows, fields] = await pool.execute("CALL verifyUser(?)", [token]);
//     const user = rows[0][0];

//     if (!user) {
//       return res.status(404).json({ error: "Invalid verification token." });
//     }

//     res.status(200).json({ message: "Email verification successful." });
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// // Login API
// router.post("/user/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     if (!isEmail(email)) {
//       return res.status(400).json({ error: "Invalid email address." });
//     }

//     const [rows, fields] = await pool.execute("CALL loginUser(?)", [email]);
//     const user = rows[0][0];

//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     if (!user.isVerified) {
//       return res.status(401).json({ error: "Email not verified." });
//     }

//     const passwordMatch = await bcrypt.compare(password, user.password);
//     if (passwordMatch) {
//       const token = generateToken(user);
//       res.status(201).json({ message: "Login successful.", token });
//     } else {
//       res.status(401).json({ error: "Incorrect password." });
//     }
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// // Forgot-password API
// router.post("/user/forgot-password", async (req, res) => {
//   const { email } = req.body;
//   try {
//     if (!isEmail(email)) {
//       return res.status(400).json({ error: "Invalid email address." });
//     }

//     const [rows, fields] = await pool.execute("CALL forgotPassword(?)", [email]);
//     const user = rows[0][0];

//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     if (!user.isVerified) {
//       return res.status(401).json({ error: "Email not verified." });
//     }

//     const otp = generateOTP();
//     const mailOptions = {
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: "Password Reset OTP",
//       html: generateEmailTemplate(
//         `Hello ${email}! Your Decision168 account's One-Time Password (OTP) for password reset is provided below:`,
//         `OTP: ${otp} Please use this OTP to complete your password reset process.
//         If you did not request this reset or have any concerns,
//         please contact our support team immediately.`
//       ),
//     };

//     transporter.sendMail(mailOptions, async (error, info) => {
//       if (error) {
//         res.status(500).json({ error: "Failed to send OTP." });
//       } else {
//         const otpInserted = await insertOTP(email, otp);
//         if (otpInserted) {
//           res.status(201).json({ message: "OTP sent successfully." });
//         } else {
//           res.status(500).json({ error: "Failed to save OTP." });
//         }
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// // Reset-password API
// router.patch("/user/reset-password/:id", async (req, res) => {
//   const { otp, new_password } = req.body;
//   try {
//     const userId = req.params.id;

//     const [rows, fields] = await pool.execute("CALL resetPassword(?, ?)", [
//       userId,
//       otp,
//     ]);

//     const user = rows[0][0];

//     if (user) {
//       const otpData = await OTPModel.findOne({ email: user.email });
//       if (otpData && otpData.expiryDate > new Date()) {
//         const isOTPValid = await verifyOTP(user.email, otp);
//         if (isOTPValid) {
//           const hashedPassword = await bcrypt.hash(new_password, 10);
//           await pool.execute("CALL updatePassword(?, ?)", [
//             userId,
//             hashedPassword,
//           ]);

//           res.status(201).json({ message: "Password reset successfully." });
//         } else {
//           res.status(400).json({ error: "Invalid OTP." });
//         }
//       } else {
//         res
//           .status(400)
//           .json({ error: "OTP has expired. Please request a new OTP." });
//       }
//     } else {
//       res.status(404).json({ error: "User not found." });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Internal server error." });
//   }
// });


// module.exports = router;
