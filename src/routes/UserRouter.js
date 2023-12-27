require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const bcrypt = require("bcrypt");
const { isEmail } = require("validator");
const {
  generateVerificationToken,
  transporter,
  nameSplit,
  dateConversion,
} = require("../utils/common-functions");
const generateToken = require("../utils/auth");
const config = require("../../config");
const generateAccountVerificationEmailTemplate = require("../utils/AccountVerificationEmailTemp");
const generateForgotPasswordEmailTemplate = require("../utils/ForgotPasswordEmailTemp");

//User Registration
router.post("/user/register", async (req, res) => {
  try {
    let { full_name, email_address, password } = req.body;

    if (!isEmail(email_address)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    delete req.body.full_name;
    const verificationToken = generateVerificationToken();

    const name = nameSplit(full_name);
    const formattedDate = dateConversion();

    const additionalFields = {
      verification_code: verificationToken,
      verified: "no",
      first_name: name.first_name,
      middle_name: name.middle_name,
      last_name: name.last_name,
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

    const [inserted_reg] = await pool.execute("CALL LastInsertedRegID(?)", [
      email_address,
    ]);
    const inserted_reg_id = inserted_reg[0][0].reg_id;

    const [checkInvite] = await pool.execute("CALL checkInviteMemberEmail(?)", [
      email_address,
    ]);
    const checkInvitation = checkInvite[0];
    checkInvitation?.map(async (row) => {
      if (row.status == "pending") {
        const projectFieldsValues1 = `status = 'accepted', accept_date = '${formattedDate}', status_notify = 'yes', status_notify_clear = 'no'`;
        const sent_to = `sent_to = '${email_address}'`;
        await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
          projectFieldsValues1,
          sent_to,
        ]);
        const [projectRow] = await pool.execute("CALL getProjectById(?)", [
          row.pid,
        ]);
        const projectData = projectRow[0][0];
        if (projectData) {
          const history = {
            pid: row.pid,
            gid: projectData.gid,
            sid: projectData.sid,
            h_date: formattedDate,
            h_resource: row.sent_to,
            h_description: `Invite Accepted By ${row.sent_to}`,
            pinvited_id: row.im_id,
          };

          const paramNamesString1 = Object.keys(history).join(", ");
          const paramValuesString1 = Object.values(history)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL1, [
            paramNamesString1,
            paramValuesString1,
          ]);

          const [projectRow2] = await pool.execute(
            "CALL ProjectDetailCheck(?)",
            [row.pid]
          );
          const projectData2 = projectRow2[0][0];
          const projectFieldsValues2 = `status = 'accepted', working_status = 'active', status_date = '${formattedDate}', status_notify = 'seen', portfolio_id = 'yes'`;
          const sent_to = `sent_to = '${email_address}' AND portfolio_id = '${projectData2.portfolio_id}'`;
          await pool.execute("CALL UpdateProjectPortfolioMember(?,?)", [
            projectFieldsValues2,
            sent_to,
          ]);

          const iData = {
            pid: row.pid,
            portfolio_id: projectData2.portfolio_id,
            pmember: inserted_reg_id,
            status: "accepted",
            pcreated_by: row.sent_from,
            status_date: formattedDate,
          };

          const paramNamesString2 = Object.keys(iData).join(", ");
          const paramValuesString2 = Object.values(iData)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL2 = `CALL InsertProjectMembers(?, ?)`;
          await pool.execute(callProcedureSQL2, [
            paramNamesString2,
            paramValuesString2,
          ]);

          const [inserted_pm] = await pool.execute(
            "CALL LastInsertedProjectMembers(?)",
            [inserted_reg_id]
          );
          const inserted_pm_id = inserted_pm[0][0].pm_id;

          const history3 = {
            pid: row.pid,
            gid: projectData.gid,
            sid: projectData.sid,
            h_date: formattedDate,
            h_resource: `${name.first_name} ${name.last_name}`,
            h_description: `Team Member Request Accepted By ${name.first_name} ${name.last_name}`,
            pmember_id: inserted_pm_id,
          };

          const paramNamesString3 = Object.keys(history3).join(", ");
          const paramValuesString3 = Object.values(history3)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL3 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL3, [
            paramNamesString3,
            paramValuesString3,
          ]);

          const pData = {
            pid: row.pid,
            powner: row.sent_from,
            pmember: inserted_reg_id,
            edit_allow: "no",
          };

          const paramNamesString4 = Object.keys(pData).join(", ");
          const paramValuesString4 = Object.values(pData)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL4 = `CALL InsertProjectManagement(?, ?)`;
          await pool.execute(callProcedureSQL4, [
            paramNamesString4,
            paramValuesString4,
          ]);

          const [inserted_pmg] = await pool.execute(
            "CALL LastInsertedProjectManagement(?)",
            [inserted_reg_id]
          );
          const inserted_pmg_id = inserted_pmg[0][0].m_id;

          const history5 = {
            pid: row.pid,
            gid: projectData.gid,
            sid: projectData.sid,
            h_date: formattedDate,
            h_resource: `${name.first_name} ${name.last_name}`,
            h_description: `Edit Permission not allowed to ${name.first_name} ${name.last_name}`,
            pmanage_id: inserted_pmg_id,
          };

          const paramNamesString5 = Object.keys(history5).join(", ");
          const paramValuesString5 = Object.values(history5)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL5 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL5, [
            paramNamesString5,
            paramValuesString5,
          ]);
        }
      }
    });

    const [checkInviteGoal] = await pool.execute(
      "CALL checkGoalInviteMemberEmail(?)",
      [email_address]
    );
    const checkInvitationGoal = checkInviteGoal[0];
    checkInvitationGoal?.map(async (row) => {
      if (row.status == "pending") {
        const igm_id = row.igm_id;
        const goalFieldsValues1 = `status = 'accepted', accept_date = '${formattedDate}', status_notify = 'yes', status_notify_clear = 'no'`;
        const igmId = `igm_id = '${igm_id}'`;
        await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [
          goalFieldsValues1,
          igmId,
        ]);

        const history = {
          gid: row.gid,
          sid: row.sid,
          h_date: formattedDate,
          h_resource: row.sent_to,
          h_description: `Invite Accepted By ${row.sent_to}`,
          pinvited_id: igm_id,
        };
        const paramNamesString1 = Object.keys(history).join(", ");
        const paramValuesString1 = Object.values(history)
          .map((value) => `'${value}'`)
          .join(", ");
        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [
          paramNamesString1,
          paramValuesString1,
        ]);

        const [goalRow2] = await pool.execute("CALL GoalDetail(?)", [row.gid]);
        const goalData2 = goalRow2[0][0];

        const goalFieldsValues2 = `status = 'accepted', working_status = 'active', status_date = '${formattedDate}', status_notify = 'seen', portfolio_id = 'yes'`;
        const sent_to = `sent_to = '${email_address}' AND portfolio_id = '${goalData2.portfolio_id}'`;
        await pool.execute("CALL UpdateProjectPortfolioMember(?,?)", [
          goalFieldsValues2,
          sent_to,
        ]);

        const iData = {
          gid: row.gid,
          portfolio_id: goalData2.portfolio_id,
          gmember: inserted_reg_id,
          status: "accepted",
          gcreated_by: goalData2.gcreated_by,
          sent_date: formattedDate,
          sent_notify_clear: "yes",
        };
        const paramNamesString2 = Object.keys(iData).join(", ");
        const paramValuesString2 = Object.values(iData)
          .map((value) => `'${value}'`)
          .join(", ");
        const callProcedureSQL2 = `CALL InsertGoalsMembers(?, ?)`;
        await pool.execute(callProcedureSQL2, [
          paramNamesString2,
          paramValuesString2,
        ]);
      }
    });

    const [check_portTM] = await pool.execute("CALL check_portTM(?)", [
      email_address,
    ]);
    const check_portTMData = check_portTM[0];
    check_portTMData?.map(async (item) => {
      const goalFieldsValues3 = `status = 'accepted', working_status = 'active', status_date = ${formattedDate}, status_notify = 'yes', status_notify_clear = 'no'`;
      const sent_to = `sent_to = '${email_address}'`;
      await pool.execute("CALL UpdateProjectPortfolioMember(?,?)", [
        goalFieldsValues3,
        sent_to,
      ]);
    });

    const verificationLink = `http://localhost:5173/account-verification/${verificationToken}`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email_address,
      subject: "Account Verification | Decision 168",
      html: generateAccountVerificationEmailTemplate(
        full_name,
        verificationLink
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
    const [rows] = await pool.execute("CALL selectLogin(?)", [email_address]);
    if (rows[0][0]?.verified === "no") {
      return res.status(401).json({ error: "Email not verified." });
    }
    if (rows[0][0]?.email_address !== email_address) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const passwordMatch = await bcrypt.compare(password, rows[0][0]?.password);
    if (passwordMatch) {
      const token = generateToken(rows[0][0].reg_id);
      await pool.execute("CALL checkLogin(?,?)", [
        email_address,
        passwordMatch,
      ]);
      res.status(201).json({ message: "Login successful.", token });
    } else {
      res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//User Forgot Password
router.post("/user/forgot-password", async (req, res) => {
  const { email_address } = req.body;
  try {
    const [rows] = await pool.execute("CALL forgotPassword(?)", [
      email_address,
    ]);

    // Check if the user with the specified email address is found
    const userFound = rows[0].length > 0;

    if (userFound) {
      const userId = rows[0][0]?.reg_id;
      const userName = rows[0][0]?.first_name;
      const resetPasswordLink = `${config.verificationLink}change-password/${userId}`;
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email_address,
        subject: "Reset Password | Decision 168",
        html: generateForgotPasswordEmailTemplate(userName, resetPasswordLink),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.status(500).json({ error: "Failed to send verification email." });
        } else {
          res.status(201).json({
            message:
              "Reset Link has been sent to your Registered Email Address.",
          });
        }
      });
    } else {
      // User not found
      res.status(404).json({ error: "Email address not registered." });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//User Change Password (forget password)
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


//Auth User update Password inside the App
router.patch("/user/update-password/:id", async (req, res) => {
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
      res.status(201).json({ message: "Password Changed successfully." });
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
