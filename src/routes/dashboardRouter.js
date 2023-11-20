const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

//get user details by user id
router.post("/user/get-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getStudentById(?)", [id]);
    res.status(200).json({ result: rows });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get package details by pack id
router.post("/user/get-package/:pack_id", async (req, res) => {
  const { pack_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getPackDetail(?)", [
      pack_id,
    ]);
    res.status(200).json({ result: rows });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get user portfolio counts by email id
router.post("/user/get-portfolio-count/:email_id", async (req, res) => {
  const { email_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL count_total_portfolio(?)", [
      email_id,
    ]);
    res.status(200).json({ result: rows });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get user projects(created+member) counts by user id
router.post("/user/get-projects-count/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows1, fields1] = await pool.execute(
      "CALL view_member_project_count(?)",
      [id]
    );
    const [rows2, fields2] = await pool.execute(
      "CALL view_created_project_count(?)",
      [id]
    );
    const count1 = rows1[0][0].count_rows;
    const count2 = rows2[0][0].count_rows;

    const totalCount = count1 + count2;

    res.status(200).json({ result: totalCount });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get user tasks(tasks+subtasks) counts by user id
router.post("/user/get-tasks-count/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows1, fields1] = await pool.execute(
      "CALL view_left_task_count(?)",
      [id]
    );
    const [rows2, fields2] = await pool.execute(
      "CALL view_left_subtask_count(?)",
      [id]
    );
    const count1 = rows1[0][0].count_rows;
    const count2 = rows2[0][0].count_rows;

    const totalCount = count1 + count2;

    res.status(200).json({ result: totalCount });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get motivator
router.post("/user/get-motivator", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL Motivator()");
    res.status(200).json({ result: rows });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get countries
router.post("/user/get-countries", async (req, res) => {
    const { id } = req.params;
    try {
      const [rows, fields] = await pool.execute("CALL getCountries()");
      res.status(200).json({ result: rows });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

//get country by country code
router.post("/user/get-country/:code", async (req, res) => {
    const { code } = req.params;
    try {
      const [rows, fields] = await pool.execute("CALL getCountryByCode(?)", [code]);
      res.status(200).json({ result: rows });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  

module.exports = router;
