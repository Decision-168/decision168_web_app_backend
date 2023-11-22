const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { convertObjectToProcedureParams } = require("../utils/common-functions");
const moment = require("moment");

//get user details by user id
router.get("/user/get-user/:reg_id", async (req, res) => {
  const { reg_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getStudentById(?)", [
      reg_id,
    ]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get package details by pack id
router.get("/user/get-package/:pack_id", async (req, res) => {
  const { pack_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getPackDetail(?)", [
      pack_id,
    ]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get user all counts by email id and user id
router.get("/user/get-all-counts/:email_id/:id", async (req, res) => {
  const email_id = req.params.email_id;
  const id = req.params.id;
  try {
    //get user portfolio count
    const [rows1] = await pool.execute("CALL count_total_portfolio(?)", [
      email_id,
    ]);
    const portfolioCount = rows1[0][0].count_rows;

    //get user projects(created+member) counts
    const [rows2] = await pool.execute("CALL view_member_project_count(?)", [
      id,
    ]);
    const [rows3] = await pool.execute("CALL view_created_project_count(?)", [
      id,
    ]);
    const count1 = rows2[0][0].count_rows;
    const count2 = rows3[0][0].count_rows;

    const projectCount = count1 + count2;

    //get user tasks(tasks+subtasks) counts
    const [rows4] = await pool.execute("CALL view_left_task_count(?)", [id]);
    const [rows5] = await pool.execute("CALL view_left_subtask_count(?)", [id]);
    const count3 = rows4[0][0].count_rows;
    const count4 = rows5[0][0].count_rows;

    const tasksCount = count3 + count4;

    res.status(200).json({
      portfolioResult: portfolioCount,
      projectResult: projectCount,
      tasksResult: tasksCount,
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get motivator
router.get("/user/get-motivator", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL Motivator()");
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get countries
router.get("/user/get-countries", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getCountries()");
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get country by country code
router.get("/user/get-country/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getCountryByCode(?)", [
      code,
    ]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update profile
router.patch("/user/update-profile/:id", async (req, res) => {
  const reg_id = req.params.id;
  const dynamicObject = req.body;
  try {
    // Convert dynamicObject to the format 'key1 = "value1", key2 = "value2", ...'
    const formattedParams = convertObjectToProcedureParams(dynamicObject);

    const storedProcedure = `CALL UpdateRegistration('${formattedParams}', 'reg_id = ${reg_id}')`;

    const [results] = await pool.execute(storedProcedure);

    res.json({ message: "Profile updated successfully", results });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get dashboard(my day + my next168) recent 5 notifications by user id
router.get("/user/get-recent-notifications/:id", async (req, res) => {
  const id = req.params.id;
  try {
    //my day section
    const currentDate = new Date();
    const due_date = currentDate.toISOString().split("T")[0];
    const [rows1] = await pool.execute("CALL TodayTasksDashboardLimit(?,?)", [
      id,
      due_date,
    ]);
    const TodayTasks = rows1;

    const [rows2] = await pool.execute(
      "CALL TodaySubtasksDashboardLimit(?,?)",
      [id, due_date]
    );
    const TodaySubtasks = rows2;

    //my next168 section
    const today = moment();
    const firstDay = today.add(1, "days").format("Y-MM-DD");
    const lastDay = today.add(6, "days").format("Y-MM-DD");

    const [rows3] = await pool.execute("CALL WeekTasksDashboardLimit(?,?,?)", [
      id,
      firstDay,
      lastDay,
    ]);
    const WeekTasks = rows3;

    const [rows4] = await pool.execute(
      "CALL WeekSubtasksDashboardLimit(?,?,?)",
      [id, firstDay, lastDay]
    );
    const WeekSubtasks = rows4;

    const MyDay = [...TodayTasks[0], ...TodaySubtasks[0]];
    const MyNext168 = [...WeekTasks[0], ...WeekSubtasks[0]];

    res.status(200).json({
      MyDayResult: MyDay,
      MyNext168Result: MyNext168,
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
