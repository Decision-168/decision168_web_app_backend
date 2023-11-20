require("dotenv").config();
const express = require("express");
const pool = require("../database/connection");
const router = express.Router();

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
    try {
      const [rows] = await pool.execute(
        "CALL get_portfolio_accepted_notification(?)",
        [pim_id]
      );
      return res.status(200).json({ rows });
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
      const id = `reg_id  = '${pim_id}'`;
      await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
        req.body,
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
    if (port_id) {
      const id = `reg_id  = '${port_id}'`;
      await pool.execute("CALL check_PortfolioMemberActive(?, ?)", [
        id,
        sent_to,
      ]);
      res.status(201).json({ message: "Member activated successfully." });
    } else {
      return res.status(400).json({ error: "User not found." });
    }
  } catch (err) {
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

module.exports = router;
