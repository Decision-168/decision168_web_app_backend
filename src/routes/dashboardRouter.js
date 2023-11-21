const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { convertObjectToProcedureParams } = require("../utils/common-functions");
const moment = require("moment");

//get user details by user id
router.get("/user/get-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getStudentById(?)", [id]);
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

    res.status(200).json({
      TodayTasksResult: TodayTasks[0],
      TodaySubtasksResult: TodaySubtasks[0],
      WeekTasksResult: WeekTasks[0],
      WeekSubtasksResult: WeekSubtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get dashboard + bell icon alert notifications by user id
router.get("/user/get-alert-notifications/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const currentDate = new Date();
    const getdate = currentDate.toISOString().split("T")[0];

    //New task assigned
    const [rows1] = await pool.execute("CALL task_notification_clear(?)", [id]);
    const NewTasks = rows1[0];

    //New Subtask assigned
    const [rows2] = await pool.execute("CALL subtask_notification_clear(?)", [
      id,
    ]);
    const NewSubtask = rows2[0];

    //Overdue task assigned
    const [rows3] = await pool.execute("CALL OverdueTasks_clear(?,?)", [
      getdate,
      id,
    ]);
    const OverdueTasks = rows3[0];

    //Overdue Subtask assigned
    const [rows4] = await pool.execute("CALL OverdueSubtasks_clear(?,?)", [
      getdate,
      id,
    ]);
    const OverdueSubtask = rows4[0];

    //Sent to review task
    const [rows5] = await pool.execute("CALL check_task_review_sent_clear(?)", [
      id,
    ]);
    const SentToReviewTasks = rows5[0];

    //Review denied task
    const [rows6] = await pool.execute("CALL check_task_review_deny_clear(?)", [
      id,
    ]);
    const ReviewDeniedTasks = rows6[0];

    //Review approved task
    const [rows7] = await pool.execute(
      "CALL check_task_review_approve_clear(?)",
      [id]
    );
    const ReviewApprovedTasks = rows7[0];

    //Sent to review subtask
    const [rows8] = await pool.execute(
      "CALL check_subtask_review_sent_clear(?)",
      [id]
    );
    const SentToReviewSubtasks = rows8[0];

    //Review denied subtask
    const [rows9] = await pool.execute(
      "CALL check_subtask_review_deny_clear(?)",
      [id]
    );
    const ReviewDeniedSubtasks = rows9[0];

    //Review approved subtask
    const [rows10] = await pool.execute(
      "CALL check_subtask_review_approve_clear(?)",
      [id]
    );
    const ReviewApprovedSubtasks = rows10[0];

    //Task Review Arrive
    const [rows11] = await pool.execute(
      "CALL check_task_arrive_review_clear(?)",
      [id]
    );
    const ReviewArriveTasks = rows11[0];

    //Subtask Review Arrive
    const [rows12] = await pool.execute(
      "CALL check_subtask_arrive_review_clear(?)",
      [id]
    );
    const ReviewArriveSubtasks = rows12[0];

    //Project pending request
    const [rows13] = await pool.execute("CALL PendingProjectList_clear(?)", [
      id,
    ]);
    const PendingProjectRequest = rows13[0];

    //Portfolio accepted notify
    const [rows14] = await pool.execute(
      "CALL check_portfolio_accepted_notify_clear(?)",
      [id]
    );
    const PortfolioAccepted = rows14[0];

    //Project accepted notify
    const [rows15] = await pool.execute(
      "CALL check_project_accepted_notify_clear(?)",
      [id]
    );
    const ProjectAccepted = rows15[0];

    //Project accepted invite notify
    const [rows16] = await pool.execute(
      "CALL check_project_invite_accepted_notify_clear(?)",
      [id]
    );
    const ProjectAcceptedInvite = rows16[0];

    //Membership requested notify
    const [rows17] = await pool.execute(
      "CALL check_project_request_member_notify_clear(?)",
      [id]
    );
    const MembershipRequested = rows17[0];

    //Goal pending request
    const [rows18] = await pool.execute("CALL PendingGoalList_clear(?)", [id]);
    const PendingGoalRequest = rows18[0];

    //My created projects
    const [cprojects] = await pool.execute("CALL ProjectList(?)", [id]);
    const cprojectsRes = cprojects[0];

    //My accepted projects
    const [aprojects] = await pool.execute("CALL AcceptedProjectList(?)", [id]);
    const aprojectsRes = aprojects[0];

    //My pending projects
    const [pprojects] = await pool.execute("CALL PendingProjectList(?)", [id]);
    const pprojectsRes = pprojects[0];

    //My readmore projects
    const [rprojects] = await pool.execute("CALL ReadMoreProjectList(?)", [id]);
    const rprojectsRes = rprojects[0];

    let ProjectFiles = [];
    let TasksFiles = [];
    let SubtasksFiles = [];

    if (cprojectsRes) {
      await Promise.all(
        cprojectsRes.map(async (item) => {
          const pid = item.pid;
          // Project file notify
          try {
            const [rows19] = await pool.execute("CALL ProjectFile_clear(?)", [
              pid,
            ]);
            const CProjectFile = rows19[0];

            if (
              CProjectFile &&
              CProjectFile[0] &&
              CProjectFile[0].pfnotify_clear &&
              CProjectFile[0].pcreated_by !== id
            ) {
              const c_pfn = CProjectFile[0].pfnotify_clear.split(",");

              if (c_pfn.includes(id)) {
                ProjectFiles.push(CProjectFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // Task file notify
          try {
            const [rows21] = await pool.execute(
              "CALL getTasksProject_clear(?)",
              [pid]
            );
            const CTasksFile = rows21[0];

            if (CTasksFile && CTasksFile[0] && CTasksFile[0].tfnotify_clear) {
              const c_ptnew = CTasksFile[0].tfnotify_clear.split(",");

              if (c_ptnew.includes(id)) {
                TasksFiles.push(CTasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }
        })
      );
    }

    if (aprojectsRes) {
      await Promise.all(
        aprojectsRes.map(async (item) => {
          const pid = item.pid;
          // Project file notify
          try {
            const [rows20] = await pool.execute("CALL ProjectFile_clear(?)", [
              pid,
            ]);
            const AProjectFile = rows20[0];

            if (
              AProjectFile &&
              AProjectFile[0] &&
              AProjectFile[0].pfnotify_clear &&
              AProjectFile[0].pcreated_by !== id
            ) {
              const a_pfn = AProjectFile[0].pfnotify_clear.split(",");

              if (a_pfn.includes(id)) {
                ProjectFiles.push(AProjectFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // Task file notify
          try {
            const [rows22] = await pool.execute(
              "CALL getTasksProject_clear(?)",
              [pid]
            );
            const ATasksFile = rows22[0];

            if (ATasksFile && ATasksFile[0] && ATasksFile[0].tfnotify_clear) {
              const a_ptnew = ATasksFile[0].tfnotify_clear.split(",");

              if (a_ptnew.includes(id)) {
                TasksFiles.push(ATasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }
        })
      );
    }

    // Filter out empty arrays
    ProjectFiles = ProjectFiles.filter((array) => array.length > 0);
    TasksFiles = TasksFiles.filter((array) => array.length > 0);
    SubtasksFiles = SubtasksFiles.filter((array) => array.length > 0);

    const MyAlerts = [
      ...NewTasks,
      ...NewSubtask,
      ...OverdueTasks,
      ...OverdueSubtask,
      ...SentToReviewTasks,
      ...ReviewDeniedTasks,
      ...ReviewApprovedTasks,
      ...SentToReviewSubtasks,
      ...ReviewDeniedSubtasks,
      ...ReviewApprovedSubtasks,
      ...ReviewArriveTasks,
      ...ReviewArriveSubtasks,
      ...PendingProjectRequest,
      ...PortfolioAccepted,
      ...ProjectAccepted,
      ...ProjectAcceptedInvite,
      ...MembershipRequested,
      ...PendingGoalRequest,
      ...ProjectFiles.flat(),
      ...TasksFiles.flat(),
      ...SubtasksFiles.flat(),
    ];

    res.status(200).json({
      MyAlertsResult: MyAlerts,
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
