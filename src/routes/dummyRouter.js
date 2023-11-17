const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const bcrypt = require("bcrypt");
const { default: isEmail } = require("validator/lib/isemail");

// router.get("/user/get-user", async (req, res) => {
//   try {
//     const [rows, fields] = await pool.execute("CALL getRegUsers()");
//     res.json(rows);
//   } catch (error) {
//     console.error("Error executing stored procedure:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/user/get-user/:id", async (req, res) => {
//     const {id} = req.params
//   try {
//     const [rows, fields] = await pool.execute("CALL getRegUsersByID(?)", [id]);
//     res.json(rows);
//   } catch (error) {
//     console.error("Error executing stored procedure:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.post("/user/register", async (req, res) => {
  try {
    const { param_names, param_values } = req.body;
    const paramNamesArray = param_names.split(",");
    const paramValuesArray = param_values.split(",");
    const emailIndex = paramNamesArray.indexOf("email_address");
    const emailAddress = paramValuesArray[emailIndex].trim().replace(/'/g, "");
    if (!isEmail(emailAddress)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
     const passIndex = paramNamesArray.indexOf("password");
     const Password = paramValuesArray[passIndex].trim().replace(/'/g, "");
      const hashedPassword = await bcrypt.hash(Password, 10);
    console.log(emailAddress);
    console.log(param_values);
    // Construct the stored procedure call
    const callProcedureSQL = `CALL InsertRegistration(?, ?)`;

    // Execute the stored procedure
    const [rows, fields] = await pool.execute(callProcedureSQL, [
      param_names,
      param_values,
    ]);
    console.log(rows);
    res.json({ message: "Insert successful", result: rows });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

router.post("/user/checkLogin", async (req, res) => {
  const { email_address, password } = req.body;
  console.log(email_address, password);
  try {
    // Replace undefined values with null
    const [rows, fields] = await pool.execute("CALL checkLogin(?,?)", [
      email_address,
      password,
    ]);
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.log(error);
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
