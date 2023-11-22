const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

router.get("/file-cabinet/:portfolio_id", async (req, res) => {
    const {portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL get_PortfolioDepartment(?)", [portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/files/:portfolio_id", async (req, res) => {
  const {portfolio_id} = req.params
try {
  const [rows, fields] = await pool.execute("CALL get_PortfolioDepartment(?)", [portfolio_id]);
  res.status(200).json(rows[0]);
} catch (error) {
  console.error("Error executing stored procedure:", error);
  res.status(500).json({ error: "Internal Server Error" });
}
});

router.patch("/file-cabinet/file-it/goal/:goal_id/:user_id", async (req, res) => {
  const {goal_id,user_id} = req.params
try {
  const [goal_row] = await pool.execute("CALL file_itGoalDetail(?)", [goal_id]);
  const [goal_wise_tasks] = await pool.execute("CALL file_itGoal_tasks(?)", [goal_id]);
  const [goal_wise_subtasks] = await pool.execute("CALL file_itGoal_subtasks(?)", [goal_id]);

  if(goal_row[0][0]){
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    if(goal_wise_tasks[0] || goal_wise_subtasks[0]){

    }else{
      const [owner_row] = await pool.execute("CALL UpdateGoals(?)", [user_id, ]);
    }
  }

} catch (error) {
  console.error("Error executing stored procedure:", error);
  res.status(500).json({ error: "Internal Server Error" });
}
});

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

module.exports = router;