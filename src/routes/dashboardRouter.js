const express = require("express");
const pool = require("../database/connection"); // Import the database connection
const moment = require("moment");
const { convertObjectToProcedureParams } = require("../utils/common-functions");
const router = express.Router();

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
    res.status(200).json(rows[0]);
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
  const updates = convertObjectToProcedureParams(req.body); // Convert data to the format 'key1 = "value1", key2 = "value2", ...'
  try {
    const storedProcedure = `CALL UpdateRegistration('${updates}', 'reg_id = ${reg_id}')`;

    const [results] = await pool.execute(storedProcedure);

    // Check the status returned by the stored procedure or modify as needed
    if (results && results.affectedRows > 0) {
      res.status(200).json({ message: "Profile updated successfully" });
    } else {
      res.status(404).json({ error: "User not found or no changes applied" });
    }
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

    // //My pending projects
    // const [pprojects] = await pool.execute("CALL PendingProjectList(?)", [id]);
    // const pprojectsRes = pprojects[0];

    // //My readmore projects
    // const [rprojects] = await pool.execute("CALL ReadMoreProjectList(?)", [id]);
    // const rprojectsRes = rprojects[0];

    let ProjectFiles = [];
    let TasksFiles = [];
    let SubtasksFiles = [];
    let NewProjectComment = [];

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

          // Subtask file notify
          try {
            const [rows23] = await pool.execute(
              "CALL getSubtasksProject_clear(?)",
              [pid]
            );
            const CSubtasksFile = rows23[0];

            if (
              CSubtasksFile &&
              CSubtasksFile[0] &&
              CSubtasksFile[0].stfnotify_clear
            ) {
              const c_pstnew = CSubtasksFile[0].stfnotify_clear.split(",");

              if (c_pstnew.includes(id)) {
                SubtasksFiles.push(CSubtasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // New Comment in Project
          try {
            const [rows25] = await pool.execute(
              "CALL ProjectComment_clear(?)",
              [pid]
            );
            const CProjectComment = rows25[0];
            let check_proj = "";
            if (
              CProjectComment.length > 0 &&
              CProjectComment[0] &&
              CProjectComment[0].c_notify_clear
            ) {
              const c_pcn = CProjectComment[0].c_notify_clear.split(",");

              if (c_pcn.includes(id.toString())) {
                const filteredComments = CProjectComment.filter((comment) =>
                  comment.c_notify_clear.includes(id.toString())
                );

                if (
                  filteredComments.length > 0 &&
                  check_proj != CProjectComment[0].project_id
                ) {
                  // Additional condition to check if project_id is the same
                  const uniqueProjectComment = filteredComments.reduce(
                    (acc, comment) => {
                      if (
                        !acc.some((c) => c.project_id === comment.project_id)
                      ) {
                        acc.push(comment);
                      }
                      return acc;
                    },
                    []
                  );

                  NewProjectComment.push(uniqueProjectComment);
                }
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

          // Subtask file notify
          try {
            const [rows24] = await pool.execute(
              "CALL getSubtasksProject_clear(?)",
              [pid]
            );
            const ASubtasksFile = rows24[0];

            if (
              ASubtasksFile &&
              ASubtasksFile[0] &&
              ASubtasksFile[0].stfnotify_clear
            ) {
              const a_pstnew = ASubtasksFile[0].stfnotify_clear.split(",");

              if (a_pstnew.includes(id)) {
                SubtasksFiles.push(ASubtasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // New Comment in Project
          try {
            const [rows26] = await pool.execute(
              "CALL ProjectComment_clear(?)",
              [pid]
            );
            const AProjectComment = rows26[0];
            let check_aproj = "";

            if (
              AProjectComment.length > 0 &&
              AProjectComment[0] &&
              AProjectComment[0].c_notify_clear
            ) {
              const a_pcn = AProjectComment[0].c_notify_clear.split(",");

              if (a_pcn.includes(id.toString())) {
                const filteredComments = AProjectComment.filter((comment) =>
                  comment.c_notify_clear.includes(id.toString())
                );

                if (
                  filteredComments.length > 0 &&
                  check_aproj != AProjectComment[0].project_id
                ) {
                  // Additional condition to check if project_id is the same
                  const uniqueProjectComment = filteredComments.reduce(
                    (acc, comment) => {
                      if (
                        !acc.some((c) => c.project_id === comment.project_id)
                      ) {
                        acc.push(comment);
                      }
                      return acc;
                    },
                    []
                  );
                  NewProjectComment.push(uniqueProjectComment);
                }
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
    NewProjectComment = NewProjectComment.filter((array) => array.length > 0);

    res.status(200).json({
      NewTasksResult: NewTasks,
      NewSubtaskResult: NewSubtask,
      OverdueTasksResult: OverdueTasks,
      OverdueSubtaskResult: OverdueSubtask,
      SentToReviewTasksResult: SentToReviewTasks,
      ReviewDeniedTasksResult: ReviewDeniedTasks,
      ReviewApprovedTasksResult: ReviewApprovedTasks,
      SentToReviewSubtasksResult: SentToReviewSubtasks,
      ReviewDeniedSubtasksResult: ReviewDeniedSubtasks,
      ReviewApprovedSubtasksResult: ReviewApprovedSubtasks,
      ReviewArriveTasksResult: ReviewArriveTasks,
      ReviewArriveSubtasksResult: ReviewArriveSubtasks,
      PendingProjectRequestResult: PendingProjectRequest,
      PortfolioAcceptedResult: PortfolioAccepted,
      ProjectAcceptedResult: ProjectAccepted,
      ProjectAcceptedInviteResult: ProjectAcceptedInvite,
      MembershipRequestedResult: MembershipRequested,
      PendingGoalRequestResult: PendingGoalRequest,
      ProjectFilesResult: ProjectFiles.flat(),
      TasksFilesResult: TasksFiles.flat(),
      SubtasksFilesResult: SubtasksFiles.flat(),
      NewProjectCommentResult: NewProjectComment.flat(),
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update dashboard + bell icon clear alert notifications by different id's, user id and type
router.patch(
  "/user/update-alert-notifications/:id/:user_id",
  async (req, res) => {
    const id = req.params.id;
    const user_id = req.params.user_id;
    const type = req.body.type;
    try {
      if (type === "newtasks") {
        const updateFieldsValues1 = `tnotify_clear = 'yes'`;
        const upid = `tid  = '${id}'`;
        await pool.execute("CALL UpdateTask(?, ?)", [
          updateFieldsValues1,
          upid,
        ]);
      }
      if (type === "newsubtasks") {
        const updateFieldsValues2 = `stnotify_clear = 'yes'`;
        const upid = `stid  = '${id}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [
          updateFieldsValues2,
          upid,
        ]);
      }
      if (type === "overduetasks") {
        const updateFieldsValues3 = `tdue_date_clear = 'yes'`;
        const upid = `tid  = '${id}'`;
        await pool.execute("CALL UpdateTask(?, ?)", [
          updateFieldsValues3,
          upid,
        ]);
      }
      if (type === "overduesubtasks") {
        const updateFieldsValues4 = `stdue_date_clear = 'yes'`;
        const upid = `stid  = '${id}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [
          updateFieldsValues4,
          upid,
        ]);
      }
      if (type === "reviewtasks") {
        const updateFieldsValues5 = `review_clear = 'yes'`;
        const upid = `tid  = '${id}'`;
        await pool.execute("CALL UpdateTask(?, ?)", [
          updateFieldsValues5,
          upid,
        ]);
      }
      if (type === "reviewsubtasks") {
        const updateFieldsValues6 = `sreview_clear = 'yes'`;
        const upid = `stid  = '${id}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [
          updateFieldsValues6,
          upid,
        ]);
      }
      if (type === "reviewarrivetasks") {
        const updateFieldsValues7 = `po_review_clear = 'yes'`;
        const upid = `tid  = '${id}'`;
        await pool.execute("CALL UpdateTask(?, ?)", [
          updateFieldsValues7,
          upid,
        ]);
      }
      if (type === "reviewarrivesubtasks") {
        const updateFieldsValues8 = `po_sreview_clear = 'yes'`;
        const upid = `stid  = '${id}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [
          updateFieldsValues8,
          upid,
        ]);
      }
      if (type === "pendingprojectrequest") {
        const updateFieldsValues9 = `sent_notify_clear = 'yes'`;
        const upid = `pm_id  = '${id}'`;
        await pool.execute("CALL UpdateProjectMembers(?, ?)", [
          updateFieldsValues9,
          upid,
        ]);
      }
      if (type === "portfolioaccepted") {
        const updateFieldsValues10 = `status_notify_clear = 'yes'`;
        const upid = `pim_id  = '${id}'`;
        await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
          updateFieldsValues10,
          upid,
        ]);
      }
      if (type === "projectaccepted") {
        const updateFieldsValues11 = `status_notify_clear = 'yes'`;
        const upid = `pm_id  = '${id}'`;
        await pool.execute("CALL UpdateProjectMembers(?, ?)", [
          updateFieldsValues11,
          upid,
        ]);
      }
      if (type === "projectacceptedinvite") {
        const updateFieldsValues12 = `status_notify_clear = 'yes'`;
        const upid = `im_id  = '${id}'`;
        await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [
          updateFieldsValues12,
          upid,
        ]);
      }
      if (type === "membershiprequested") {
        const updateFieldsValues13 = `mreq_notify = 'seen', mreq_notify_clear = 'yes'`;
        const upid = `req_id  = '${id}'`;
        await pool.execute("CALL UpdateProjectRequestMember(?, ?)", [
          updateFieldsValues13,
          upid,
        ]);
      }
      if (type === "pendinggoalrequest") {
        const updateFieldsValues14 = `sent_notify_clear = 'yes'`;
        const upid = `gmid  = '${id}'`;
        await pool.execute("CALL UpdateGoalsMembers(?, ?)", [
          updateFieldsValues14,
          upid,
        ]);
      }
      if (type === "projectfiles") {
        const [rows] = await pool.execute("CALL pfile_detail(?)", [id]);
        if (rows && rows[0] && rows[0][0]) {
          const p_files = rows[0][0].pfnotify_clear.split(",");
          const index = p_files.indexOf(user_id);

          if (index !== -1) {
            p_files.splice(index, 1);
          }

          const final_mem = p_files.join(",");
          const updateFieldsValues15 = `pfnotify_clear = '${final_mem}'`;
          const upid = `pfile_id  = '${id}'`;
          await pool.execute("CALL UpdateProjectFiles(?, ?)", [
            updateFieldsValues15,
            upid,
          ]);
        }
      }
      if (type === "tasksfiles") {
        const [rows] = await pool.execute("CALL getTasksDetail(?)", [id]);
        if (rows && rows[0] && rows[0][0]) {
          const t_files = rows[0][0].tfnotify_clear.split(",");
          const index = t_files.indexOf(user_id);

          if (index !== -1) {
            t_files.splice(index, 1);
          }

          const final_tmem = t_files.join(",");
          const updateFieldsValues16 = `tfnotify_clear = '${final_tmem}'`;
          const upid = `tid  = '${id}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues16,
            upid,
          ]);
        }
      }
      if (type === "subtasksfiles") {
        const [rows] = await pool.execute("CALL getSubtasksDetail(?)", [id]);
        if (rows && rows[0] && rows[0][0]) {
          const st_files = rows[0][0].stfnotify_clear.split(",");
          const index = st_files.indexOf(user_id);

          if (index !== -1) {
            st_files.splice(index, 1);
          }

          const final_stmem = st_files.join(",");
          const updateFieldsValues17 = `stfnotify_clear = '${final_stmem}'`;
          const upid = `stid  = '${id}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues17,
            upid,
          ]);
        }
      }
      if (type === "newprojectcomment") {
        const [rows] = await pool.execute("CALL get_comment(?)", [id]);
        if (rows && rows[0] && rows[0][0]) {
          const p_comments = rows[0][0].c_notify_clear.split(",");
          const index = p_comments.indexOf(user_id);

          if (index !== -1) {
            p_comments.splice(index, 1);
          }

          const final_mem = p_comments.join(",");
          const updateFieldsValues18 = `c_notify_clear = '${final_mem}'`;
          const upid = `project_id  = '${rows[0][0].project_id}'`;
          await pool.execute("CALL UpdateComments(?, ?)", [
            updateFieldsValues18,
            upid,
          ]);
        }
      }

      res.status(200).json({ message: "Removed successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//update bell icon clear all alert notifications by user_id
router.patch(
  "/user/update-all-alert-notifications/:user_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    try {
      const currentDate = new Date();
      const getdate = currentDate.toISOString().split("T")[0];

      //newtasks
      const [get_newTaskbySessIDRes] = await pool.execute(
        "CALL get_newTaskbySessID(?)",
        [user_id]
      );
      if (get_newTaskbySessIDRes && get_newTaskbySessIDRes[0]) {
        const ResultSet = get_newTaskbySessIDRes[0];
        for (const gres of ResultSet) {
          const id1 = gres.tid;
          const updateFieldsValues1 = `tnotify_clear = 'yes'`;
          const upid = `tid  = '${id1}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues1,
            upid,
          ]);
        }
      }

      //newsubtasks
      const [get_newSubtaskbySessIDRes] = await pool.execute(
        "CALL get_newSubtaskbySessID(?)",
        [user_id]
      );
      if (get_newSubtaskbySessIDRes && get_newSubtaskbySessIDRes[0]) {
        const ResultSet = get_newSubtaskbySessIDRes[0];
        for (const gres of ResultSet) {
          const id2 = gres.stid;
          const updateFieldsValues2 = `stnotify_clear = 'yes'`;
          const upid = `stid  = '${id2}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues2,
            upid,
          ]);
        }
      }

      //overduetasks
      const [get_oduetaskbySessIDRes] = await pool.execute(
        "CALL get_oduetaskbySessID(?,?)",
        [user_id, getdate]
      );
      if (get_oduetaskbySessIDRes && get_oduetaskbySessIDRes[0]) {
        const ResultSet = get_oduetaskbySessIDRes[0];
        for (const gres of ResultSet) {
          const id3 = gres.tid;
          const updateFieldsValues3 = `tdue_date_clear = 'yes'`;
          const upid = `tid  = '${id3}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues3,
            upid,
          ]);
        }
      }

      //overduesubtasks
      const [get_oduesubtaskbySessIDRes] = await pool.execute(
        "CALL get_oduesubtaskbySessID(?,?)",
        [user_id, getdate]
      );
      if (get_oduesubtaskbySessIDRes && get_oduesubtaskbySessIDRes[0]) {
        const ResultSet = get_oduesubtaskbySessIDRes[0];
        for (const gres of ResultSet) {
          const id4 = gres.stid;
          const updateFieldsValues4 = `stdue_date_clear = 'yes'`;
          const upid = `stid  = '${id4}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues4,
            upid,
          ]);
        }
      }
      //reviewtasks
      const [get_taskreviewbySessIDRes] = await pool.execute(
        "CALL get_taskreviewbySessID(?)",
        [user_id]
      );
      if (get_taskreviewbySessIDRes && get_taskreviewbySessIDRes[0]) {
        const ResultSet = get_taskreviewbySessIDRes[0];
        for (const gres of ResultSet) {
          const id5 = gres.tid;
          const updateFieldsValues5 = `review_clear = 'yes'`;
          const upid = `tid  = '${id5}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues5,
            upid,
          ]);
        }
      }
      //reviewsubtasks
      const [get_subtaskreviewbySessIDRes] = await pool.execute(
        "CALL get_subtaskreviewbySessID(?)",
        [user_id]
      );
      if (get_subtaskreviewbySessIDRes && get_subtaskreviewbySessIDRes[0]) {
        const ResultSet = get_subtaskreviewbySessIDRes[0];
        for (const gres of ResultSet) {
          const id6 = gres.stid;
          const updateFieldsValues6 = `sreview_clear = 'yes'`;
          const upid = `stid  = '${id6}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues6,
            upid,
          ]);
        }
      }
      //reviewarrivetasks
      const [get_taskarrivereviewbySessIDRes] = await pool.execute(
        "CALL get_taskarrivereviewbySessID(?)",
        [user_id]
      );
      if (
        get_taskarrivereviewbySessIDRes &&
        get_taskarrivereviewbySessIDRes[0]
      ) {
        const ResultSet = get_taskarrivereviewbySessIDRes[0];
        for (const gres of ResultSet) {
          const id7 = gres.tid;
          const updateFieldsValues7 = `po_review_clear = 'yes'`;
          const upid = `tid  = '${id7}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues7,
            upid,
          ]);
        }
      }
      //reviewarrivesubtasks
      const [get_subtaskarrivereviewbySessIDRes] = await pool.execute(
        "CALL get_subtaskarrivereviewbySessID(?)",
        [user_id]
      );
      if (
        get_subtaskarrivereviewbySessIDRes &&
        get_subtaskarrivereviewbySessIDRes[0]
      ) {
        const ResultSet = get_subtaskarrivereviewbySessIDRes[0];
        for (const gres of ResultSet) {
          const id8 = gres.stid;
          const updateFieldsValues8 = `po_sreview_clear = 'yes'`;
          const upid = `stid  = '${id8}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues8,
            upid,
          ]);
        }
      }
      //pendingprojectrequest
      const [get_pendingprojbySessIDRes] = await pool.execute(
        "CALL get_pendingprojbySessID(?)",
        [user_id]
      );
      if (get_pendingprojbySessIDRes && get_pendingprojbySessIDRes[0]) {
        const ResultSet = get_pendingprojbySessIDRes[0];
        for (const gres of ResultSet) {
          const id9 = gres.pm_id;
          const updateFieldsValues9 = `sent_notify_clear = 'yes'`;
          const upid = `pm_id  = '${id9}'`;
          await pool.execute("CALL UpdateProjectMembers(?, ?)", [
            updateFieldsValues9,
            upid,
          ]);
        }
      }
      //portfolioaccepted
      const [check_portfolio_accepted_notify_clearRes] = await pool.execute(
        "CALL check_portfolio_accepted_notify_clear(?)",
        [user_id]
      );
      if (
        check_portfolio_accepted_notify_clearRes &&
        check_portfolio_accepted_notify_clearRes[0]
      ) {
        const ResultSet = check_portfolio_accepted_notify_clearRes[0];
        for (const gres of ResultSet) {
          const id10 = gres.pim_id;
          const updateFieldsValues10 = `status_notify_clear = 'yes'`;
          const upid = `pim_id  = '${id10}'`;
          await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
            updateFieldsValues10,
            upid,
          ]);
        }
      }
      //projectaccepted
      const [check_project_accepted_notify_clearRes] = await pool.execute(
        "CALL check_project_accepted_notify_clear(?)",
        [user_id]
      );
      if (
        check_project_accepted_notify_clearRes &&
        check_project_accepted_notify_clearRes[0]
      ) {
        const ResultSet = check_project_accepted_notify_clearRes[0];
        for (const gres of ResultSet) {
          const id11 = gres.pm_id;
          const updateFieldsValues11 = `status_notify_clear = 'yes'`;
          const upid = `pm_id  = '${id11}'`;
          await pool.execute("CALL UpdateProjectMembers(?, ?)", [
            updateFieldsValues11,
            upid,
          ]);
        }
      }
      //projectacceptedinvite
      const [check_project_invite_accepted_notify_clearRes] =
        await pool.execute(
          "CALL check_project_invite_accepted_notify_clear(?)",
          [user_id]
        );
      if (
        check_project_invite_accepted_notify_clearRes &&
        check_project_invite_accepted_notify_clearRes[0]
      ) {
        const ResultSet = check_project_invite_accepted_notify_clearRes[0];
        for (const gres of ResultSet) {
          const id12 = gres.im_id;
          const updateFieldsValues12 = `status_notify_clear = 'yes'`;
          const upid = `im_id  = '${id12}'`;
          await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [
            updateFieldsValues12,
            upid,
          ]);
        }
      }
      //membershiprequested
      const [check_project_request_member_notify_clearRes] = await pool.execute(
        "CALL check_project_request_member_notify_clear(?)",
        [user_id]
      );
      if (
        check_project_request_member_notify_clearRes &&
        check_project_request_member_notify_clearRes[0]
      ) {
        const ResultSet = check_project_request_member_notify_clearRes[0];
        for (const gres of ResultSet) {
          const id13 = gres.req_id;
          const updateFieldsValues13 = `mreq_notify = 'seen', mreq_notify_clear = 'yes'`;
          const upid = `req_id  = '${id13}'`;
          await pool.execute("CALL UpdateProjectRequestMember(?, ?)", [
            updateFieldsValues13,
            upid,
          ]);
        }
      }
      //pendinggoalrequest
      const [get_pendinggoalbySessIDRes] = await pool.execute(
        "CALL get_pendinggoalbySessID(?)",
        [user_id]
      );
      if (get_pendinggoalbySessIDRes && get_pendinggoalbySessIDRes[0]) {
        const ResultSet = get_pendinggoalbySessIDRes[0];
        for (const gres of ResultSet) {
          const id14 = gres.gmid;
          const updateFieldsValues14 = `sent_notify_clear = 'yes'`;
          const upid = `gmid  = '${id14}'`;
          await pool.execute("CALL UpdateGoalsMembers(?, ?)", [
            updateFieldsValues14,
            upid,
          ]);
        }
      }
      //projectfiles
      const [get_projfilebySessIDRes] = await pool.execute(
        "CALL get_projfilebySessID()"
      );
      if (get_projfilebySessIDRes && get_projfilebySessIDRes[0]) {
        const ResultSet = get_projfilebySessIDRes[0];
        for (const gres of ResultSet) {
          const id15 = gres.pfile_id;
          const p_files = gres.pfnotify_clear.split(",");
          const index = p_files.indexOf(user_id);

          if (index !== -1) {
            p_files.splice(index, 1);
          }

          const final_mem = p_files.join(",");
          const updateFieldsValues15 = `pfnotify_clear = '${final_mem}'`;
          const upid = `pfile_id  = '${id15}'`;
          await pool.execute("CALL UpdateProjectFiles(?, ?)", [
            updateFieldsValues15,
            upid,
          ]);
        }
      }
      //tasksfiles
      const [get_taskfilebySessIDRes] = await pool.execute(
        "CALL get_taskfilebySessID()"
      );
      if (get_taskfilebySessIDRes && get_taskfilebySessIDRes[0]) {
        const ResultSet = get_taskfilebySessIDRes[0];
        for (const gres of ResultSet) {
          const id16 = gres.tid;
          const t_files = gres.tfnotify_clear.split(",");
          const index = t_files.indexOf(user_id);

          if (index !== -1) {
            t_files.splice(index, 1);
          }

          const final_tmem = t_files.join(",");
          const updateFieldsValues16 = `tfnotify_clear = '${final_tmem}'`;
          const upid = `tid  = '${id16}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues16,
            upid,
          ]);
        }
      }
      //subtasksfiles
      const [get_subtaskfilebySessIDRes] = await pool.execute(
        "CALL get_subtaskfilebySessID()"
      );
      if (get_subtaskfilebySessIDRes && get_subtaskfilebySessIDRes[0]) {
        const ResultSet = get_subtaskfilebySessIDRes[0];
        for (const gres of ResultSet) {
          const id17 = gres.stid;
          const st_files = gres.stfnotify_clear.split(",");
          const index = st_files.indexOf(user_id);

          if (index !== -1) {
            st_files.splice(index, 1);
          }

          const final_stmem = st_files.join(",");
          const updateFieldsValues17 = `stfnotify_clear = '${final_stmem}'`;
          const upid = `stid  = '${id17}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues17,
            upid,
          ]);
        }
      }
      //newprojectcomment
      const [get_projectcommentbySessIDRes] = await pool.execute(
        "CALL get_projectcommentbySessID()"
      );
      if (get_projectcommentbySessIDRes && get_projectcommentbySessIDRes[0]) {
        const ResultSet = get_projectcommentbySessIDRes[0];
        for (const gres of ResultSet) {
          const id18 = gres.project_id;
          const p_comments = gres.c_notify_clear.split(",");
          const index = p_comments.indexOf(user_id);

          if (index !== -1) {
            p_comments.splice(index, 1);
          }

          const final_mem = p_comments.join(",");
          const updateFieldsValues18 = `c_notify_clear = '${final_mem}'`;
          const upid = `project_id  = '${id18}'`;
          await pool.execute("CALL UpdateComments(?, ?)", [
            updateFieldsValues18,
            upid,
          ]);
        }
      }

      res.status(200).json({ message: "Removed successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//My Alert Page API's
router.get("/user/get-my-alert-notifications/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const currentDate = new Date();
    const getdate = currentDate.toISOString().split("T")[0];

    //New task assigned
    const [rows1] = await pool.execute("CALL task_notification(?)", [id]);
    const NewTasks = rows1[0];

    //New Subtask assigned
    const [rows2] = await pool.execute("CALL subtask_notification(?)", [id]);
    const NewSubtask = rows2[0];

    //Overdue task assigned
    const [rows3] = await pool.execute("CALL OverdueTasksDashboard(?,?)", [
      getdate,
      id,
    ]);
    const OverdueTasks = rows3[0];

    //Overdue Subtask assigned
    const [rows4] = await pool.execute("CALL OverdueSubtasksDashboard(?,?)", [
      getdate,
      id,
    ]);
    const OverdueSubtask = rows4[0];

    //Sent to review task
    const [rows5] = await pool.execute("CALL check_task_review_sent(?)", [id]);
    const SentToReviewTasks = rows5[0];

    //Review denied task
    const [rows6] = await pool.execute("CALL check_task_review_deny(?)", [id]);
    const ReviewDeniedTasks = rows6[0];

    //Review approved task
    const [rows7] = await pool.execute("CALL check_task_review_approve(?)", [
      id,
    ]);
    const ReviewApprovedTasks = rows7[0];

    //Sent to review subtask
    const [rows8] = await pool.execute("CALL check_subtask_review_sent(?)", [
      id,
    ]);
    const SentToReviewSubtasks = rows8[0];

    //Review denied subtask
    const [rows9] = await pool.execute("CALL check_subtask_review_deny(?)", [
      id,
    ]);
    const ReviewDeniedSubtasks = rows9[0];

    //Review approved subtask
    const [rows10] = await pool.execute(
      "CALL check_subtask_review_approve(?)",
      [id]
    );
    const ReviewApprovedSubtasks = rows10[0];

    //Task Review Arrive
    const [rows11] = await pool.execute("CALL check_task_arrive_review(?)", [
      id,
    ]);
    const ReviewArriveTasks = rows11[0];

    //Subtask Review Arrive
    const [rows12] = await pool.execute("CALL check_subtask_arrive_review(?)", [
      id,
    ]);
    const ReviewArriveSubtasks = rows12[0];

    //Project pending request
    const [rows13] = await pool.execute("CALL PendingProjectList(?)", [id]);
    const PendingProjectRequest = rows13[0];

    //Portfolio accepted notify
    const [rows14] = await pool.execute(
      "CALL check_portfolio_accepted_notify(?)",
      [id]
    );
    const PortfolioAccepted = rows14[0];

    //Project accepted notify
    const [rows15] = await pool.execute(
      "CALL check_project_accepted_notify(?)",
      [id]
    );
    const ProjectAccepted = rows15[0];

    //Project accepted invite notify
    const [rows16] = await pool.execute(
      "CALL check_project_invite_accepted_notify(?)",
      [id]
    );
    const ProjectAcceptedInvite = rows16[0];

    //Goal pending request
    const [rows18] = await pool.execute("CALL PendingGoalList(?)", [id]);
    const PendingGoalRequest = rows18[0];

    //My created projects
    const [cprojects] = await pool.execute("CALL ProjectList(?)", [id]);
    const cprojectsRes = cprojects[0];

    //My accepted projects
    const [aprojects] = await pool.execute("CALL AcceptedProjectList(?)", [id]);
    const aprojectsRes = aprojects[0];

    let ProjectFiles = [];
    let TasksFiles = [];
    let SubtasksFiles = [];
    let NewProjectComment = [];

    if (cprojectsRes) {
      await Promise.all(
        cprojectsRes.map(async (item) => {
          const pid = item.pid;
          // Project file notify
          try {
            const [rows19] = await pool.execute("CALL ProjectFile(?)", [pid]);
            const CProjectFile = rows19[0];

            if (
              CProjectFile &&
              CProjectFile[0] &&
              CProjectFile[0].pfnotify &&
              CProjectFile[0].pcreated_by !== id
            ) {
              const c_pfn = CProjectFile[0].pfnotify.split(",");

              if (c_pfn.includes(id)) {
                ProjectFiles.push(CProjectFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // Task file notify
          try {
            const [rows21] = await pool.execute("CALL getTasksProject(?)", [
              pid,
            ]);
            const CTasksFile = rows21[0];

            if (CTasksFile && CTasksFile[0] && CTasksFile[0].tfnotify) {
              const c_ptnew = CTasksFile[0].tfnotify.split(",");

              if (c_ptnew.includes(id)) {
                TasksFiles.push(CTasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // Subtask file notify
          try {
            const [rows23] = await pool.execute("CALL getSubtasksProject(?)", [
              pid,
            ]);
            const CSubtasksFile = rows23[0];

            if (
              CSubtasksFile &&
              CSubtasksFile[0] &&
              CSubtasksFile[0].stfnotify
            ) {
              const c_pstnew = CSubtasksFile[0].stfnotify.split(",");

              if (c_pstnew.includes(id)) {
                SubtasksFiles.push(CSubtasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // New Comment in Project
          try {
            const [rows26] = await pool.execute("CALL ProjectComment(?)", [
              pid,
            ]);
            const CProjectComment = rows26[0];
            let check_proj = "";

            if (
              CProjectComment.length > 0 &&
              CProjectComment[0] &&
              CProjectComment[0].c_notify
            ) {
              const c_pcn = CProjectComment[0].c_notify.split(",");

              if (c_pcn.includes(id.toString())) {
                const filteredComments = CProjectComment.filter((comment) =>
                  comment.c_notify.includes(id.toString())
                );

                if (
                  filteredComments.length > 0 &&
                  check_proj != CProjectComment[0].project_id
                ) {
                  // Additional condition to check if project_id is the same
                  const uniqueProjectComment = filteredComments.reduce(
                    (acc, comment) => {
                      if (
                        !acc.some((c) => c.project_id === comment.project_id)
                      ) {
                        acc.push(comment);
                      }
                      return acc;
                    },
                    []
                  );

                  NewProjectComment.push(uniqueProjectComment);
                }
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
            const [rows20] = await pool.execute("CALL ProjectFile(?)", [pid]);
            const AProjectFile = rows20[0];

            if (
              AProjectFile &&
              AProjectFile[0] &&
              AProjectFile[0].pfnotify &&
              AProjectFile[0].pcreated_by !== id
            ) {
              const a_pfn = AProjectFile[0].pfnotify.split(",");

              if (a_pfn.includes(id)) {
                ProjectFiles.push(AProjectFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // Task file notify
          try {
            const [rows22] = await pool.execute("CALL getTasksProject(?)", [
              pid,
            ]);
            const ATasksFile = rows22[0];

            if (ATasksFile && ATasksFile[0] && ATasksFile[0].tfnotify) {
              const a_ptnew = ATasksFile[0].tfnotify.split(",");

              if (a_ptnew.includes(id)) {
                TasksFiles.push(ATasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // Subtask file notify
          try {
            const [rows24] = await pool.execute("CALL getSubtasksProject(?)", [
              pid,
            ]);
            const ASubtasksFile = rows24[0];

            if (
              ASubtasksFile &&
              ASubtasksFile[0] &&
              ASubtasksFile[0].stfnotify
            ) {
              const a_pstnew = ASubtasksFile[0].stfnotify.split(",");

              if (a_pstnew.includes(id)) {
                SubtasksFiles.push(ASubtasksFile);
              }
            }
          } catch (error) {
            console.error("Error executing stored procedure:", error);
          }

          // New Comment in Project
          try {
            const [rows26] = await pool.execute("CALL ProjectComment(?)", [
              pid,
            ]);
            const AProjectComment = rows26[0];
            let check_aproj = "";

            if (
              AProjectComment.length > 0 &&
              AProjectComment[0] &&
              AProjectComment[0].c_notify
            ) {
              const a_pcn = AProjectComment[0].c_notify.split(",");

              if (a_pcn.includes(id.toString())) {
                const filteredComments = AProjectComment.filter((comment) =>
                  comment.c_notify.includes(id.toString())
                );

                if (
                  filteredComments.length > 0 &&
                  check_aproj != AProjectComment[0].project_id
                ) {
                  // Additional condition to check if project_id is the same
                  const uniqueProjectComment = filteredComments.reduce(
                    (acc, comment) => {
                      if (
                        !acc.some((c) => c.project_id === comment.project_id)
                      ) {
                        acc.push(comment);
                      }
                      return acc;
                    },
                    []
                  );

                  NewProjectComment.push(uniqueProjectComment);
                }
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
    NewProjectComment = NewProjectComment.filter((array) => array.length > 0);

    res.status(200).json({
      NewTasksResult: NewTasks,
      NewSubtaskResult: NewSubtask,
      OverdueTasksResult: OverdueTasks,
      OverdueSubtaskResult: OverdueSubtask,
      SentToReviewTasksResult: SentToReviewTasks,
      ReviewDeniedTasksResult: ReviewDeniedTasks,
      ReviewApprovedTasksResult: ReviewApprovedTasks,
      SentToReviewSubtasksResult: SentToReviewSubtasks,
      ReviewDeniedSubtasksResult: ReviewDeniedSubtasks,
      ReviewApprovedSubtasksResult: ReviewApprovedSubtasks,
      ReviewArriveTasksResult: ReviewArriveTasks,
      ReviewArriveSubtasksResult: ReviewArriveSubtasks,
      PendingProjectRequestResult: PendingProjectRequest,
      PortfolioAcceptedResult: PortfolioAccepted,
      ProjectAcceptedResult: ProjectAccepted,
      ProjectAcceptedInviteResult: ProjectAcceptedInvite,
      PendingGoalRequestResult: PendingGoalRequest,
      ProjectFilesResult: ProjectFiles.flat(),
      TasksFilesResult: TasksFiles.flat(),
      SubtasksFilesResult: SubtasksFiles.flat(),
      NewProjectCommentResult: NewProjectComment.flat(),
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
