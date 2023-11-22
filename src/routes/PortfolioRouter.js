require("dotenv").config();
const express = require("express");
const pool = require("../database/connection");
const { dateConversion, transporter } = require("../utils/common-functions");
const { isEmail } = require("validator");
const generateEmailTemplate = require("../utils/emailTemplate");
const router = express.Router();

//get_SideBar_Portfolio;
router.get(
  "/portfolio/get-all-portfolio/:email_address",
  async (req, res) => {
    const { email_address } = req.params;
    try {
      const [rows] = await pool.execute("CALL get_SideBar_Portfolio(?)", [
        email_address,
      ]);
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);


//getAll_Accepted_PortTM;
router.get(
  "/portfolio/get-all-accepted-portfolio/:portfolio_id",
  async (req, res) => {
    const { portfolio_id } = req.params;
    try {
      const [rows] = await pool.execute("CALL getAll_Accepted_PortTM(?)", [
        portfolio_id,
      ]);
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//get_portfolio_accepted_notification
router.get(
  "/portfolio/get-portfolio-accepted-notification/:pim_id",
  async (req, res) => {
    const { pim_id } = req.params;
    const { reg_id } = req.body;
    try {
      const [rows] = await pool.execute(
        "CALL get_portfolio_accepted_notification(?,?)",
        [pim_id, reg_id]
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//UpdateProjectPortfolioMember
router.patch("/portfolio/update-member/:pim_id", async (req, res) => {
  const { pim_id } = req.params;
  try {
    if (pim_id) {
      const id = `pim_id  = '${pim_id}'`;
      const updateData = Object.entries(req.body)
        .map(([key, value]) => `${key} = "${value}"`)
        .join(", ");
      await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
        updateData,
        id,
      ]);
      res.status(201).json({ message: "Member updated successfully." });
    } else {
      return res.status(400).json({ error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//check_PortfolioMemberActive
router.get("/portfolio/check-member-active/:port_id", async (req, res) => {
  const { port_id } = req.params;
  const { sent_to } = req.body;
  try {
    const [rows] = await pool.execute(
      "CALL check_PortfolioMemberActive(?, ?)",
      [sent_to, port_id]
    );
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//count portfolio details
router.get(
  "/portfolio/count-portfolio-details/:portfolio_id",
  async (req, res) => {
    const { portfolio_id } = req.params;

    try {
      const [[projectCount], [taskCount]] = await Promise.all([
        pool.execute("CALL count_portfolio_project(?)", [portfolio_id]),
        pool.execute("CALL count_Portfolio_task(?)", [portfolio_id]),
      ]);

      console.log(projectCount, taskCount);

      // Organize the results into a response format
      const response = {
        projectCount: projectCount[0][0].count_rows,
        taskCount: taskCount[0][0].count_rows,
      };
      return res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//getPackDetail
router.get("/portfolio/get-pack-details/:package_id", async (req, res) => {
  const { package_id } = req.params;
  try {
    const [rows] = await pool.execute("CALL getPackDetail(?)", [package_id]);
    const response = rows[0][0];
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getProjectCount
router.get("/portfolio/get-project-count", async (req, res) => {
  const { reg_id, portfolio_id } = req.body;
  try {
    const [rows] = await pool.execute("CALL getProjectCount(?,?)", [
      reg_id,
      portfolio_id,
    ]);
    const response = rows[0][0];
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getCompany
router.get("/portfolio/get-company/:cc_corporate_id", async (req, res) => {
  const { cc_corporate_id } = req.params;
  try {
    const [rows] = await pool.execute("CALL getCompany(?)", [cc_corporate_id]);
    return res.status(200).json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getCompanyRoles
router.get("/portfolio/get-company-roles/:ccr_id", async (req, res) => {
  const { ccr_id } = req.params;
  try {
    const [rows] = await pool.execute("CALL getCompanyRoles(?)", [ccr_id]);
    return res.status(200).json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getProjectCountCorp
router.get(
  "/portfolio/get-project-count-corporate/:portfolio_id",
  async (req, res) => {
    const { portfolio_id } = req.params;
    try {
      const [rows] = await pool.execute("CALL getProjectCountCorp(?)", [
        portfolio_id,
      ]);
      return res.status(200).json({ rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//getPortfolioMemberCount
router.get("/portfolio/get-portfolio-member-count", async (req, res) => {
  const { reg_id, portfolio_id } = req.body;
  try {
    const [rows] = await pool.execute("CALL getPortfolioMemberCount(?,?)", [
      reg_id,
      portfolio_id,
    ]);
    const response = rows[0][0];
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getAccepted_PortTM
router.get(
  "/portfolio/get-accepted-team-member/:portfolio_id",
  async (req, res) => {
    const { portfolio_id } = req.params;
    try {
      const [rows] = await pool.execute("CALL getAccepted_PortTM(?)", [
        portfolio_id,
      ]);
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//selectLogin
router.get("/portfolio/select-login", async (req, res) => {
  const { email_address } = req.body;
  try {
    const [rows] = await pool.execute("CALL selectLogin(?)", [email_address]);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getCountryByCode
router.get("/portfolio/get-country-by-code/:country_code", async (req, res) => {
  const { country_code } = req.params;
  try {
    const [rows] = await pool.execute("CALL getCountryByCode(?)", [
      country_code,
    ]);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//get_PortfolioDepartment
router.get(
  "/portfolio/get-department-by-id/:portfolio_id",
  async (req, res) => {
    const { portfolio_id } = req.params;
    try {
      const [rows] = await pool.execute("CALL get_PortfolioDepartment(?)", [
        portfolio_id,
      ]);
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//InsertPortfolio
router.post("/portfolio/insert-portfolio", async (req, res) => {
  try {
    let { email_address } = req.body;

    if (!isEmail(email_address)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    const formattedDate = dateConversion();
    const additionalFields = {
      portfolio_createddate: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...req.body,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertPortfolio(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Portfolio created successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//UpdateProjectPortfolio
router.patch("/portfolio/update-portfolio/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const updateData = Object.entries(req.body)
      .map(([key, value]) => `${key} = "${value}"`)
      .join(", ");
    const id = `portfolio_id  = '${portfolio_id}'`;
    await pool.execute("CALL UpdateProjectPortfolio(?, ?)", [updateData, id]);
    res.status(201).json({ message: "Portfolio updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//InsertProjectPortfolioDepartment;
router.post("/portfolio/insert-project-department", async (req, res) => {
  try {
    const formattedDate = dateConversion();
    const additionalFields = {
      createddate: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...req.body,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertProjectPortfolioDepartment(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Department added successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//UpdateProjectPortfolioDepartment
router.patch("/portfolio/update-project-department/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = Object.entries(req.body)
      .map(([key, value]) => `${key} = "${value}"`)
      .join(", ");
    const portfolio_dept_id = `portfolio_dept_id  = '${id}'`;
    await pool.execute("CALL UpdateProjectPortfolioDepartment(?, ?)", [
      updateData,
      portfolio_dept_id,
    ]);
    res.status(201).json({ message: "Department updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//UpdateProjectPortfolioMember
router.patch("/portfolio/update-project-member/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = Object.entries(req.body)
      .map(([key, value]) => `${key} = "${value}"`)
      .join(", ");
    const pim_id = `pim_id  = '${id}'`;
    await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
      updateData,
      pim_id,
    ]);
    res.status(201).json({ message: "Project member updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//InsertProjectPortfolioMember;
router.post("/portfolio/insert-project-member", async (req, res) => {
  try {
    let { portfolio_id, sent_to, sent_from } = req.body;

    if (!isEmail(sent_to)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const [checkEmail] = await pool.execute(
      "CALL checkPortfolioMemberEmail(?,?)",
      [sent_to, portfolio_id]
    );
    if (checkEmail[0]?.length > 0) {
      return res.status(400).json({ error: "Member Already Exist." });
    } else {
      const paramNamesString = Object.keys(req.body).join(", ");
      const paramValuesString = Object.values(req.body)
        .map((value) => `'${value}'`)
        .join(", ");
      const callProcedureSQL = `CALL InsertProjectPortfolioMember(?, ?)`;
      await pool.execute(callProcedureSQL, [
        paramNamesString,
        paramValuesString,
      ]);
      const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
        portfolio_id,
      ]);
      const PortfolioName = getPortfolio[0][0]?.portfolio_name;
      const [getPID] = await pool.execute(
        "CALL checkPortfolioMemberEmail(?,?)",
        [sent_to, portfolio_id]
      );
      const PIM_id = getPID[0][0]?.pim_id;

      const acceptRequest = `http://localhost:3000/portfolio-invite-request/${portfolio_id}/${PIM_id}/1`;
      const rejectRequest = `http://localhost:3000/portfolio-invite-request/${portfolio_id}/${PIM_id}/2`;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: sent_to,
        subject: "Portfolio Team Member Request | Decision 168",
        html: generateEmailTemplate(
          `Hello ${PortfolioName} has invited you to join ${PortfolioName} portfolio as a team member.
            Just click the appropriate button below to join the portfolio or request more information.`,
          `<a href="${acceptRequest}">JOIN THE TEAM</a> <a href="${rejectRequest}">DENY REQUEST</a>`
        ),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res
            .status(500)
            .json({ error: "Failed to send portfolio invitation email." });
        } else {
          res.status(201).json({
            message: "Project invitation sent to your email.",
          });
        }
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//portfolio-invite-request
router.get(
  "/portfolio-invite-request/:portfolio_id/:pim_id/:flag",
  async (req, res) => {
    const { portfolio_id, pim_id, flag } = req.params;
    try {
      console.log(portfolio_id, pim_id, flag);
      if (flag == 1) {
        const [getportd] = await pool.execute("CALL getPortfolioMember(?,?)", [
          pim_id,
          portfolio_id,
        ]);
        if (getportd[0].length > 0) {
          const email_address = getportd[0][0]?.sent_to;
          const status = getportd[0][0]?.status;
          const [check_if_registered] = await pool.execute(
            "CALL selectLogin(?)",
            [email_address]
          );
          if (status == "pending") {
           if (check_if_registered[0].length > 0) {

           }
          }
        }
      } else if (flag == 2) {
      } else {
      }
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

module.exports = router;
