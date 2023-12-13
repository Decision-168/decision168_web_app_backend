const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const {
  convertObjectToProcedureParams,
  dateConversion,
  transporter,
} = require("../utils/common-functions");
const moment = require("moment");
const generateEmailTemplate = require("../utils/emailTemplate");
const { default: isEmail } = require("validator/lib/isEmail");

//Project List
router.get(
  "/project/get-project-list/:user_id/:portfolio_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [regularList] = await pool.execute(
        "CALL ProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      const [acceptedList] = await pool.execute(
        "CALL AcceptedProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      const [pendingList] = await pool.execute(
        "CALL PendingProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      const [readMoreList] = await pool.execute(
        "CALL ReadMoreProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      res.status(200).json({
        projectRegularList: regularList,
        projectAcceptedList: acceptedList,
        projectPendingList: pendingList,
        projectReadMoreList: readMoreList
      });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//AcceptedProjectListByPortfolioRegular
router.get(
  "/project/get-accepted-project-list/:user_id/:portfolio_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows] = await pool.execute(
        "CALL AcceptedProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//PendingProjectListByPortfolioRegular
router.get(
  "/project/get-pending-project-list/:user_id/:portfolio_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows] = await pool.execute(
        "CALL PendingProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//ReadMoreProjectListByPortfolioRegular
router.get(
  "/project/get-readmore-project-list/:user_id/:portfolio_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows] = await pool.execute(
        "CALL ReadMoreProjectListByPortfolioRegular(?,?)",
        [portfolio_id, user_id]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//ProjectTeamMember
router.get("/project/project-team-member/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL ProjectTeamMember(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//ProjectDetail
router.get("/project/project-detail/:user_id/:pid", async (req, res) => {
  const user_id = req.params.user_id;
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL ProjectDetail(?,?)", [
      pid,
      user_id,
    ]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getProjectComments
router.get("/project/get-project-comments/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL getProjectComments(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//view_history_date
router.get("/project/view-history-date-project/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL view_history_date(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//ProjectFile
router.get("/project/project-file/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL ProjectFile(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//edit_project_files_notify
router.patch(
  "/project/edit-project-files-notify/:pfile_id",
  async (req, res) => {
    const pfile_id = req.params.pfile_id;
    const final_mem = req.body.final_mem;
    try {
      const otherFields = {
        pfnotify: final_mem,
        pfnotify_clear: final_mem,
      };
      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL UpdateProjectFiles('${formattedParams}', 'pfile_id = ${pfile_id}')`;
      await pool.execute(storedProcedure);
      res.status(200).json({ message: "updated successfully" });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//get_project_accepted_notification
router.get(
  "/project/get-project-accepted-notification/:user_id/:pm_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const pm_id = req.params.pm_id;
    try {
      const [rows] = await pool.execute(
        "CALL get_project_accepted_notification(?,?)",
        [user_id, pm_id]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//edit_project_members_notify
router.patch(
  "/project/edit-project-members-notify/:pm_id",
  async (req, res) => {
    const pm_id = req.params.pm_id;
    try {
      const updateFieldsValues = `status_notify = 'seen'`;
      const upid = `pm_id  = '${pm_id}'`;
      await pool.execute("CALL UpdateProjectMembers(?, ?)", [
        updateFieldsValues,
        upid,
      ]);
      res.status(200).json({ message: "updated successfully" });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//InvitedProjectMember
router.get("/project/project-invited-member/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL InvitedProjectMember(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//edit_project_invite_members_notify
router.patch(
  "/project/edit-project-invite-members-notify/:im_id",
  async (req, res) => {
    const im_id = req.params.im_id;
    try {
      const updateFieldsValues = `status_notify = 'seen'`;
      const upid = `im_id  = '${im_id}'`;
      await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [
        updateFieldsValues,
        upid,
      ]);
      res.status(200).json({ message: "updated successfully" });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//check_project_membership_notify
router.get(
  "/project/project-invited-member/:user_id/:pid",
  async (req, res) => {
    const user_id = req.params.user_id;
    const pid = req.params.pid;
    try {
      const [rows] = await pool.execute(
        "CALL check_project_membership_notify(?,?)",
        [user_id, pid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//edit_project_membership_req_notify
router.patch(
  "/project/edit-project-membership-req-notify/:req_id",
  async (req, res) => {
    const req_id = req.params.req_id;
    try {
      const otherFields = {
        mreq_notify: "seen",
        mreq_notify_clear: "yes",
      };
      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL UpdateProjectRequestMember('${formattedParams}', 'req_id  = ${req_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "updated successfully" });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//edit_project_comments_notify
router.patch("/project/edit-project-comments-notify/:cid", async (req, res) => {
  const cid = req.params.cid;
  const final_mem = req.body.final_mem;
  try {
    const otherFields = {
      c_notify: final_mem,
      c_notify_clear: final_mem,
    };
    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL UpdateComments('${formattedParams}', 'cid = ${cid}')`;
    await pool.execute(storedProcedure);
    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getProject_TaskCount
router.get(
  "/project/get-project-task-count/:user_id/:pid",
  async (req, res) => {
    const user_id = req.params.user_id;
    const pid = req.params.pid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL getProject_TaskCount(?,?)",
        [user_id, pid]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//check_edit_request
router.get("/project/check-edit-request/:user_id/:pid", async (req, res) => {
  const user_id = req.params.user_id;
  const pid = req.params.pid;
  try {
    const [rows, fields] = await pool.execute("CALL check_edit_request(?,?)", [
      pid,
      user_id,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getAccepted_ProjTM
router.get(
  "/project/get-accepted-project-team-member/:pid",
  async (req, res) => {
    const { pid } = req.params;
    try {
      const [rows] = await pool.execute("CALL getAccepted_ProjTM(?)", [pid]);
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//getProjectById
router.get("/project/get-project-by-id/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getProjectById(?)", [pid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//progress_done3
router.get(
  "/project/get-project-member-task-progress-done/:pid/:member_id",
  async (req, res) => {
    const pid = req.params.pid;
    const member_id = req.params.member_id;
    try {
      const [rows, fields] = await pool.execute("CALL progress_done3(?,?)", [
        pid,
        member_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//progress_total3
router.get(
  "/project/get-project-member-task-progress-total/:pid/:member_id",
  async (req, res) => {
    const pid = req.params.pid;
    const member_id = req.params.member_id;
    try {
      const [rows, fields] = await pool.execute("CALL progress_total3(?,?)", [
        pid,
        member_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//sub_progress_done3
router.get(
  "/project/get-project-member-subtask-progress-done/:pid/:member_id",
  async (req, res) => {
    const pid = req.params.pid;
    const member_id = req.params.member_id;
    try {
      const [rows, fields] = await pool.execute(
        "CALL sub_progress_done3(?,?)",
        [pid, member_id]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//sub_progress_total3
router.get(
  "/project/get-project-member-subtask-progress-total/:pid/:member_id",
  async (req, res) => {
    const pid = req.params.pid;
    const member_id = req.params.member_id;
    try {
      const [rows, fields] = await pool.execute(
        "CALL sub_progress_total3(?,?)",
        [pid, member_id]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getTasksProjectLinks
router.get("/project/get-project-tasks-links/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows, fields] = await pool.execute("CALL getTasksProjectLinks(?)", [
      pid,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getSubtasksProjectLinks
router.get("/project/get-project-subtasks-links/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows, fields] = await pool.execute(
      "CALL getSubtasksProjectLinks(?)",
      [pid]
    );
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//TaskFile
router.get("/project/task-file/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL TaskFile(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//SubtaskFile
router.get("/project/subtask-file/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL SubtaskFile(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//SuggestedProjectMember
router.get("/project/project-suggested-member/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL SuggestedProjectMember(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//SuggestedInviteProjectMember
router.get(
  "/project/project-suggested-invite-member/:pid",
  async (req, res) => {
    const pid = req.params.pid;
    try {
      const [rows] = await pool.execute(
        "CALL SuggestedInviteProjectMember(?)",
        [pid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getPortfolioMemberCount
router.get(
  "/project/get-portfolio-member-count/:user_id/:portfolio_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute(
        "CALL getPortfolioMemberCount(?,?)",
        [user_id, portfolio_id]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//RequestAsProjectMember
router.get("/project/request-as-project-member/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL RequestAsProjectMember(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//MentionList
router.get("/project/mention-list/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL MentionList(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getTasksbyID
router.get("/project/get-tasks-by-id/:tid", async (req, res) => {
  const { tid } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getTasksbyID(?)", [tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getSubtasksbyID
router.get("/project/get-subtasks-by-id/:stid", async (req, res) => {
  const { stid } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getSubtasksbyID(?)", [
      stid,
    ]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//check_pm
router.get(
  "/project/check-gm/:user_id/:pid/:portfolio_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    const pid = req.params.pid;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute("CALL check_pm(?,?,?)", [
        pid,
        portfolio_id,
        user_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//ProjectDetailAccepted
router.get(
  "/project/project-detail-accepted/:user_id/:pid",
  async (req, res) => {
    const user_id = req.params.user_id;
    const pid = req.params.pid;
    try {
      const [rows] = await pool.execute("CALL ProjectDetailAccepted(?,?)", [
        pid,
        user_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//check_edit_permission
router.get(
  "/project/check-edit-permission/:member_id/:pid",
  async (req, res) => {
    const member_id = req.params.member_id;
    const pid = req.params.pid;
    try {
      const [rows] = await pool.execute("CALL check_edit_permission(?,?)", [
        pid,
        member_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//MentionListforAccepted
router.get(
  "/project/accepted-project-mention-list/:pid/:member_id",
  async (req, res) => {
    const pid = req.params.pid;
    const member_id = req.params.member_id;
    try {
      const [rows] = await pool.execute("CALL MentionListforAccepted(?,?)", [
        pid,
        member_id,
      ]);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//ProjectDetailRequest
router.get(
  "/project/project-detail-request/:user_id/:pid",
  async (req, res) => {
    const user_id = req.params.user_id;
    const pid = req.params.pid;
    try {
      const [rows] = await pool.execute("CALL ProjectDetailRequest(?,?)", [
        pid,
        user_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//portfolio_projects_list
router.get(
  "/project/portfolio-projects-list/:portfolio_id",
  async (req, res) => {
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows] = await pool.execute("CALL portfolio_projectsRegular(?)", [
        portfolio_id,
      ]);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//ProjectListRegular
router.get("/project/get-my-project-list/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const [rows] = await pool.execute("CALL ProjectListRegular(?)", [user_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//AcceptedProjectListRegular
router.get(
  "/project/get-my-accepted-project-list/:user_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    try {
      const [rows] = await pool.execute("CALL AcceptedProjectListRegular(?)", [
        user_id,
      ]);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//PendingProjectListRegular
router.get(
  "/project/get-my-pending-project-list/:user_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    try {
      const [rows] = await pool.execute("CALL PendingProjectListRegular(?)", [
        user_id,
      ]);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//ReadMoreProjectListRegular
router.get(
  "/project/get-my-readmore-project-list/:user_id",
  async (req, res) => {
    const user_id = req.params.user_id;
    try {
      const [rows] = await pool.execute("CALL ReadMoreProjectListRegular(?)", [
        user_id,
      ]);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//InsertProject
router.post("/project/insert-project", async (req, res) => {
  try {
    let { portfolio_id } = req.body;
    let { pcreated_by } = req.body;
    let { pname } = req.body;
    let { gid, sid } = req.body;

    let get_gid = "";
    if (gid != "") {
      get_gid = gid;
    }

    let get_sid = "";
    if (sid != "") {
      get_sid = sid;
    }

    const { team_member, imemail, pfile, ...otherFields } = req.body;

    const formattedDate = dateConversion();

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      pcreated_by,
    ]);
    const powner = check_powner[0][0];

    const additionalFields = {
      pcreated_date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertProject(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [getProjectRes] = await pool.execute("CALL GetInsertedProject(?)", [
      pcreated_by,
    ]);
    const getProject = getProjectRes[0][0];

    const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
      portfolio_id,
    ]);
    const PortfolioName = getPortfolio[0][0]?.portfolio_name;

    const hdata = {
      pid: getProject.pid,
      sid: get_sid,
      gid: get_gid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Project Created By ${powner.first_name} ${powner.last_name}`,
    };

    const paramNamesString1 = Object.keys(hdata).join(", ");
    const paramValuesString1 = Object.values(hdata)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [
      paramNamesString1,
      paramValuesString1,
    ]);

    //insert project file
    if (pfile && pfile.length > 0) {
      await Promise.all(
        pfile.map(async (f) => {
          const data2 = {
            pid: getProject.pid,
            pfile: f,
            pcreated_by: pcreated_by,
            pfile_date: formattedDate,
          };

          const paramNamesString2 = Object.keys(data2).join(", ");
          const paramValuesString2 = Object.values(data2)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL2 = `CALL InsertProjectFiles(?, ?)`;
          await pool.execute(callProcedureSQL2, [
            paramNamesString2,
            paramValuesString2,
          ]);

          const [getProjectFileRes] = await pool.execute(
            "CALL GetInsertedProjectFile(?,?)",
            [pcreated_by, getProject.pid]
          );
          const getProjectFile = getProjectFileRes[0][0];

          const hdata3 = {
            pid: getProject.pid,
            sid: get_sid,
            gid: get_gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${f} File Uploaded By ${powner.first_name} ${powner.last_name}`,
            pfile_id: getProjectFile.pfile_id,
          };

          const paramNamesString3 = Object.keys(hdata3).join(", ");
          const paramValuesString3 = Object.values(hdata3)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL3 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL3, [
            paramNamesString3,
            paramValuesString3,
          ]);
        })
      );
    }

    //insert project manager
    if (getProject.pmanager != pcreated_by) {
      const data4 = {
        pid: getProject.pid,
        portfolio_id: getProject.portfolio_id,
        pmember: getProject.pmanager,
        status: "send",
        pcreated_by: pcreated_by,
        sent_date: formattedDate,
        sent_notify_clear: "no",
      };

      const paramNamesString4 = Object.keys(data4).join(", ");
      const paramValuesString4 = Object.values(data4)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL4 = `CALL InsertProjectMembers(?, ?)`;
      await pool.execute(callProcedureSQL4, [
        paramNamesString4,
        paramValuesString4,
      ]);

      const [check_user] = await pool.execute("CALL getStudentById(?)", [
        getProject.pmanager,
      ]);
      const user = check_user[0][0];

      const [getpm_id] = await pool.execute("CALL check_ProjectMToClear(?,?)", [
        getProject.pmanager,
        getProject.pid,
      ]);
      const pm_id = getpm_id[0][0]?.pm_id;
      //console.log(pm_id);

      const hdata5 = {
        pid: getProject.pid,
        sid: getProject.sid,
        gid: getProject.gid,
        h_date: formattedDate,
        h_resource_id: powner.reg_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
        pmember_id: pm_id,
      };

      const paramNamesString5 = Object.keys(hdata5).join(", ");
      const paramValuesString5 = Object.values(hdata5)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL5 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL5, [
        paramNamesString5,
        paramValuesString5,
      ]);

      const acceptRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/1`;
      const rejectRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/2`;

      const mailOptions2 = {
        from: process.env.SMTP_USER,
        to: user.email_address,
        subject: "Project Request | Decision 168",
        html: generateEmailTemplate(
          `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a manager.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
          `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
        ),
      };

      transporter.sendMail(mailOptions2, (error, info) => {
        if (error) {
          res.status(500).json({
            error: "Failed to send portfolio invitation email.",
          });
        } else {
          res.status(201).json({
            message: "Project invitation sent to your email.",
          });
        }
      });
    }

    //insert team member
    if (team_member && team_member.length > 0) {
      // Use forEach with async/await
      await Promise.all(
        team_member.map(async (t) => {
          const data6 = {
            pid: getProject.pid,
            portfolio_id: getProject.portfolio_id,
            pmember: t,
            status: "send",
            pcreated_by: pcreated_by,
            sent_date: formattedDate,
            sent_notify_clear: "no",
          };

          const paramNamesString6 = Object.keys(data6).join(", ");
          const paramValuesString6 = Object.values(data6)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL6 = `CALL InsertProjectMembers(?, ?)`;
          await pool.execute(callProcedureSQL6, [
            paramNamesString6,
            paramValuesString6,
          ]);

          const [check_user] = await pool.execute("CALL getStudentById(?)", [
            t,
          ]);
          const user = check_user[0][0];

          const [getpm_id] = await pool.execute(
            "CALL check_ProjectMToClear(?,?)",
            [t, getProject.pid]
          );
          const pm_id = getpm_id[0][0]?.pm_id;
          //console.log(pm_id);

          const hdata7 = {
            pid: getProject.pid,
            sid: getProject.sid,
            gid: getProject.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
            pmember_id: pm_id,
          };

          const paramNamesString7 = Object.keys(hdata7).join(", ");
          const paramValuesString7 = Object.values(hdata7)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL7 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL7, [
            paramNamesString7,
            paramValuesString7,
          ]);

          const acceptRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/1`;
          const rejectRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/2`;

          const mailOptions2 = {
            from: process.env.SMTP_USER,
            to: user.email_address,
            subject: "Project Request | Decision 168",
            html: generateEmailTemplate(
              `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
              `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
            ),
          };

          transporter.sendMail(mailOptions2, (error, info) => {
            if (error) {
              res.status(500).json({
                error: "Failed to send portfolio invitation email.",
              });
            } else {
              res.status(201).json({
                message: "Project invitation sent to your email.",
              });
            }
          });
        })
      );
    }

    //insert invite email
    if (imemail && imemail.length > 0) {
      await Promise.all(
        imemail.map(async (im) => {
          if (!isEmail(im)) {
            return res.status(400).json({ error: "Invalid email address." });
          }

          const [check_if_registered] = await pool.execute(
            "CALL selectLogin(?)",
            [im]
          );
          if (check_if_registered[0].length > 0) {
            const rid = check_if_registered[0][0]?.reg_id;
            if (pcreated_by != rid) {
              const data8 = {
                pid: getProject.pid,
                portfolio_id: getProject.portfolio_id,
                pmember: rid,
                status: "send",
                pcreated_by: pcreated_by,
                sent_date: formattedDate,
                sent_notify_clear: "no",
              };

              const paramNamesString8 = Object.keys(data8).join(", ");
              const paramValuesString8 = Object.values(data8)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL8 = `CALL InsertProjectMembers(?, ?)`;
              await pool.execute(callProcedureSQL8, [
                paramNamesString8,
                paramValuesString8,
              ]);

              const [check_user] = await pool.execute(
                "CALL getStudentById(?)",
                [rid]
              );
              const user = check_user[0][0];

              const [getpm_id] = await pool.execute(
                "CALL check_ProjectMToClear(?,?)",
                [rid, getProject.pid]
              );
              const pm_id = getpm_id[0][0]?.pm_id;
              //console.log(pm_id);

              const hdata9 = {
                pid: getProject.pid,
                sid: getProject.sid,
                gid: getProject.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
                pmember_id: pm_id,
              };

              const paramNamesString9 = Object.keys(hdata9).join(", ");
              const paramValuesString9 = Object.values(hdata9)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL9 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL9, [
                paramNamesString9,
                paramValuesString9,
              ]);

              const acceptRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/1`;
              const rejectRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/2`;

              const mailOptions2 = {
                from: process.env.SMTP_USER,
                to: user.email_address,
                subject: "Project Request | Decision 168",
                html: generateEmailTemplate(
                  `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                  `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
                ),
              };

              transporter.sendMail(mailOptions2, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send portfolio invitation email.",
                  });
                } else {
                  res.status(201).json({
                    message: "Project invitation sent to your email.",
                  });
                }
              });
            }
          } else {
            const [check_email] = await pool.execute(
              "CALL check_invited_email(?,?,?)",
              [getProject.pid, pcreated_by, im]
            );
            if (check_email[0].length == 0) {
              const data10 = {
                pid: getProject.pid,
                sent_from: pcreated_by,
                sent_to: im,
                status: "pending",
                invite_date: formattedDate,
              };

              const paramNamesString10 = Object.keys(data10).join(", ");
              const paramValuesString10 = Object.values(data10)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL10 = `CALL InsertProjectInvitedMembers(?, ?)`;
              await pool.execute(callProcedureSQL10, [
                paramNamesString10,
                paramValuesString10,
              ]);

              const [getportfolioMem] = await pool.execute(
                "CALL check_PortfolioMember(?,?)",
                [im, portfolio_id]
              );

              if (getportfolioMem[0].length == 0) {
                const dataPort = {
                  portfolio_id: portfolio_id,
                  sent_to: im,
                  sent_from: pcreated_by,
                  status: `pending`,
                  working_status: `active`,
                  status_date: formattedDate,
                };

                const paramNamesStringPort = Object.keys(dataPort).join(", ");
                const paramValuesStringPort = Object.values(dataPort)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQLPort = `CALL InsertProjectPortfolioMember(?, ?)`;
                await pool.execute(callProcedureSQLPort, [
                  paramNamesStringPort,
                  paramValuesStringPort,
                ]);
              }

              const [getim_id] = await pool.execute(
                "CALL check_invited_email(?,?,?)",
                [getProject.pid, pcreated_by, im]
              );
              const im_id = getim_id[0][0]?.im_id;
              //console.log(im_id);

              const hdata11 = {
                pid: getProject.pid,
                sid: getProject.sid,
                gid: getProject.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent invite to ${im}`,
                pinvited_id: im_id,
              };

              const paramNamesString11 = Object.keys(hdata11).join(", ");
              const paramValuesString11 = Object.values(hdata11)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL11 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL11, [
                paramNamesString11,
                paramValuesString11,
              ]);

              const acceptRequest = `http://localhost:3000/project-invite-reject-request/${getProject.pid}/${im_id}/1`;
              const rejectRequest = `http://localhost:3000/project-invite-reject-request/${getProject.pid}/${im_id}/2`;

              const mailOptions2 = {
                from: process.env.SMTP_USER,
                to: im,
                subject: "Project Request | Decision 168",
                html: generateEmailTemplate(
                  `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                  `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
                ),
              };

              transporter.sendMail(mailOptions2, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send portfolio invitation email.",
                  });
                } else {
                  res.status(201).json({
                    message: "Project invitation sent to your email.",
                  });
                }
              });
            }
          }
        })
      );
    }

    res.status(201).json({
      message: "Project created successfully.",
      pid: getProject.pid,
    });
  } catch (error) {
    //console.error('Error in /goal/insert-goal:', error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//project-request
router.get("/project-request/:pid/:pm_id/:flag", async (req, res) => {
  const { pid, pm_id, flag } = req.params;
  try {
    const formattedDate = dateConversion();

    if (flag == 1) {
      const [result] = await pool.execute("CALL check_ProPMToClear(?)", [
        pm_id,
      ]);
      if (result[0].length > 0) {
        const status = result[0][0]?.status;

        const [rows] = await pool.execute("CALL getStudentById(?)", [
          result[0][0]?.pmember,
        ]);

        if (status == "send" || status == "read_more") {
          const dynamicFieldsValues = `status = 'accepted',
                         status_date = '${formattedDate}',
                         status_notify = 'yes',
                         status_notify_clear = 'no'`;
          const id = `pm_id  = '${pm_id}'`;
          await pool.execute("CALL UpdateProjectMembers(?, ?)", [
            dynamicFieldsValues,
            id,
          ]);

          const dynamicFieldsValues2 = `status = 'accepted',
                                  working_status = 'active',
                         status_date = '${formattedDate}',
                         status_notify = 'seen',
                         status_notify_clear = 'yes'`;
          const id2 = `sent_to  = '${rows[0][0]?.email_address}' AND portfolio_id  = '${result[0][0]?.portfolio_id}'`;
          await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
            dynamicFieldsValues2,
            id2,
          ]);

          const hdata = {
            pid: pid,
            h_date: formattedDate,
            h_resource_id: rows[0][0]?.reg_id,
            h_resource: `${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
            h_description: `Team Member Request Accepted By ${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
            pmember_id: pm_id,
          };

          const paramNamesString1 = Object.keys(hdata).join(", ");
          const paramValuesString1 = Object.values(hdata)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL1, [
            paramNamesString1,
            paramValuesString1,
          ]);

          res.status(200).json({ user_status: "accepted" });
        } else {
          res.status(400).json({ user_status: status });
        }
      } else {
        res.status(400).json({ user_status: "pages-404" });
      }
    } else if (flag == 2) {
      const [result] = await pool.execute("CALL check_ProPMToClear(?)", [
        pm_id,
      ]);
      if (result[0].length > 0) {
        const status = result[0][0]?.status;

        const [rows] = await pool.execute("CALL getStudentById(?)", [
          result[0][0]?.pmember,
        ]);

        if (status == "send") {
          const dynamicFieldsValues = `status = 'read_more',
                         status_date = '${formattedDate}'`;
          const id = `pm_id  = '${pm_id}'`;
          await pool.execute("CALL UpdateProjectMembers(?, ?)", [
            dynamicFieldsValues,
            id,
          ]);

          const hdata = {
            pid: pid,
            h_date: formattedDate,
            h_resource_id: rows[0][0]?.reg_id,
            h_resource: `${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
            h_description: `Goal More Request By ${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
            pmember_id: pm_id,
          };

          const paramNamesString1 = Object.keys(hdata).join(", ");
          const paramValuesString1 = Object.values(hdata)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL1, [
            paramNamesString1,
            paramValuesString1,
          ]);

          res.status(200).json({ user_status: "read_more" });
        } else {
          res.status(400).json({ user_status: status });
        }
      } else {
        res.status(400).json({ user_status: "pages-404" });
      }
    } else {
      res.status(400).json({ user_status: "pages-404" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

//project-invite-reject-request
router.get(
  "/project-invite-reject-request/:pid/:im_id/:flag",
  async (req, res) => {
    const { pid, im_id, flag } = req.params;
    try {
      const formattedDate = dateConversion();

      if (flag == 2) {
        const [result] = await pool.execute("CALL check_ProIPMToClear(?)", [
          im_id,
        ]);
        if (result[0].length > 0) {
          const status = result[0][0]?.status;

          if (status == "pending") {
            const dynamicFieldsValues = `status = 'rejected',
                         accept_date = '${formattedDate}'`;
            const id = `im_id  = '${im_id}'`;
            await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [
              dynamicFieldsValues,
              id,
            ]);

            const hdata = {
              pid: pid,
              h_date: formattedDate,
              h_resource: `${result[0][0]?.sent_to}`,
              h_description: `Invite Rejected By ${result[0][0]?.sent_to}`,
              pinvited_id: im_id,
            };

            const paramNamesString1 = Object.keys(hdata).join(", ");
            const paramValuesString1 = Object.values(hdata)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL1, [
              paramNamesString1,
              paramValuesString1,
            ]);

            res.status(200).json({ user_status: "rejected" });
          } else {
            res.status(400).json({ user_status: status });
          }
        } else {
          res.status(400).json({ user_status: "pages-404" });
        }
      } else {
        res.status(400).json({ user_status: "pages-404" });
      }
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: err.message });
    }
  }
);

//UpdateProject
router.patch("/project/update-project", async (req, res) => {
  try {
    let { pname } = req.body;
    let { pid } = req.body;
    let { dept_id } = req.body;
    let { pcreated_by } = req.body;
    const { team_member, imemail, pfile, ...otherFields } = req.body;

    const formattedDate = dateConversion();

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL UpdateProject('${formattedParams}', 'pid = ${pid}')`;

    await pool.execute(storedProcedure);

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      pcreated_by,
    ]);
    const powner = check_powner[0][0];

    const hdata = {
      pid: pid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Project Edited By ${powner.first_name} ${powner.last_name}`,
    };

    const paramNamesString1 = Object.keys(hdata).join(", ");
    const paramValuesString1 = Object.values(hdata)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [
      paramNamesString1,
      paramValuesString1,
    ]);

    //project tasks
    const updateFieldsValues3 = `dept_id = '${dept_id}'`;
    const upid3 = `tproject_assign  = '${pid}'`;
    await pool.execute("CALL UpdateTask(?, ?)", [updateFieldsValues3, upid3]);

    //project subtasks
    const updateFieldsValues4 = `dept_id = '${dept_id}'`;
    const upid4 = `stproject_assign  = '${pid}'`;
    await pool.execute("CALL UpdateSubtask(?, ?)", [
      updateFieldsValues4,
      upid4,
    ]);

    const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
    const pdetail = pdetailRes[0][0];

    const [check_Portfolio_owner_id] = await pool.execute(
      "CALL getPortfolio2(?)",
      [pdetail.portfolio_id]
    );
    const PortfolioName = check_Portfolio_owner_id[0][0]?.portfolio_name;

    let portfolio_owner_id = "";
    if (check_Portfolio_owner_id && check_Portfolio_owner_id.length > 0) {
      portfolio_owner_id = check_Portfolio_owner_id[0][0]?.portfolio_createdby;
    }

    //insert project file
    if (pfile && pfile.length > 0) {
      await Promise.all(
        pfile.map(async (f) => {
          const data2 = {
            pid: pid,
            pfile: f,
            pcreated_by: pcreated_by,
            pfile_date: formattedDate,
          };

          const paramNamesString2 = Object.keys(data2).join(", ");
          const paramValuesString2 = Object.values(data2)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL2 = `CALL InsertProjectFiles(?, ?)`;
          await pool.execute(callProcedureSQL2, [
            paramNamesString2,
            paramValuesString2,
          ]);

          const [getProjectFileRes] = await pool.execute(
            "CALL GetInsertedProjectFile(?,?)",
            [pcreated_by, pid]
          );
          const getProjectFile = getProjectFileRes[0][0];

          const hdata3 = {
            pid: pid,
            sid: pdetail.sid,
            gid: pdetail.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${f} File Uploaded By ${powner.first_name} ${powner.last_name}`,
            pfile_id: getProjectFile.pfile_id,
          };

          const paramNamesString3 = Object.keys(hdata3).join(", ");
          const paramValuesString3 = Object.values(hdata3)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL3 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL3, [
            paramNamesString3,
            paramValuesString3,
          ]);
        })
      );
    }

    const [ptmRes] = await pool.execute("CALL ProjectTeamMember(?)", [pid]);
    const ptm = ptmRes[0];

    if (team_member && team_member.length > 0) {
      const all_ptm = [];

      if (ptm) {
        ptm.forEach((all_tm) => {
          if (all_tm.pmember !== pdetail.pcreated_by) {
            all_ptm.push(all_tm.pmember);
          }
        });
      }

      const no_more_mem = all_ptm.filter(
        (member) => !team_member.includes(member)
      );
      //console.log(no_more_mem);
      for (const no_mem of no_more_mem) {
        if (
          pdetail.pcreated_by == pcreated_by ||
          portfolio_owner_id == pcreated_by
        ) {
          if (pdetail.pmanager == no_mem) {
            const updateFieldsValues2 = `pmanager = ''`;
            const upid = `pid  = '${pid}'`;
            await pool.execute("CALL UpdateProject(?, ?)", [
              updateFieldsValues2,
              upid,
            ]);
            //console.log("if", no_mem);
            const del1 = `pmember = '${no_mem}' AND pid = '${pid}'`;
            await pool.execute("CALL DeleteProjectMembers(?)", [del1]);
          } else {
            if (pdetail.pmanager != no_mem) {
              if (pdetail.portfolio_owner_id != no_mem) {
                if (pdetail.pcreated_by != no_mem) {
                  //console.log("else", no_mem);
                  const del2 = `pmember = '${no_mem}' AND pid = '${pid}'`;
                  await pool.execute("CALL DeleteProjectMembers(?)", [del2]);
                }
              }
            }
          }
        }
      }

      await Promise.all(
        team_member.map(async (t) => {
          const [check_Project_members] = await pool.execute(
            "CALL check_ProjectMToClear(?,?)",
            [t, pid]
          );
          if (check_Project_members[0].length == 0) {
            const data6 = {
              pid: pid,
              portfolio_id: pdetail.portfolio_id,
              pmember: t,
              status: "send",
              pcreated_by: pcreated_by,
              sent_date: formattedDate,
              sent_notify_clear: "no",
            };

            const paramNamesString6 = Object.keys(data6).join(", ");
            const paramValuesString6 = Object.values(data6)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL6 = `CALL InsertProjectMembers(?, ?)`;
            await pool.execute(callProcedureSQL6, [
              paramNamesString6,
              paramValuesString6,
            ]);

            const [check_user] = await pool.execute("CALL getStudentById(?)", [
              t,
            ]);
            const user = check_user[0][0];

            const [getpm_id] = await pool.execute(
              "CALL check_ProjectMToClear(?,?)",
              [t, pid]
            );
            const pm_id = getpm_id[0][0]?.pm_id;
            //console.log(pm_id);

            const hdata7 = {
              pid: pid,
              sid: pdetail.sid,
              gid: pdetail.gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
              pmember_id: pm_id,
            };

            const paramNamesString7 = Object.keys(hdata7).join(", ");
            const paramValuesString7 = Object.values(hdata7)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL7 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL7, [
              paramNamesString7,
              paramValuesString7,
            ]);

            const acceptRequest = `http://localhost:3000/project-request/${pid}/${pm_id}/1`;
            const rejectRequest = `http://localhost:3000/project-request/${pid}/${pm_id}/2`;

            const mailOptions2 = {
              from: process.env.SMTP_USER,
              to: user.email_address,
              subject: "Project Request | Decision 168",
              html: generateEmailTemplate(
                `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
              ),
            };

            transporter.sendMail(mailOptions2, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send portfolio invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "Project invitation sent to your email.",
                });
              }
            });
          }
        })
      );
    } else {
      const all_ptm = [];

      if (ptm) {
        ptm.forEach((all_tm) => {
          if (all_tm.pmember !== pdetail.pcreated_by) {
            all_ptm.push(all_tm.pmember);
          }
        });
      }

      const no_more_mem = all_ptm.filter(
        (member) => !team_member.includes(member)
      );
      //console.log(no_more_mem);
      for (const no_mem of no_more_mem) {
        if (
          pdetail.pcreated_by == pcreated_by ||
          portfolio_owner_id == pcreated_by
        ) {
          if (pdetail.pmanager == no_mem) {
            const updateFieldsValues2 = `pmanager = ''`;
            const upid = `pid  = '${pid}'`;
            await pool.execute("CALL UpdateProject(?, ?)", [
              updateFieldsValues2,
              upid,
            ]);
            //console.log("if", no_mem);
            const del1 = `pmember = '${no_mem}' AND pid = '${pid}'`;
            await pool.execute("CALL DeleteProjectMembers(?)", [del1]);
          } else {
            if (pdetail.pmanager != no_mem) {
              if (pdetail.portfolio_owner_id != no_mem) {
                if (pdetail.pcreated_by != no_mem) {
                  //console.log("else", no_mem);
                  const del2 = `pmember = '${no_mem}' AND pid = '${pid}'`;
                  await pool.execute("CALL DeleteProjectMembers(?)", [del2]);
                }
              }
            }
          }
        }
      }
    }

    if (imemail && imemail.length > 0) {
      await Promise.all(
        imemail.map(async (im) => {
          if (!isEmail(im)) {
            return res.status(400).json({ error: "Invalid email address." });
          }
          const [check_if_registered] = await pool.execute(
            "CALL selectLogin(?)",
            [im]
          );
          if (check_if_registered[0].length > 0) {
            const rid = check_if_registered[0][0]?.reg_id;
            if (pcreated_by != rid) {
              const data8 = {
                pid: pid,
                portfolio_id: pdetail.portfolio_id,
                pmember: rid,
                status: "send",
                pcreated_by: pcreated_by,
                sent_date: formattedDate,
                sent_notify_clear: "no",
              };

              const paramNamesString8 = Object.keys(data8).join(", ");
              const paramValuesString8 = Object.values(data8)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL8 = `CALL InsertProjectMembers(?, ?)`;
              await pool.execute(callProcedureSQL8, [
                paramNamesString8,
                paramValuesString8,
              ]);

              const [check_user] = await pool.execute(
                "CALL getStudentById(?)",
                [rid]
              );
              const user = check_user[0][0];

              const [getpm_id] = await pool.execute(
                "CALL check_ProjectMToClear(?,?)",
                [rid, pid]
              );
              const pm_id = getpm_id[0][0]?.pm_id;
              //console.log(pm_id);

              const hdata9 = {
                pid: pid,
                sid: pdetail.sid,
                gid: pdetail.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
                pmember_id: pm_id,
              };

              const paramNamesString9 = Object.keys(hdata9).join(", ");
              const paramValuesString9 = Object.values(hdata9)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL9 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL9, [
                paramNamesString9,
                paramValuesString9,
              ]);

              const acceptRequest = `http://localhost:3000/project-request/${pid}/${pm_id}/1`;
              const rejectRequest = `http://localhost:3000/project-request/${pid}/${pm_id}/2`;

              const mailOptions2 = {
                from: process.env.SMTP_USER,
                to: user.email_address,
                subject: "Project Request | Decision 168",
                html: generateEmailTemplate(
                  `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                  `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
                ),
              };

              transporter.sendMail(mailOptions2, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send portfolio invitation email.",
                  });
                } else {
                  res.status(201).json({
                    message: "Project invitation sent to your email.",
                  });
                }
              });
            }
          } else {
            const [check_email] = await pool.execute(
              "CALL check_invited_email(?,?,?)",
              [pid, pcreated_by, im]
            );
            if (check_email[0].length == 0) {
              const data10 = {
                pid: pid,
                sent_from: pcreated_by,
                sent_to: im,
                status: "pending",
                invite_date: formattedDate,
              };

              const paramNamesString10 = Object.keys(data10).join(", ");
              const paramValuesString10 = Object.values(data10)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL10 = `CALL InsertProjectInvitedMembers(?, ?)`;
              await pool.execute(callProcedureSQL10, [
                paramNamesString10,
                paramValuesString10,
              ]);

              const [getportfolioMem] = await pool.execute(
                "CALL check_PortfolioMember(?,?)",
                [im, pdetail.portfolio_id]
              );

              if (getportfolioMem[0].length == 0) {
                const dataPort = {
                  portfolio_id: pdetail.portfolio_id,
                  sent_to: im,
                  sent_from: pcreated_by,
                  status: `pending`,
                  working_status: `active`,
                  status_date: formattedDate,
                };

                const paramNamesStringPort = Object.keys(dataPort).join(", ");
                const paramValuesStringPort = Object.values(dataPort)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQLPort = `CALL InsertProjectPortfolioMember(?, ?)`;
                await pool.execute(callProcedureSQLPort, [
                  paramNamesStringPort,
                  paramValuesStringPort,
                ]);
              }

              const [getim_id] = await pool.execute(
                "CALL check_invited_email(?,?,?)",
                [pid, pcreated_by, im]
              );
              const im_id = getim_id[0][0]?.im_id;
              //console.log(im_id);

              const hdata11 = {
                pid: pid,
                sid: pdetail.sid,
                gid: pdetail.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent invite to ${im}`,
                pinvited_id: im_id,
              };

              const paramNamesString11 = Object.keys(hdata11).join(", ");
              const paramValuesString11 = Object.values(hdata11)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL11 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL11, [
                paramNamesString11,
                paramValuesString11,
              ]);

              const acceptRequest = `http://localhost:3000/project-invite-request/${pid}/${im_id}/1`;
              const rejectRequest = `http://localhost:3000/project-invite-request/${pid}/${im_id}/2`;

              const mailOptions2 = {
                from: process.env.SMTP_USER,
                to: im,
                subject: "Project Request | Decision 168",
                html: generateEmailTemplate(
                  `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                  `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
                ),
              };

              transporter.sendMail(mailOptions2, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send portfolio invitation email.",
                  });
                } else {
                  res.status(201).json({
                    message: "Project invitation sent to your email.",
                  });
                }
              });
            }
          }
        })
      );
    }

    res.status(201).json({
      message: "Project updated successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//DuplicateProject
router.post("/project/duplicate-project", async (req, res) => {
  try {
    let { pcreated_by } = req.body;
    let { pname } = req.body;
    const { pid, copy_detail, cust_project, ...otherFields } = req.body;

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      pcreated_by,
    ]);
    const powner = check_powner[0][0];

    const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
    const pdetail = pdetailRes[0][0];

    let pmanager = "";
    if (copy_detail == "everything") {
      pmanager = pdetail.pmanager;
    }

    const formattedDate = dateConversion();

    const additionalFields = {
      gid: pdetail.gid,
      sid: pdetail.sid,
      ptype: pdetail.ptype,
      p_publish: pdetail.p_publish,
      pdes: pdetail.pdes,
      plink: pdetail.plink,
      plink_comment: pdetail.plink_comment,
      pmanager: pmanager,
      pcreated_date: formattedDate,
      portfolio_id: pdetail.portfolio_id,
      dept_id: pdetail.dept_id,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertProject(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [getProjectRes] = await pool.execute("CALL GetInsertedProject(?)", [
      pcreated_by,
    ]);
    const getProject = getProjectRes[0][0];

    const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
      pdetail.portfolio_id,
    ]);
    const PortfolioName = getPortfolio[0][0]?.portfolio_name;

    const hdata = {
      pid: getProject.pid,
      sid: getProject.sid,
      gid: getProject.gid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Project Created By ${powner.first_name} ${powner.last_name}`,
    };

    const paramNamesString1 = Object.keys(hdata).join(", ");
    const paramValuesString1 = Object.values(hdata)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [
      paramNamesString1,
      paramValuesString1,
    ]);

    if (copy_detail == "everything") {
      //Check Project Members
      const [getMemberProjectRes] = await pool.execute(
        "CALL getMemberProject(?)",
        [pid]
      );
      const getMemberProject = getMemberProjectRes[0];
      if (getMemberProject && getMemberProject.length > 0) {
        for (const pm of getMemberProject) {
          const data7 = {
            pid: getProject.pid,
            portfolio_id: getProject.portfolio_id,
            pmember: pm.pmember,
            status: "send",
            pcreated_by: pcreated_by,
            sent_date: formattedDate,
            sent_notify_clear: "no",
          };

          const paramNamesString7 = Object.keys(data7).join(", ");
          const paramValuesString7 = Object.values(data7)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL7 = `CALL InsertProjectMembers(?, ?)`;
          await pool.execute(callProcedureSQL7, [
            paramNamesString7,
            paramValuesString7,
          ]);

          const [check_user] = await pool.execute("CALL getStudentById(?)", [
            pm.pmember,
          ]);
          const user = check_user[0][0];

          const [getpm_id] = await pool.execute(
            "CALL check_ProjectMToClear(?,?)",
            [pm.pmember, getProject.pid]
          );
          const pm_id = getpm_id[0][0]?.pm_id;
          //console.log(pm_id);

          const hdata6 = {
            pid: getProject.pid,
            sid: getProject.sid,
            gid: getProject.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
            pmember_id: pm_id,
          };

          const paramNamesString6 = Object.keys(hdata6).join(", ");
          const paramValuesString6 = Object.values(hdata6)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL6 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL6, [
            paramNamesString6,
            paramValuesString6,
          ]);

          const acceptRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/1`;
          const rejectRequest = `http://localhost:3000/project-request/${getProject.pid}/${pm_id}/2`;

          if (pm.pmember == pdetail.pmanager) {
            console.log("1");
            const mailOptions2 = {
              from: process.env.SMTP_USER,
              to: user.email_address,
              subject: "Project Request | Decision 168",
              html: generateEmailTemplate(
                `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a manager.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
              ),
            };

            transporter.sendMail(mailOptions2, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send portfolio invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "Project invitation sent to your email.",
                });
              }
            });
          } else {
            const mailOptions2 = {
              from: process.env.SMTP_USER,
              to: user.email_address,
              subject: "Project Request | Decision 168",
              html: generateEmailTemplate(
                `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
                `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
              ),
            };

            transporter.sendMail(mailOptions2, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send portfolio invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "Project invitation sent to your email.",
                });
              }
            });
          }
        }
      }

      //Check Project Tasks
      const [p_tasksRes] = await pool.execute("CALL pro_all_tasks(?)", [pid]);
      const p_tasks = p_tasksRes[0];
      if (p_tasks && p_tasks.length > 0) {
        for (const pt of p_tasks) {
          const project_name = pname;
          const letter = project_name.trim().substring(0, 2).toUpperCase();
          const random_num = Math.floor(Math.random() * 10000) + 1;
          const get_tcode = `${letter}-${random_num}`;
          const data8 = {
            gid: getProject.gid,
            sid: getProject.sid,
            tcode: get_tcode,
            tname: pt.tname,
            tdes: pt.tdes,
            tlink: pt.tlink,
            tlink_comment: pt.tlink_comment,
            tnote: pt.tnote,
            tfile: "",
            tpriority: pt.tpriority,
            tstatus: "to_do",
            tstatus_date: formattedDate,
            tproject_assign: getProject.pid,
            portfolio_id: getProject.portfolio_id,
            tassignee: pt.tassignee,
            tcreated_by: pcreated_by,
            tcreated_date: formattedDate,
            tnotify: "yes",
            tnotify_clear: "no",
            tnotify_date: formattedDate,
            tdue_date: pt.tdue_date,
            tdue_date_clear: "no",
            dept_id: getProject.dept_id,
          };

          const paramNamesString8 = Object.keys(data8).join(", ");
          const paramValuesString8 = Object.values(data8)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL8 = `CALL InsertTask(?, ?)`;
          await pool.execute(callProcedureSQL8, [
            paramNamesString8,
            paramValuesString8,
          ]);
          const [getTaskRes] = await pool.execute("CALL GetInsertedTask(?)", [
            pcreated_by,
          ]);
          const getTask = getTaskRes[0][0];

          const hdata9 = {
            pid: getProject.pid,
            sid: getProject.sid,
            gid: getProject.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `Task Code: ${get_tcode} , Task Name: ${pt.tname}, Created by ${powner.first_name} ${powner.last_name}`,
            task_id: getTask.tid,
          };

          const paramNamesString9 = Object.keys(hdata9).join(", ");
          const paramValuesString9 = Object.values(hdata9)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL9 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL9, [
            paramNamesString9,
            paramValuesString9,
          ]);

          //Check Subtasks
          const [Check_Task_SubtasksRes] = await pool.execute(
            "CALL Check_Task_ALL_Subtasks2(?)",
            [pt.tid]
          );
          const Check_Task_Subtasks = Check_Task_SubtasksRes[0];
          if (Check_Task_Subtasks && Check_Task_Subtasks.length > 0) {
            for (const ts of Check_Task_Subtasks) {
              const project_name = pname;
              const letter = project_name.trim().substring(0, 2).toUpperCase();
              const random_num = Math.floor(Math.random() * 10000) + 1;
              const get_stcode = `${letter}-${random_num}`;

              const data9 = {
                tid: getTask.tid,
                gid: getProject.gid,
                sid: getProject.sid,
                stproject_assign: getProject.pid,
                portfolio_id: getProject.portfolio_id,
                stcode: get_stcode,
                stname: ts.stname,
                stdes: ts.stdes,
                stlink: ts.stlink,
                stlink_comment: ts.stlink_comment,
                stnote: ts.stnote,
                stfile: "",
                stpriority: ts.stpriority,
                ststatus: "to_do",
                ststatus_date: formattedDate,
                stassignee: ts.stassignee,
                stcreated_by: pcreated_by,
                stcreated_date: formattedDate,
                stnotify: "yes",
                stnotify_clear: "no",
                stnotify_date: formattedDate,
                stdue_date: ts.stdue_date,
                stdue_date_clear: "no",
                dept_id: getProject.dept_id,
              };

              const paramNamesString9 = Object.keys(data9).join(", ");
              const paramValuesString9 = Object.values(data9)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL9 = `CALL InsertSubtask(?, ?)`;
              await pool.execute(callProcedureSQL9, [
                paramNamesString9,
                paramValuesString9,
              ]);

              const [getSubtaskRes] = await pool.execute(
                "CALL GetInsertedSubtask(?)",
                [pcreated_by]
              );
              const getSubtask = getSubtaskRes[0][0];

              const hdata10 = {
                pid: getProject.pid,
                sid: getProject.sid,
                gid: getProject.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `Subtask Code: ${get_stcode} , Subtask Name: ${ts.stname}, Created by ${powner.first_name} ${powner.last_name}`,
                subtask_id: getSubtask.stid,
              };

              const paramNamesString10 = Object.keys(hdata10).join(", ");
              const paramValuesString10 = Object.values(hdata10)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL10 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL10, [
                paramNamesString10,
                paramValuesString10,
              ]);
            }
          }
        }
      }
    }

    if (copy_detail == "custom") {
      if (cust_project == "1") {
        //Check Project Tasks
        const [p_tasksRes] = await pool.execute("CALL pro_all_tasks(?)", [pid]);
        const p_tasks = p_tasksRes[0];
        if (p_tasks && p_tasks.length > 0) {
          for (const pt of p_tasks) {
            const project_name = pname;
            const letter = project_name.trim().substring(0, 2).toUpperCase();
            const random_num = Math.floor(Math.random() * 10000) + 1;
            const get_tcode = `${letter}-${random_num}`;
            const data8 = {
              gid: getProject.gid,
              sid: getProject.sid,
              tcode: get_tcode,
              tname: pt.tname,
              tdes: pt.tdes,
              tlink: pt.tlink,
              tlink_comment: pt.tlink_comment,
              tnote: pt.tnote,
              tfile: "",
              tpriority: pt.tpriority,
              tstatus: "to_do",
              tstatus_date: formattedDate,
              tproject_assign: getProject.pid,
              portfolio_id: getProject.portfolio_id,
              tassignee: pcreated_by,
              tcreated_by: pcreated_by,
              tcreated_date: formattedDate,
              tnotify: "yes",
              tnotify_clear: "no",
              tnotify_date: formattedDate,
              tdue_date: pt.tdue_date,
              tdue_date_clear: "no",
              dept_id: getProject.dept_id,
            };

            const paramNamesString8 = Object.keys(data8).join(", ");
            const paramValuesString8 = Object.values(data8)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL8 = `CALL InsertTask(?, ?)`;
            await pool.execute(callProcedureSQL8, [
              paramNamesString8,
              paramValuesString8,
            ]);
            const [getTaskRes] = await pool.execute("CALL GetInsertedTask(?)", [
              pcreated_by,
            ]);
            const getTask = getTaskRes[0][0];

            const hdata9 = {
              pid: getProject.pid,
              sid: getProject.sid,
              gid: getProject.gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `Task Code: ${get_tcode} , Task Name: ${pt.tname}, Created by ${powner.first_name} ${powner.last_name}`,
              task_id: getTask.tid,
            };

            const paramNamesString9 = Object.keys(hdata9).join(", ");
            const paramValuesString9 = Object.values(hdata9)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL9 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL9, [
              paramNamesString9,
              paramValuesString9,
            ]);

            //Check Subtasks
            const [Check_Task_SubtasksRes] = await pool.execute(
              "CALL Check_Task_ALL_Subtasks2(?)",
              [pt.tid]
            );
            const Check_Task_Subtasks = Check_Task_SubtasksRes[0];
            if (Check_Task_Subtasks && Check_Task_Subtasks.length > 0) {
              for (const ts of Check_Task_Subtasks) {
                const project_name = pname;
                const letter = project_name
                  .trim()
                  .substring(0, 2)
                  .toUpperCase();
                const random_num = Math.floor(Math.random() * 10000) + 1;
                const get_stcode = `${letter}-${random_num}`;

                const data9 = {
                  tid: getTask.tid,
                  gid: getProject.gid,
                  sid: getProject.sid,
                  stproject_assign: getProject.pid,
                  portfolio_id: getProject.portfolio_id,
                  stcode: get_stcode,
                  stname: ts.stname,
                  stdes: ts.stdes,
                  stlink: ts.stlink,
                  stlink_comment: ts.stlink_comment,
                  stnote: ts.stnote,
                  stfile: "",
                  stpriority: ts.stpriority,
                  ststatus: "to_do",
                  ststatus_date: formattedDate,
                  stassignee: pcreated_by,
                  stcreated_by: pcreated_by,
                  stcreated_date: formattedDate,
                  stnotify: "yes",
                  stnotify_clear: "no",
                  stnotify_date: formattedDate,
                  stdue_date: ts.stdue_date,
                  stdue_date_clear: "no",
                  dept_id: getProject.dept_id,
                };

                const paramNamesString9 = Object.keys(data9).join(", ");
                const paramValuesString9 = Object.values(data9)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL9 = `CALL InsertSubtask(?, ?)`;
                await pool.execute(callProcedureSQL9, [
                  paramNamesString9,
                  paramValuesString9,
                ]);

                const [getSubtaskRes] = await pool.execute(
                  "CALL GetInsertedSubtask(?)",
                  [pcreated_by]
                );
                const getSubtask = getSubtaskRes[0][0];

                const hdata10 = {
                  pid: getProject.pid,
                  sid: getProject.sid,
                  gid: getProject.gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `Subtask Code: ${get_stcode} , Subtask Name: ${ts.stname}, Created by ${powner.first_name} ${powner.last_name}`,
                  subtask_id: getSubtask.stid,
                };

                const paramNamesString10 = Object.keys(hdata10).join(", ");
                const paramValuesString10 = Object.values(hdata10)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL10 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL10, [
                  paramNamesString10,
                  paramValuesString10,
                ]);
              }
            }
          }
        }
      }
    }

    res.status(201).json({
      message: "Project Copied successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//view_history_date_wise_project
router.get("/project/view-history-date-wise-project/:pid", async (req, res) => {
  const pid = req.params.pid;
  const hdate = req.body.hdate;
  try {
    const [rows, fields] = await pool.execute("CALL view_history(?,?)", [
      pid,
      hdate,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//view_history_date_range_project
router.get(
  "/project/view-history-date-range-project/:pid",
  async (req, res) => {
    const pid = req.params.pid;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_history_date_range(?,?,?)",
        [pid, start_date, end_date]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//view_all_history_project
router.get("/project/view-all-history-project/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows, fields] = await pool.execute("CALL view_all_history(?)", [
      pid,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//UpdateProjectLinks
router.patch("/project/update-project-links", async (req, res) => {
  const { pid, pcreated_by, ...otherFields } = req.body;
  try {
    const formattedDate = dateConversion();
    const formattedParams = convertObjectToProcedureParams(otherFields);
    const storedProcedure = `CALL UpdateProject('${formattedParams}', 'pid = ${pid}')`;
    await pool.execute(storedProcedure);
    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      pcreated_by,
    ]);
    const powner = check_powner[0][0];

    const hdata = {
      pid: pid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Project Link(s) Added/Updated By ${powner.first_name} ${powner.last_name}`,
    };

    const paramNamesString1 = Object.keys(hdata).join(", ");
    const paramValuesString1 = Object.values(hdata)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [
      paramNamesString1,
      paramValuesString1,
    ]);

    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//InsertProjectFiles
router.post("/project/insert-project-files", async (req, res) => {
  const { pid, pcreated_by, pfile } = req.body;
  try {
    const formattedDate = dateConversion();

    //insert project file
    if (pfile && pfile.length > 0) {
      await Promise.all(
        pfile.map(async (f) => {
          const data2 = {
            pid: pid,
            pfile: f,
            pcreated_by: pcreated_by,
            pfile_date: formattedDate,
          };

          const paramNamesString2 = Object.keys(data2).join(", ");
          const paramValuesString2 = Object.values(data2)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL2 = `CALL InsertProjectFiles(?, ?)`;
          await pool.execute(callProcedureSQL2, [
            paramNamesString2,
            paramValuesString2,
          ]);

          const [getProjectFileRes] = await pool.execute(
            "CALL GetInsertedProjectFile(?,?)",
            [pcreated_by, pid]
          );
          const getProjectFile = getProjectFileRes[0][0];

          const [check_powner] = await pool.execute("CALL getStudentById(?)", [
            pcreated_by,
          ]);
          const powner = check_powner[0][0];

          const [getProjectRes] = await pool.execute(
            "CALL GetInsertedProject(?)",
            [pcreated_by]
          );
          const getProject = getProjectRes[0][0];

          const hdata3 = {
            pid: pid,
            sid: getProject.sid,
            gid: getProject.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${f} File Uploaded By ${powner.first_name} ${powner.last_name}`,
            pfile_id: getProjectFile.pfile_id,
          };

          const paramNamesString3 = Object.keys(hdata3).join(", ");
          const paramValuesString3 = Object.values(hdata3)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL3 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL3, [
            paramNamesString3,
            paramValuesString3,
          ]);
        })
      );
    }
    res.status(200).json({ message: "file added successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//DeleteProjectFiles
router.patch(
  "/project/delete-project-files/:pid/:pfile_id/:user_id",
  async (req, res) => {
    const pid = req.params.pid;
    const pfile_id = req.params.pfile_id;
    const user_id = req.params.user_id;
    try {
      const formattedDate = dateConversion();

      const otherFields = {
        ptrash: "yes",
        ptrash_date: formattedDate,
      };
      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL UpdateProjectFiles('${formattedParams}', 'pfile_id = ${pfile_id}')`;

      await pool.execute(storedProcedure);

      const [getProjectRes] = await pool.execute("CALL getProjectById(?)", [
        pid,
      ]);
      const getProject = getProjectRes[0][0];

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const [getProjectFileRes] = await pool.execute(
        "CALL check_project_files(?)",
        [pfile_id]
      );
      const getProjectFile = getProjectFileRes[0][0];

      const hdata3 = {
        pid: getProject.pid,
        sid: getProject.sid,
        gid: getProject.gid,
        h_date: formattedDate,
        h_resource_id: powner.reg_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${getProjectFile.pfile} File Removed By ${powner.first_name} ${powner.last_name}`,
        pfile_id: pfile_id,
      };

      const paramNamesString3 = Object.keys(hdata3).join(", ");
      const paramValuesString3 = Object.values(hdata3)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL3 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL3, [
        paramNamesString3,
        paramValuesString3,
      ]);

      res.status(200).json({ message: "file deleted successfully" });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//direct_remove_projectmanager
router.patch(
  "/project/direct-remove-project-manager/:pid/:pmember_id",
  async (req, res) => {
    try {
      const pid = req.params.pid;
      const pmember_id = req.params.pmember_id;
      const formattedDate = dateConversion();

      const updateFieldsValues2 = `pmanager = ''`;
      const upid = `pid  = '${pid}'`;
      await pool.execute("CALL UpdateProject(?, ?)", [
        updateFieldsValues2,
        upid,
      ]);

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        pmember_id,
      ]);
      const powner = check_powner[0][0];
      const hdata = {
        pid: pid,
        h_date: formattedDate,
        h_resource_id: powner.pmember_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${powner.first_name} ${powner.last_name} Removed as a Project Manager`,
      };

      const paramNamesString1 = Object.keys(hdata).join(", ");
      const paramValuesString1 = Object.values(hdata)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL1, [
        paramNamesString1,
        paramValuesString1,
      ]);

      res.status(201).json({
        message: "Manager Removed successfully.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

//delete_pMember
router.patch("/project/remove-project-member/:pm_id", async (req, res) => {
  try {
    const pm_id = req.params.pm_id;

    const [check_mem_idRes] = await pool.execute("CALL check_ProPMToClear(?)", [
      pm_id,
    ]);

    const check_mem_id = check_mem_idRes[0];

    if (check_mem_id && check_mem_id.length > 0) {
      const formattedDate = dateConversion();
      let reg_id = check_mem_id[0].pmember;
      let pid = check_mem_id[0].pid;
      let portfolio_id = check_mem_id[0].portfolio_id;

      const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
      const pmanager = pdetailRes[0][0]?.pmanager;

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        reg_id,
      ]);
      const powner = check_powner[0][0];

      const [getTasks] = await pool.execute("CALL ProTMOpenTasks(?,?,?)", [
        reg_id,
        pid,
        portfolio_id,
      ]);
      let task_count = 0;
      if (getTasks[0]) {
        task_count = getTasks[0].length;
      }

      const [getSubtasks] = await pool.execute(
        "CALL ProTMOpenSubtasks(?,?,?)",
        [reg_id, pid, portfolio_id]
      );
      let subtask_count = 0;
      if (getSubtasks[0]) {
        subtask_count = getSubtasks[0].length;
      }

      if (task_count === 0 && subtask_count === 0) {
        if (pmanager == reg_id) {
          const updateFieldsValues2 = `pmanager = ''`;
          const upid = `pid  = '${pid}'`;
          await pool.execute("CALL UpdateProject(?, ?)", [
            updateFieldsValues2,
            upid,
          ]);
        }

        const hdata = {
          pid: pid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} Removed from project`,
        };

        const paramNamesString1 = Object.keys(hdata).join(", ");
        const paramValuesString1 = Object.values(hdata)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [
          paramNamesString1,
          paramValuesString1,
        ]);

        const del1 = `pm_id = '${pm_id}'`;
        await pool.execute("CALL DeleteProjectMembers(?)", [del1]);

        res.status(200).json({ message: "removed successfully" });
      } else {
        res.status(200).json({
          task_countResult: task_count,
          subtask_countResult: subtask_count,
        });
      }
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//ProjectTeamMemberAccepted
router.get("/project/project-team-member-accepted/:pid", async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows] = await pool.execute("CALL ProjectTeamMemberAccepted(?)", [
      pid,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//project_open_work_new_assignee
router.patch("/project/project-open-work-new-assignee", async (req, res) => {
  const reg_id = req.body.reg_id;
  const new_reg_id = req.body.new_reg_id;
  const old_reg_id = req.body.old_reg_id;
  const pm_id = req.body.pm_id;
  const portfolio_id = req.body.portfolio_id;
  try {
    const [check_gm] = await pool.execute("CALL check_ProPMToClear(?)", [
      pm_id,
    ]);
    const check = check_gm[0][0];

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      reg_id,
    ]);
    const powner = check_powner[0][0];

    const [check_new_mem] = await pool.execute("CALL getStudentById(?)", [
      new_reg_id,
    ]);
    const new_mem = check_new_mem[0][0];

    if (check) {
      //console.log("check",check);
      const formattedDate = dateConversion();

      const pid = check.pid;

      const [getTasksRes] = await pool.execute("CALL ProTMOpenTasks(?,?,?)", [
        old_reg_id,
        pid,
        portfolio_id,
      ]);

      const getTasks = getTasksRes[0];
      if (getTasks) {
        for (const gt of getTasks) {
          const updateFieldsValues = `tassignee = '${new_reg_id}'`;
          const upid = `tid  = '${gt.tid}' AND tassignee  = '${old_reg_id}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues,
            upid,
          ]);

          const updateFieldsValues2 = `tcreated_by = '${reg_id}'`;
          const upid2 = `tid  = '${gt.tid}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [
            updateFieldsValues2,
            upid2,
          ]);

          const hdata = {
            pid: gt.pid,
            sid: gt.sid,
            pid: gt.tproject_assign,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} Transfer Task to ${new_mem.first_name} ${new_mem.last_name}`,
          };

          const paramNamesString1 = Object.keys(hdata).join(", ");
          const paramValuesString1 = Object.values(hdata)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL1, [
            paramNamesString1,
            paramValuesString1,
          ]);
        }
      }

      const [getSubtasksRes] = await pool.execute(
        "CALL ProTMOpenSubtasks(?,?,?)",
        [old_reg_id, pid, portfolio_id]
      );

      const getSubtasks = getSubtasksRes[0];
      if (getSubtasks) {
        for (const gs of getSubtasks) {
          const updateFieldsValues = `stassignee = '${new_reg_id}'`;
          const upid = `stid  = '${gs.stid}' AND stassignee  = '${old_reg_id}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues,
            upid,
          ]);

          const updateFieldsValues2 = `stcreated_by = '${reg_id}'`;
          const upid2 = `stid  = '${gs.stid}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [
            updateFieldsValues2,
            upid2,
          ]);

          const hdata = {
            pid: gs.pid,
            sid: gs.sid,
            pid: gs.stproject_assign,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} Transfer Subtask to ${new_mem.first_name} ${new_mem.last_name}`,
          };

          const paramNamesString1 = Object.keys(hdata).join(", ");
          const paramValuesString1 = Object.values(hdata)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL1, [
            paramNamesString1,
            paramValuesString1,
          ]);
        }
      }

      const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
      const pmanager = pdetailRes[0][0]?.pmanager;

      if (pmanager == old_reg_id) {
        const updateFieldsValues2 = `pmanager = ''`;
        const upid = `pid  = '${pid}'`;
        await pool.execute("CALL UpdateProject(?, ?)", [
          updateFieldsValues2,
          upid,
        ]);
      }

      const hdata = {
        pid: pid,
        h_date: formattedDate,
        h_resource_id: powner.reg_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${powner.first_name} ${powner.last_name} Removed from project`,
      };

      const paramNamesString1 = Object.keys(hdata).join(", ");
      const paramValuesString1 = Object.values(hdata)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL1, [
        paramNamesString1,
        paramValuesString1,
      ]);

      const del1 = `pm_id = '${pm_id}'`;
      await pool.execute("CALL DeleteProjectMembers(?)", [del1]);

      res.status(200).json({ message: "removed successfully" });
    } else {
      res.status(200).json({ message: "member not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//assign_projectmanager
router.patch(
  "/project/assign-project-manager/:pid/:pmember",
  async (req, res) => {
    try {
      const pid = req.params.pid;
      const pmember = req.params.pmember;
      const formattedDate = dateConversion();

      const updateFieldsValues2 = `pmanager = '${pmember}'`;
      const upid = `pid  = '${pid}'`;
      await pool.execute("CALL UpdateProject(?, ?)", [
        updateFieldsValues2,
        upid,
      ]);

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        pmember,
      ]);
      const powner = check_powner[0][0];
      const hdata = {
        pid: pid,
        h_date: formattedDate,
        h_resource_id: powner.pmember,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${powner.first_name} ${powner.last_name} assigned as a project manager`,
      };

      const paramNamesString1 = Object.keys(hdata).join(", ");
      const paramValuesString1 = Object.values(hdata)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL1, [
        paramNamesString1,
        paramValuesString1,
      ]);

      res.status(201).json({
        message: "Manager assigned successfully.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

//delete_iMember
router.patch("/project/remove-project-invited-member", async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const im_id = req.body.im_id;
    const pid = req.body.pid;
    const sent_to = req.body.sent_to;

    const formattedDate = dateConversion();

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const powner = check_powner[0][0];

    const hdata = {
      pid: pid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `${sent_to} Removed from project`,
      ginvited_id: im_id,
    };

    const paramNamesString1 = Object.keys(hdata).join(", ");
    const paramValuesString1 = Object.values(hdata)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [
      paramNamesString1,
      paramValuesString1,
    ]);

    const del1 = `im_id = '${im_id}'`;
    await pool.execute("CALL DeleteProjectInvitedMembers(?)", [del1]);

    res.status(201).json({
      message: "removed successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//add_SuggestedPMember
router.patch(
  "/project/add-suggested-project-member/:user_id/:pid/:suggest_id",
  async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const pid = req.params.pid;
      const suggest_id = req.params.suggest_id;

      const formattedDate = dateConversion();

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const [check_user] = await pool.execute("CALL getStudentById(?)", [
        suggest_id,
      ]);
      const user = check_user[0][0];

      const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
      const pdetail = pdetailRes[0][0];

      const [check_project_members] = await pool.execute(
        "CALL check_ProjectMToClear(?,?)",
        [pid, suggest_id]
      );
      if (check_project_members[0].length == 0) {
        const otherFields = {
          status: "approved",
          approve_date: "${formattedDate}",
        };
        const formattedParams = convertObjectToProcedureParams(otherFields);

        const storedProcedure = `CALL UpdateProjectSuggestedMembers('${formattedParams}', 'suggest_id = ${suggest_id}')`;
        await pool.execute(storedProcedure);

        const hdata = {
          pid: pid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${user.first_name} ${user.last_name} is approved by ${powner.first_name} ${powner.last_name}`,
        };

        const paramNamesString1 = Object.keys(hdata).join(", ");
        const paramValuesString1 = Object.values(hdata)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [
          paramNamesString1,
          paramValuesString1,
        ]);

        const data4 = {
          pid: pdetail.pid,
          portfolio_id: pdetail.portfolio_id,
          pmember: suggest_id,
          status: "send",
          pcreated_by: pdetail.pcreated_by,
          sent_date: formattedDate,
          sent_notify_clear: "no",
        };

        const paramNamesString4 = Object.keys(data4).join(", ");
        const paramValuesString4 = Object.values(data4)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL4 = `CALL InsertProjectMembers(?, ?)`;
        await pool.execute(callProcedureSQL4, [
          paramNamesString4,
          paramValuesString4,
        ]);

        const [getpm_id] = await pool.execute(
          "CALL check_ProjectMToClear(?,?)",
          [suggest_id, pdetail.pid]
        );
        const pm_id = getpm_id[0][0]?.pm_id;
        //console.log(pm_id);

        const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
          pdetail.portfolio_id,
        ]);
        const PortfolioName = getPortfolio[0][0]?.portfolio_name;

        const hdata5 = {
          pid: pdetail.pid,
          sid: pdetail.sid,
          gid: pdetail.gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
          pmember_id: pm_id,
        };

        const paramNamesString5 = Object.keys(hdata5).join(", ");
        const paramValuesString5 = Object.values(hdata5)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL5 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL5, [
          paramNamesString5,
          paramValuesString5,
        ]);

        const acceptRequest = `http://localhost:3000/project-request/${pdetail.pid}/${pm_id}/1`;
        const rejectRequest = `http://localhost:3000/project-request/${pdetail.pid}/${pm_id}/2`;

        const mailOptions2 = {
          from: process.env.SMTP_USER,
          to: user.email_address,
          subject: "Project Request | Decision 168",
          html: generateEmailTemplate(
            `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pdetail.pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
            `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
          ),
        };

        transporter.sendMail(mailOptions2, (error, info) => {
          if (error) {
            res.status(500).json({
              error: "Failed to send portfolio invitation email.",
            });
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
  }
);

//add_Suggested_IPMember
router.patch(
  "/project/add-invited-suggested-project-member/:user_id/:pid",
  async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const pid = req.params.pid;
      const suggest_id = req.body.suggest_id;

      const formattedDate = dateConversion();

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
      const pdetail = pdetailRes[0][0];

      const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
        pdetail.portfolio_id,
      ]);
      const PortfolioName = getPortfolio[0][0]?.portfolio_name;

      const [check_if_registered] = await pool.execute("CALL selectLogin(?)", [
        suggest_id,
      ]);
      if (check_if_registered[0].length > 0) {
        const otherFields = {
          status: "approved",
          approve_date: "${formattedDate}",
        };
        const formattedParams = convertObjectToProcedureParams(otherFields);

        const storedProcedure = `CALL UpdateProjectSuggestedMembers('${formattedParams}', 'suggest_id = ${suggest_id}')`;
        await pool.execute(storedProcedure);

        const hdata = {
          pid: pid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${user.first_name} ${user.last_name} is approved by ${powner.first_name} ${powner.last_name}`,
        };

        const paramNamesString1 = Object.keys(hdata).join(", ");
        const paramValuesString1 = Object.values(hdata)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [
          paramNamesString1,
          paramValuesString1,
        ]);

        const data4 = {
          pid: pdetail.pid,
          portfolio_id: pdetail.portfolio_id,
          pmember: suggest_id,
          status: "send",
          pcreated_by: pdetail.pcreated_by,
          sent_date: formattedDate,
          sent_notify_clear: "no",
        };

        const paramNamesString4 = Object.keys(data4).join(", ");
        const paramValuesString4 = Object.values(data4)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL4 = `CALL InsertProjectMembers(?, ?)`;
        await pool.execute(callProcedureSQL4, [
          paramNamesString4,
          paramValuesString4,
        ]);

        const [getpm_id] = await pool.execute(
          "CALL check_ProjectMToClear(?,?)",
          [suggest_id, pdetail.pid]
        );
        const pm_id = getpm_id[0][0]?.pm_id;
        //console.log(pm_id);

        const hdata5 = {
          pid: pdetail.pid,
          sid: pdetail.sid,
          gid: pdetail.gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
          pmember_id: pm_id,
        };

        const paramNamesString5 = Object.keys(hdata5).join(", ");
        const paramValuesString5 = Object.values(hdata5)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL5 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL5, [
          paramNamesString5,
          paramValuesString5,
        ]);

        const acceptRequest = `http://localhost:3000/project-request/${pdetail.pid}/${pm_id}/1`;
        const rejectRequest = `http://localhost:3000/project-request/${pdetail.pid}/${pm_id}/2`;

        const mailOptions2 = {
          from: process.env.SMTP_USER,
          to: user.email_address,
          subject: "Project Request | Decision 168",
          html: generateEmailTemplate(
            `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pdetail.pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
            `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
          ),
        };

        transporter.sendMail(mailOptions2, (error, info) => {
          if (error) {
            res.status(500).json({
              error: "Failed to send portfolio invitation email.",
            });
          } else {
            res.status(201).json({
              message: "Project invitation sent to your email.",
            });
          }
        });
      } else {
        const im = suggest_id;
        const [check_email] = await pool.execute(
          "CALL check_invited_email(?,?,?)",
          [pdetail.pid, pdetail.pcreated_by, im]
        );
        if (check_email[0].length == 0) {
          const data10 = {
            pid: pdetail.pid,
            sent_from: pdetail.pcreated_by,
            sent_to: im,
            status: "pending",
            invite_date: formattedDate,
          };

          const paramNamesString10 = Object.keys(data10).join(", ");
          const paramValuesString10 = Object.values(data10)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL10 = `CALL InsertProjectInvitedMembers(?, ?)`;
          await pool.execute(callProcedureSQL10, [
            paramNamesString10,
            paramValuesString10,
          ]);

          const [getportfolioMem] = await pool.execute(
            "CALL check_PortfolioMember(?,?)",
            [im, pdetail.portfolio_id]
          );

          if (getportfolioMem[0].length == 0) {
            const dataPort = {
              portfolio_id: pdetail.portfolio_id,
              sent_to: im,
              sent_from: pdetail.pcreated_by,
              status: `pending`,
              working_status: `active`,
              status_date: formattedDate,
            };

            const paramNamesStringPort = Object.keys(dataPort).join(", ");
            const paramValuesStringPort = Object.values(dataPort)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQLPort = `CALL InsertProjectPortfolioMember(?, ?)`;
            await pool.execute(callProcedureSQLPort, [
              paramNamesStringPort,
              paramValuesStringPort,
            ]);
          }

          const [getim_id] = await pool.execute(
            "CALL check_invited_email(?,?,?)",
            [pdetail.pid, pdetail.pcreated_by, im]
          );
          const im_id = getim_id[0][0]?.im_id;
          //console.log(im_id);

          const hdata11 = {
            pid: pdetail.pid,
            sid: pdetail.sid,
            gid: pdetail.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} sent invite to ${im}`,
            pinvited_id: im_id,
          };

          const paramNamesString11 = Object.keys(hdata11).join(", ");
          const paramValuesString11 = Object.values(hdata11)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL11 = `CALL InsertProjectHistory(?, ?)`;
          await pool.execute(callProcedureSQL11, [
            paramNamesString11,
            paramValuesString11,
          ]);

          const acceptRequest = `http://localhost:3000/project-invite-request/${pdetail.pid}/${im_id}/1`;
          const rejectRequest = `http://localhost:3000/project-invite-request/${pdetail.pid}/${im_id}/2`;

          const mailOptions2 = {
            from: process.env.SMTP_USER,
            to: im,
            subject: "Project Request | Decision 168",
            html: generateEmailTemplate(
              `Hello ${powner.first_name} ${powner.last_name} has requested you to join Project ${pdetail.pname} as a team member.
          Just click the appropriate button below to join the Project or request more information.
          Portfolio : ${PortfolioName}`,
              `<a href="${acceptRequest}">Join Project</a> <a href="${rejectRequest}">Need More Info</a>`
            ),
          };

          transporter.sendMail(mailOptions2, (error, info) => {
            if (error) {
              res.status(500).json({
                error: "Failed to send portfolio invitation email.",
              });
            } else {
              res.status(201).json({
                message: "Project invitation sent to your email.",
              });
            }
          });
        }
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

//pdetail_SuggestTMember
router.post("/project/insert-project-suggest-team-member", async (req, res) => {
  try {
    let { pid } = req.body;
    let { user_id } = req.body;
    const { team_member, imemail } = req.body;

    const formattedDate = dateConversion();

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const powner = check_powner[0][0];

    const [getProjectRes] = await pool.execute("CALL getProjectById(?)", [pid]);
    const getProject = getProjectRes[0][0];

    //insert suggest team member
    if (team_member && team_member.length > 0) {
      // Use forEach with async/await
      await Promise.all(
        team_member.map(async (t) => {
          const [checks_idRes] = await pool.execute(
            "CALL check_project_suggested_member(?,?)",
            [getProject.pid, t]
          );
          if (!checks_idRes[0] || checks_idRes[0].length === 0) {
            const data6 = {
              pid: pid,
              suggest_id: t,
              status: "suggested",
              already_register: "yes",
              suggested_by: user_id,
              suggested_date: formattedDate,
            };

            const paramNamesString6 = Object.keys(data6).join(", ");
            const paramValuesString6 = Object.values(data6)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL6 = `CALL InsertProjectSuggestedMembers(?, ?)`;
            await pool.execute(callProcedureSQL6, [
              paramNamesString6,
              paramValuesString6,
            ]);

            const [check_user] = await pool.execute("CALL getStudentById(?)", [
              t,
            ]);
            const user = check_user[0][0];

            const [gets_id] = await pool.execute(
              "CALL check_project_suggested_member(?,?)",
              [getProject.pid, t]
            );
            const s_id = gets_id[0][0]?.s_id;
            //console.log(s_id);

            const hdata7 = {
              pid: getProject.pid,
              sid: getProject.sid,
              gid: getProject.gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `${user.first_name} ${user.last_name} is suggested by ${powner.first_name} ${powner.last_name}`,
              pmsuggested_id: s_id,
            };

            const paramNamesString7 = Object.keys(hdata7).join(", ");
            const paramValuesString7 = Object.values(hdata7)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL7 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL7, [
              paramNamesString7,
              paramValuesString7,
            ]);
          }
        })
      );
    }

    //insert suggest invite email
    if (imemail && imemail.length > 0) {
      await Promise.all(
        imemail.map(async (im) => {
          if (!isEmail(im)) {
            return res.status(400).json({ error: "Invalid email address." });
          }

          const [check_if_registered] = await pool.execute(
            "CALL selectLogin(?)",
            [im]
          );
          if (check_if_registered[0].length > 0) {
            const t = check_if_registered[0][0]?.reg_id;
            if (getProject.pcreated_by != rid) {
              const [checks_idRes] = await pool.execute(
                "CALL check_project_suggested_member(?,?)",
                [getProject.pid, t]
              );

              if (!checks_idRes[0] || checks_idRes[0].length === 0) {
                const data6 = {
                  pid: pid,
                  suggest_id: t,
                  status: "suggested",
                  already_register: "yes",
                  suggested_by: user_id,
                  suggested_date: formattedDate,
                };

                const paramNamesString6 = Object.keys(data6).join(", ");
                const paramValuesString6 = Object.values(data6)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL6 = `CALL InsertProjectSuggestedMembers(?, ?)`;
                await pool.execute(callProcedureSQL6, [
                  paramNamesString6,
                  paramValuesString6,
                ]);

                const [check_user] = await pool.execute(
                  "CALL getStudentById(?)",
                  [t]
                );
                const user = check_user[0][0];

                const [gets_id] = await pool.execute(
                  "CALL check_project_suggested_member(?,?)",
                  [getProject.pid, t]
                );
                const s_id = gets_id[0][0]?.s_id;
                //console.log(s_id);

                const hdata7 = {
                  pid: getProject.pid,
                  sid: getProject.sid,
                  gid: getProject.gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${user.first_name} ${user.last_name} is suggested by ${powner.first_name} ${powner.last_name}`,
                  pmsuggested_id: s_id,
                };

                const paramNamesString7 = Object.keys(hdata7).join(", ");
                const paramValuesString7 = Object.values(hdata7)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL7 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL7, [
                  paramNamesString7,
                  paramValuesString7,
                ]);
              }
            }
          } else {
            const [check_email] = await pool.execute(
              "CALL check_invited_suggestemail(?,?)",
              [im, getProject.pid]
            );
            if (check_email[0].length == 0) {
              const [checks_idRes] = await pool.execute(
                "CALL check_project_suggested_member(?,?)",
                [getProject.pid, im]
              );

              if (!checks_idRes[0] || checks_idRes[0].length === 0) {
                const data10 = {
                  pid: pid,
                  suggest_id: im,
                  status: "suggested",
                  already_register: "no",
                  suggested_by: user_id,
                  suggested_date: formattedDate,
                };

                const paramNamesString10 = Object.keys(data10).join(", ");
                const paramValuesString10 = Object.values(data10)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL10 = `CALL InsertProjectSuggestedMembers(?, ?)`;
                await pool.execute(callProcedureSQL10, [
                  paramNamesString10,
                  paramValuesString10,
                ]);

                const [gets_id] = await pool.execute(
                  "CALL check_project_suggested_member(?,?)",
                  [getProject.pid, im]
                );
                const s_id = gets_id[0][0]?.s_id;
                //console.log(im_id);

                const hdata11 = {
                  pid: getProject.pid,
                  sid: getProject.sid,
                  gid: getProject.gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${im} is suggested by ${powner.first_name} ${powner.last_name}`,
                  pmsuggested_id: s_id,
                };

                const paramNamesString11 = Object.keys(hdata11).join(", ");
                const paramValuesString11 = Object.values(hdata11)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL11 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL11, [
                  paramNamesString11,
                  paramValuesString11,
                ]);
              }
            }
          }
        })
      );
    }

    res.status(201).json({
      message: "Member suggested successfully.",
    });
  } catch (error) {
    console.error("Error", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//request_as_member
router.post("/project/insert-project-request-as-member", async (req, res) => {
  try {
    let { pid } = req.body;
    let { user_id } = req.body;

    const formattedDate = dateConversion();

    const [check_user] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const user = check_user[0][0];

    const [getProjectRes] = await pool.execute("CALL getProjectById(?)", [pid]);
    const getProject = getProjectRes[0][0];

    const [check_request_memberRes] = await pool.execute(
      "CALL check_request_member(?,?)",
      [pid, user_id]
    );

    if (
      !check_request_memberRes[0] ||
      check_request_memberRes[0].length === 0
    ) {
      const data10 = {
        pid: pid,
        member: user_id,
        status: "sent",
        mreq_notify: "yes",
        mreq_notify_clear: "no",
        date: formattedDate,
      };

      const paramNamesString10 = Object.keys(data10).join(", ");
      const paramValuesString10 = Object.values(data10)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL10 = `CALL InsertProjectRequestMember(?, ?)`;
      await pool.execute(callProcedureSQL10, [
        paramNamesString10,
        paramValuesString10,
      ]);

      const [getreq_id] = await pool.execute("CALL check_request_member(?,?)", [
        pid,
        user_id,
      ]);
      const req_id = getreq_id[0][0]?.req_id;
      //console.log(im_id);

      const hdata11 = {
        pid: pid,
        sid: getProject.sid,
        gid: getProject.gid,
        h_date: formattedDate,
        h_resource_id: user.reg_id,
        h_resource: `${user.first_name} ${user.last_name}`,
        h_description: `Request As Team Member from ${user.first_name} ${user.last_name}`,
        preqm_id: req_id,
      };

      const paramNamesString11 = Object.keys(hdata11).join(", ");
      const paramValuesString11 = Object.values(hdata11)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL11 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL11, [
        paramNamesString11,
        paramValuesString11,
      ]);
    }

    res.status(201).json({
      message: "Request Sent successfully.",
    });
  } catch (error) {
    console.error("Error", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//add_RequestedPMember
router.patch(
  "/project/add-requested-project-member/:user_id/:pid/:member",
  async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const pid = req.params.pid;
      const member = req.params.member;

      const formattedDate = dateConversion();

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const [check_user] = await pool.execute("CALL getStudentById(?)", [
        member,
      ]);
      const user = check_user[0][0];

      const [pdetailRes] = await pool.execute("CALL getProjectById(?)", [pid]);
      const pdetail = pdetailRes[0][0];

      const [check_project_members] = await pool.execute(
        "CALL check_ProjectMToClear(?,?)",
        [pid, member]
      );
      if (check_project_members[0].length == 0) {
        const otherFields = {
          status: "added",
        };
        const formattedParams = convertObjectToProcedureParams(otherFields);

        const storedProcedure = `CALL UpdateProjectRequestMember('${formattedParams}', 'member = ${member} and pid = ${pid}')`;
        await pool.execute(storedProcedure);

        const otherFields2 = {
          status: "approved",
          approve_date: "${formattedDate}",
        };
        const formattedParams2 = convertObjectToProcedureParams(otherFields2);

        const storedProcedure2 = `CALL UpdateProjectSuggestedMembers('${formattedParams2}', 'suggest_id = ${member} and pid = ${pid}')`;
        await pool.execute(storedProcedure2);

        const data6 = {
          pid: pid,
          powner: user_id,
          pmember: member,
          edit_allow: "no",
        };

        const paramNamesString6 = Object.keys(data6).join(", ");
        const paramValuesString6 = Object.values(data6)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL6 = `CALL InsertProjectManagement(?, ?)`;
        await pool.execute(callProcedureSQL6, [
          paramNamesString6,
          paramValuesString6,
        ]);

        const hdata = {
          pid: pid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${user.first_name} ${user.last_name} is Added in Team by ${powner.first_name} ${powner.last_name}`,
        };

        const paramNamesString1 = Object.keys(hdata).join(", ");
        const paramValuesString1 = Object.values(hdata)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [
          paramNamesString1,
          paramValuesString1,
        ]);

        const data4 = {
          pid: pdetail.pid,
          portfolio_id: pdetail.portfolio_id,
          pmember: member,
          status: "accepted",
          pcreated_by: pdetail.pcreated_by,
          sent_date: formattedDate,
        };

        const paramNamesString4 = Object.keys(data4).join(", ");
        const paramValuesString4 = Object.values(data4)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL4 = `CALL InsertProjectMembers(?, ?)`;
        await pool.execute(callProcedureSQL4, [
          paramNamesString4,
          paramValuesString4,
        ]);

        const [getpm_id] = await pool.execute(
          "CALL check_ProjectMToClear(?,?)",
          [member, pdetail.pid]
        );
        const pm_id = getpm_id[0][0]?.pm_id;
        //console.log(pm_id);

        const hdata5 = {
          pid: pdetail.pid,
          sid: pdetail.sid,
          gid: pdetail.gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} sent team member request to ${user.first_name} ${user.last_name}`,
          pmember_id: pm_id,
        };

        const paramNamesString5 = Object.keys(hdata5).join(", ");
        const paramValuesString5 = Object.values(hdata5)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL5 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL5, [
          paramNamesString5,
          paramValuesString5,
        ]);
      }

      res.status(201).json({
        message: "Added in Team.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

module.exports = router;
