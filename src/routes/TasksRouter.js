require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion, transporter } = require("../utils/common-functions");
const moment = require("moment");
const generateEmailTemplate = require("../utils/emailTemplate");
const { format } = require("mysql2");

//Dashboard (Grid view) All tasks
router.get("/task/all-tasks-subtasks-grid-view/:reg_id", async (req, res) => {
  const { reg_id } = req.params;
  try {
    // Retrieve assigned task list portfolio
    const [assignedTasklist] = await pool.execute("CALL AssignedTasklist(?)", [reg_id]);

    const [assignedSubtasklist] = await pool.execute("CALL AssignedSubtasklist(?)", [reg_id]);

    // Use Promise.all to concurrently fetch subtasks for each task
    const promisesTasks = assignedTasklist[0].map(async (taskItem) => {
      const { tid, tproject_assign } = taskItem;
      try {
        const [projectDetails] = await pool.execute("CALL getProjectById(?)", [tproject_assign]);

        // Filter subtasks for the current task
        const projectName = projectDetails[0].length > 0 ? projectDetails[0][0].pname : null;
        const [subtasks] = await pool.execute("CALL Check_Task_Subtasks2(?)", [tid]);

        const subTasksCount = subtasks[0].length;

        // Combine task and subtask data
        const tdata = {
          ...taskItem,
          projectName,
          subTasksCount,
        };

        return tdata;
      } catch (subtaskError) {
        console.error("Error fetching subtasks for task:", subtaskError);
        // Return task with an empty subtask array in case of an error
        return {
          ...taskItem,
          projectName: null,
          subTasks: [],
        };
      }
    });

    // Use Promise.all to concurrently fetch subtasks for each subtask
    const promisesSubtasks = assignedSubtasklist[0].map(async (subtaskItem) => {
      const { stproject_assign } = subtaskItem;
      try {
        const [projectDetails] = await pool.execute("CALL getProjectById(?)", [stproject_assign]);

        // Filter subtasks for the current subtask
        const projectName = projectDetails[0].length > 0 ? projectDetails[0][0].pname : null;

        // Combine subtask data
        const stdata = {
          ...subtaskItem,
          projectName,
        };

        return stdata;
      } catch (subtaskError) {
        console.error("Error fetching subtasks for subtask:", subtaskError);
        // Return subtask with an empty subtask array in case of an error
        return {
          ...subtaskItem,
          projectName: null,
          subTasks: [],
        };
      }
    });

    // Wait for all promises to resolve
    const tasks = await Promise.all(promisesTasks);
    const subtasks = await Promise.all(promisesSubtasks);

    const combinedArray = [
      ...tasks.map((task) => ({ ...task, type: "task" })),
      ...subtasks.map((subtask) => ({
        ...subtask,
        tid: subtask.stid,
        tcode: subtask.stcode,
        tname: subtask.stname,
        tassignee: subtask.stassignee,
        tpriority: subtask.stpriority,
        tstatus: subtask.ststatus,
        tdue_date: subtask.tdue_date,
        // Add parentTaskName property by finding the corresponding task in tasks array
        parentTaskName: tasks.find((task) => task.tid === subtask.tid)?.tname || null,
        type: "subtask",
      })),
    ];

    res.status(200).json(combinedArray);
  } catch (error) {
    console.error("Error in the route handler:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

//Dashboard (List view) All Tasks
router.get("/task/all-tasks-subtasks-list-view/:reg_id", async (req, res) => {
  const { reg_id } = req.params;
  //(Pagination Code)
  const { page, pageSize } = req.query;
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  try {
    const [assignedTasklist] = await pool.execute("CALL AssignedTasklist(?)", [reg_id]);

    const [assignedSubtasklist_Task] = await pool.execute("CALL AssignedSubtasklist_Task(?)", [reg_id]);

    // Use Promise.all to concurrently fetch subtasks for each task
    const promisesTask = assignedTasklist[0].map(async (item) => {
      const { tid } = item;
      try {
        const [subtasks] = await pool.execute("CALL  Check_Task_Subtasks2(?)", [tid]);
        const subTasks = subtasks[0];

        // Combine task and subtask data
        const data = {
          ...item,
          subTasks,
        };

        return data;
      } catch (subtaskError) {
        console.error("Error fetching subtasks:", subtaskError);
        // Return task with an empty subtask array in case of an error
        return {
          ...item,
          subTasks: [],
        };
      }
    });

    // Use Promise.all to concurrently fetch subtasks for each task
    const promisesMainTask = assignedSubtasklist_Task[0].map(async (item) => {
      const { tid } = item;
      try {
        const [taskDetails] = await pool.execute("CALL getTasksDetail(?)", [tid]);
        const [subtasks] = await pool.execute("CALL  Check_Task_Subtasks2(?)", [tid]);
        const subTasks = subtasks[0];
        const task = taskDetails[0][0];

        // Combine task and subtask data
        const data = {
          ...task,
          subTasks,
        };

        return data;
      } catch (subtaskError) {
        console.error("Error fetching subtasks:", subtaskError);
        // Return task with an empty subtask array in case of an error
        return {
          ...item,
          subTasks: [],
        };
      }
    });

    // Wait for all promises to resolve
    const tasklistResults = await Promise.all(promisesTask);
    const getMainTaskResults = await Promise.all(promisesMainTask);

    const result = [...tasklistResults, ...getMainTaskResults];

    // Function to remove duplicates based on the 'tid' property
    const removeDuplicates = (result) => {
      return result.filter((item, index, array) => {
        // Return true for the first occurrence of each 'tid'
        return array.findIndex((element) => element.tid === item.tid) === index;
      });
    };

    const filteredData = removeDuplicates(result);

    // Simulate querying a database (Pagination Code)
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredData.length / pageSize);
    res.status(200).json({ data: paginatedData, totalPages: totalPages });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//(LIST VIEW) All Porfolio Tasks and Subtsks by portfolio_id and reg_id
router.get("/task/portfolio-tasks-subtasks-list-view/:portfolio_id/:reg_id", async (req, res) => {
  const { portfolio_id, reg_id } = req.params;
  const { page, pageSize } = req.query;
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  try {
    const [asssignedTasklistPortfolio] = await pool.execute("CALL AssignedTasklistPortfolio(?,?)", [portfolio_id, reg_id]);

    const [assignedSubtasklist_TaskPortfolio] = await pool.execute("CALL AssignedSubtasklist_TaskPortfolio(?,?)", [portfolio_id, reg_id]);

    // Use Promise.all to concurrently fetch subtasks for each task
    const promisesTask = asssignedTasklistPortfolio[0].map(async (item) => {
      const { tid } = item;
      try {
        const [subtasks] = await pool.execute("CALL  Check_Task_Subtasks2(?)", [tid]);
        const subTasks = subtasks[0];

        // Combine task and subtask data
        const data = {
          ...item,
          subTasks,
        };

        return data;
      } catch (subtaskError) {
        console.error("Error fetching subtasks:", subtaskError);
        // Return task with an empty subtask array in case of an error
        return {
          ...item,
          subTasks: [],
        };
      }
    });

    // Use Promise.all to concurrently fetch subtasks for each task
    const promisesMainTask = assignedSubtasklist_TaskPortfolio[0].map(async (item) => {
      const { tid } = item;
      try {
        const [taskDetails] = await pool.execute("CALL getTasksDetail(?)", [tid]);
        const [subtasks] = await pool.execute("CALL  Check_Task_Subtasks2(?)", [tid]);
        const subTasks = subtasks[0];
        const task = taskDetails[0][0];

        // Combine task and subtask data
        const data = {
          ...task,
          subTasks,
        };

        return data;
      } catch (subtaskError) {
        console.error("Error fetching subtasks:", subtaskError);
        // Return task with an empty subtask array in case of an error
        return {
          ...item,
          subTasks: [],
        };
      }
    });

    // Wait for all promises to resolve
    const tasklistResults = await Promise.all(promisesTask);
    const getMainTaskResults = await Promise.all(promisesMainTask);

    const result = [...tasklistResults, ...getMainTaskResults];

    // Function to remove duplicates based on the 'tid' property
    const removeDuplicates = (result) => {
      return result.filter((item, index, array) => {
        // Return true for the first occurrence of each 'tid'
        return array.findIndex((element) => element.tid === item.tid) === index;
      });
    };

    const filteredData = removeDuplicates(result);

    // Simulate querying a database (Pagination Code)
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredData.length / pageSize);
    res.status(200).json({ data: paginatedData, totalPages: totalPages });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//(GRID VIEW) All Porfolio Tasks and Subtsks by portfolio_id and reg_id
router.get("/task/portfolio-tasks-subtasks-grid-view/:portfolio_id/:reg_id", async (req, res) => {
  const { portfolio_id, reg_id } = req.params;

  try {
    // Retrieve assigned task list portfolio
    const [assignedTasklistPortfolio] = await pool.execute("CALL AssignedTasklistPortfolio(?,?)", [portfolio_id, reg_id]);

    const [assignedSubtasklistPortfolio] = await pool.execute("CALL AssignedSubtasklistPortfolio(?,?)", [portfolio_id, reg_id]);

    // Use Promise.all to concurrently fetch subtasks for each task
    const promisesTasks = assignedTasklistPortfolio[0].map(async (taskItem) => {
      const { tid, tproject_assign } = taskItem;
      try {
        const [projectDetails] = await pool.execute("CALL getProjectById(?)", [tproject_assign]);

        // Filter subtasks for the current task
        const projectName = projectDetails[0].length > 0 ? projectDetails[0][0].pname : null;
        const [subtasks] = await pool.execute("CALL Check_Task_Subtasks2(?)", [tid]);

        const subTasksCount = subtasks[0].length;

        // Combine task and subtask data
        const tdata = {
          ...taskItem,
          projectName,
          subTasksCount,
        };

        return tdata;
      } catch (subtaskError) {
        console.error("Error fetching subtasks for task:", subtaskError);
        // Return task with an empty subtask array in case of an error
        return {
          ...taskItem,
          projectName: null,
          subTasks: [],
        };
      }
    });

    // Use Promise.all to concurrently fetch subtasks for each subtask
    const promisesSubtasks = assignedSubtasklistPortfolio[0].map(async (subtaskItem) => {
      const { stproject_assign } = subtaskItem;
      try {
        const [projectDetails] = await pool.execute("CALL getProjectById(?)", [stproject_assign]);

        // Filter subtasks for the current subtask
        const projectName = projectDetails[0].length > 0 ? projectDetails[0][0].pname : null;

        // Combine subtask data
        const stdata = {
          ...subtaskItem,
          projectName,
        };

        return stdata;
      } catch (subtaskError) {
        console.error("Error fetching subtasks for subtask:", subtaskError);
        // Return subtask with an empty subtask array in case of an error
        return {
          ...subtaskItem,
          projectName: null,
          subTasks: [],
        };
      }
    });

    // Wait for all promises to resolve
    const tasks = await Promise.all(promisesTasks);
    const subtasks = await Promise.all(promisesSubtasks);

    const combinedArray = [
      ...tasks.map((task) => ({ ...task, type: "task" })),
      ...subtasks.map((subtask) => ({
        ...subtask,
        tid: subtask.stid,
        tcode: subtask.stcode,
        tname: subtask.stname,
        tassignee: subtask.stassignee,
        tpriority: subtask.stpriority,
        tstatus: subtask.ststatus,
        tdue_date: subtask.tdue_date,
        // Add parentTaskName property by finding the corresponding task in tasks array
        parentTaskName: tasks.find((task) => task.tid === subtask.tid)?.tname || null,
        type: "subtask",
      })),
    ];

    res.status(200).json(combinedArray);
  } catch (error) {
    console.error("Error in the route handler:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

//Portfolio tasks from portfolio page [Done]
router.get("/task/portfolio-tasks/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  //(Pagination Code)
  const { page, pageSize } = req.query;
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  try {
    const [portfolioTasks] = await pool.execute("CALL portfolio_tasksNew(?)", [portfolio_id]);

    const portfolioTasksPromises = portfolioTasks[0].map(async (portfolioTaskItem) => {
      const { tid, tassignee } = portfolioTaskItem;

      try {
        const [taskAssigneeDetails] = await pool.execute("CALL getStudentById(?)", [tassignee]);

        const [subtasks] = await pool.execute("CALL Check_Task_Subtasks2(?)", [tid]);

        const subtasksPromises = subtasks[0].map(async (subtaskItem) => {
          const { stassignee } = subtaskItem;
          const [subtaskAssigneeDetails] = await pool.execute("CALL getStudentById(?)", [stassignee]);

          const subtaskData = {
            ...subtaskItem,
            subTaskAssigneeName: `${subtaskAssigneeDetails[0][0].first_name} ${subtaskAssigneeDetails[0][0].last_name}`,
          };

          return subtaskData;
        });

        const subtasksResults = await Promise.all(subtasksPromises);

        const taskData = {
          ...portfolioTaskItem,
          taskAssigneeName: `${taskAssigneeDetails[0][0].first_name} ${taskAssigneeDetails[0][0].last_name}`,
          subTasks: subtasksResults,
        };

        return taskData;
      } catch (subtaskError) {
        console.error("Error fetching subtasks:", subtaskError);
        return {
          ...portfolioTaskItem,
          subTasks: [],
        };
      }
    });

    const portfolioTasksResults = await Promise.all(portfolioTasksPromises);

    // Simulate querying a database (Pagination Code)
    const paginatedData = portfolioTasksResults.slice(startIndex, endIndex);
    const totalPages = Math.ceil(portfolioTasksResults.length / pageSize);
    res.status(200).json({ data: paginatedData, totalPages: totalPages });
  } catch (portfolioTasksError) {
    console.error("Error executing stored procedure:", portfolioTasksError);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//(Not In use) get Portfolio Task list by portfolio id and reg_id
router.get("/task/portfolio-tasks-list/:portfolio_id/:reg_id", async (req, res) => {
  const { portfolio_id, reg_id } = req.params;

  try {
    const [asssignedTasklistPortfolio] = await pool.execute("CALL AssignedTasklistPortfolio(?,?)", [portfolio_id, reg_id]);
    const [assignedSubtasklist_TaskPortfolio] = await pool.execute("CALL AssignedSubtasklist_TaskPortfolio(?,?)", [portfolio_id, reg_id]);
    const [assignedSubtasklistPortfolio] = await pool.execute("CALL AssignedSubtasklistPortfolio(?,?)", [portfolio_id, reg_id]);
    res.status(200).json({
      check_port_id: portfolio_id,
      assignedTasklist: asssignedTasklistPortfolio[0], // grid view or list view
      assignedSubtasklist_Task: assignedSubtasklist_TaskPortfolio[0], //list view
      assignedSubtasklist: assignedSubtasklistPortfolio[0], //grid view
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get Task Details by task id
router.get("/task/task-detail/:task_id", async (req, res) => {
  const { task_id } = req.params;
  try {
    const [taskDetails] = await pool.execute("CALL TaskDetail(?)", [task_id]);

    if (taskDetails[0][0]) {
      const { tproject_assign, portfolio_id, tcreated_by, tassignee } = taskDetails[0][0];

      const [getUserDetailsByTcreatedBy] = await pool.execute("CALL getStudentById(?)", [tcreated_by]);

      const [getUserDetailsbyTassignee] = await pool.execute("CALL getStudentById(?)", [tassignee]);

      const [projectDetails] = await pool.execute("CALL getProjectById(?)", [tproject_assign]);

      const [portfolioDetails] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);

      const [subtaskDetails] = await pool.execute("CALL Check_Task_Subtasks2(?)", [task_id]);

      res.status(200).json({
        ...taskDetails[0][0],
        projectName: projectDetails[0][0].pname,
        portfolioName: portfolioDetails[0][0].portfolio_name,
        taskCreatedByName: `${getUserDetailsByTcreatedBy[0][0].first_name} ${getUserDetailsByTcreatedBy[0][0].last_name}`,
        taskAssigneeName: `${getUserDetailsbyTassignee[0][0].first_name} ${getUserDetailsbyTassignee[0][0].last_name}`,
        subTasks: subtaskDetails[0],
      });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Subtask Details
router.get("/subtask/subtask-detail/:subtask_id", async (req, res) => {
  const { subtask_id } = req.params;
  try {
    const [subtaskDetails] = await pool.execute("CALL SubtaskDetail(?)", [subtask_id]);

    if (subtaskDetails[0][0]) {
      const { stproject_assign, portfolio_id, stcreated_by, stassignee } = subtaskDetails[0][0];

      const [getUserDetailsByTcreatedBy] = await pool.execute("CALL getStudentById(?)", [stcreated_by]);

      const [getUserDetailsbyTassignee] = await pool.execute("CALL getStudentById(?)", [stassignee]);

      const [projectDetails] = await pool.execute("CALL getProjectById(?)", [stproject_assign]);

      const [portfolioDetails] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);

      res.status(200).json({
        ...subtaskDetails[0][0],
        projectName: projectDetails[0][0].pname,
        portfolioName: portfolioDetails[0][0].portfolio_name,
        subTaskCreatedByName: `${getUserDetailsByTcreatedBy[0][0].first_name} ${getUserDetailsByTcreatedBy[0][0].last_name}`,
        subTaskAssigneeName: `${getUserDetailsbyTassignee[0][0].first_name} ${getUserDetailsbyTassignee[0][0].last_name}`,
      });
    } else {
      res.status(404).json({ error: "Subtask not found" });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Insert Task
router.post("/task/insert-task/:user_id", async (req, res) => {
  //TO DO change the let to const for below two lines
  let { user_id } = req.params;
  let { portfolio_id, project_id, team_member2, links, link_comments, sid, gid, tname, tdes, tnote, tfile, tpriority, dept, tdue_date } = req.body;
  try {
    const [project_row] = await pool.execute("CALL getProjectById(?)", [project_id]);
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    let taskInsertedId;
    if (student) {
      const [team_member2_row] = await pool.execute("CALL getStudentById(?)", [team_member2]);
      const links_string = links.map((linkObj) => Object.values(linkObj).join(",")).join(",");
      const link_comments_string = link_comments.map((linkObj) => Object.values(linkObj).join(",")).join(",");
      const tfile_string = tfile.map((linkObj) => Object.values(linkObj).join(",")).join(",");

      let get_tcode = "";
      let pro_owner = "";
      let pro_manager = "";
      let pname = "";
      let pdes = "";
      let portfolio_owner_id = "";
      if (project_id) {
        const project_name = project_row[0][0].pname;
        const letter = project_name.trim().substring(0, 2).toUpperCase();
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `${letter}-${random_num}`;

        portfolio_id = project_row[0][0].portfolio_id;
        pro_owner = project_row[0][0].pcreated_by;
        pro_manager = project_row[0][0].pmanager;
        pname = project_row[0][0].pname;
        pdes = project_row[0][0].pdes;
        const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);
        portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
      } else {
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `T-${random_num}`;
      }

      let index = "";
      if (pro_owner != team_member2) {
        const [pdetail_member] = await pool.execute("CALL getMemberProject(?)", [project_id]);
        let pro_member = [];
        if (pdetail_member[0]) {
          pdetail_member[0].forEach(async (pm) => {
            pro_member.push(pm.pmember);
          });
        }
        index = pro_member.indexOf(team_member2);
      }

      if (pro_owner == user_id || pro_manager == user_id || portfolio_owner_id == user_id) {
        if (pro_owner != team_member2) {
          if (index === -1) {
            const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [project_id, team_member2]);
            if (check_if_suggested[0][0]) {
              const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
              const suggestTM1 = `pid = '${project_id}'`;
              const suggestTM2 = `suggest_id = '${team_member2}'`;
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [suggestTMFieldsValues, suggestTM1, suggestTM2]);
            }

            const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
            const tmFieldsValues = `"${project_id}", "${portfolio_id}", "${team_member2}", "send", "${user_id}", "${formattedDate}", "no"`;

            await pool.execute("CALL InsertProjectMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

            const [inserted_pm] = await pool.execute("CALL LastInsertedProjectMembers(?)", [user_id]);
            const inserted_pm_id = inserted_pm[0][0].pm_id;

            const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmember_id";
            const tmHistoryFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${inserted_pm_id}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);

            let get_portfolio_name = "";
            const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]);
            if (check_portfolio_name) {
              if (check_portfolio_name[0][0].portfolio_user == "individual") {
                get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
              } else {
                get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
              }
            }

            const RequestEmailID = team_member2_row[0][0].email_address;

            const acceptProjectRequest = `http://localhost:3000/project-request/${project_id}/${inserted_pm_id}/1`;
            const rejectProjectRequest = `http://localhost:3000/project-request/${project_id}/${inserted_pm_id}/2`;
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: RequestEmailID,
              subject: "Project Request | Decision 168",
              html: generateEmailTemplate(
                `Hello ${team_member2_row[0][0].first_name},
            ${student.first_name} ${
                  student.last_name
                } has requested you to join project ${pname} as a team member. Just click the appropriate button below to join the project or request more information.
            Portfolio: ${get_portfolio_name}
            Project Short Description: ${pdes.substring(0, 100)}...`,
                `<a href="${acceptProjectRequest}">Join Project</a>`,
                `<a href="${rejectProjectRequest}">Need More Info</a>`
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send portfolio invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "added successfully.",
                });
              }
            });
          }
        }
      } else {
        if (pro_owner != team_member2) {
          if (index === -1) {
            const [check] = await pool.execute("CALL check_suggested(?,?)", [project_id, team_member2]);
            const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [project_id, team_member2]);

            if (!check[0][0] && !check_pmem[0][0]) {
              const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
              const tmFieldsValues = `"${project_id}", "${team_member2}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

              await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

              const [inserted_tm] = await pool.execute("CALL LastInsertProjectSuggestedMembers(?)", [user_id]);
              const inserted_tm_id = inserted_tm[0][0].s_id;

              const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmsuggested_id";
              const tmHistoryFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}", "${inserted_tm_id}"`;

              await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);
            }
          }
        }
      }

      // Assuming this.input.post('tdue_date') is a valid date string
      const dueTDate = new Date(tdue_date);
      // Formatting the date as "YYYY-MM-DD"
      const taskformattedDueDate = dueTDate.toISOString().split("T")[0];

      const taskFieldsNames =
        "tcode, tname, tdes, tlink, tlink_comment, tnote, tfile, tpriority, tstatus, tstatus_date, tproject_assign, portfolio_id, tassignee, tcreated_by, tcreated_date, tnotify, tnotify_clear, tnotify_date, tdue_date, tdue_date_clear, gid, sid, dept_id";
      const taskFieldsValues = `"${get_tcode}", "${tname}", "${tdes}", "${links_string}", "${link_comments_string}", "${tnote}", "${tfile_string}", "${tpriority}", 'to_do', "${formattedDate}", "${project_id}", "${portfolio_id}", "${team_member2}", "${user_id}", "${formattedDate}", 'yes', 'no', "${formattedDate}", "${taskformattedDueDate}", 'no', "${gid}", "${sid}", "${dept}"`;

      await pool.execute("CALL InsertTask(?,?)", [taskFieldsNames, taskFieldsValues]);

      const [inserted_task] = await pool.execute("CALL LastInsertTask(?)", [user_id]);
      const inserted_task_id = inserted_task[0][0].tid;
      taskInsertedId = inserted_task_id;
      const historyFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, task_id";
      const historyFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Task Code: ${get_tcode}, Task Name: ${tname}, Created By ${student.first_name} ${student.last_name} and assigned to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${inserted_task_id}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
    }

    return res.status(200).json({ taskInsertedId: taskInsertedId, message: "Task Created Successfully." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit Task
router.patch("/task/edit-task/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let { portfolio_id, tid, project_id, team_member2, links, link_comments, sid, gid, tname, tdes, tnote, tfile, tpriority, dept, tdue_date } = req.body;
  try {
    const [task_row] = await pool.execute("CALL getTasksDetail(?)", [tid]);
    const getTasksDetail = task_row[0][0];
    const [project_row] = await pool.execute("CALL getProjectById(?)", [project_id]);
    const pdetail = project_row[0][0];
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (student) {
      const [team_member2_row] = await pool.execute("CALL getStudentById(?)", [team_member2]);
      const links_string = links.map((linkObj) => Object.values(linkObj).join(",")).join(",");
      const link_comments_string = link_comments.map((linkObj) => Object.values(linkObj).join(",")).join(",");
      const tfile_string = tfile.map((linkObj) => Object.values(linkObj).join(",")).join(",");

      if (project_id) {
        if (project_row[0][0].portfolio_id) {
          portfolio_id = project_row[0][0].portfolio_id;
          const taskFieldsValues = `stproject_assign = '${project_id}', portfolio_id = '${portfolio_id}', dept_id = '${dept}', gid = '${project_row[0][0].gid}', sid = '${project_row[0][0].sid}'`;
          const task_id = `tid = '${tid}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [taskFieldsValues, task_id]);
        } else {
          const taskFieldsValues = `stproject_assign = '${project_id}', dept_id = '${dept}', gid = '${gid}', sid = '${sid}'`;
          const task_id = `tid = '${tid}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [taskFieldsValues, task_id]);
        }
      }

      let get_tcode = "";
      if (project_id) {
        const project_name = project_row[0][0].pname;
        const letter = project_name.trim().substring(0, 2).toUpperCase();
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `${letter}-${random_num}`;
      } else {
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `T-${random_num}`;
      }

      const [pdetail_mem] = await pool.execute("CALL getMemberProject(?)", [project_id]);
      const pdetail_member = pdetail_mem[0];
      let pro_member = [];
      let pro_member1 = [];
      let pro_member2 = [];
      if (pdetail || pdetail_member) {
        if (pdetail) {
          pro_member1.push(pdetail.pcreated_by);
        }
        if (pdetail_member) {
          // Use Promise.all to wait for all asynchronous operations to complete
          pro_member2 = await Promise.all(
            pdetail_member.map(async (pm) => {
              return pm.pmember;
            })
          );
        }
      }
      pro_member = pro_member2.concat(pro_member1);

      const user_index = pro_member.indexOf(user_id);
      if (user_index !== -1) {
        pro_member.splice(user_index, 1);
      }

      const final_mem = pro_member.join(",");

      let tnotify = "";
      let tnotify_clear = "";
      if (getTasksDetail) {
        if (getTasksDetail.tassignee == team_member2) {
          tnotify = getTasksDetail.tnotify;
          tnotify_clear = getTasksDetail.tnotify_clear;
        } else {
          tnotify = "yes";
          tnotify_clear = "no";
        }
      }

      let pro_owner = "";
      let pro_manager = "";
      let pname = "";
      let pdes = "";
      let portfolio_owner_id = "";
      if (project_row[0][0]) {
        pro_owner = project_row[0][0].pcreated_by;
        pro_manager = project_row[0][0].pmanager;
        pname = project_row[0][0].pname;
        pdes = project_row[0][0].pdes;
        const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);
        portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
      }

      let index = "";
      if (pro_owner != team_member2) {
        let pro_member = [];
        if (pdetail_member[0]) {
          pdetail_member[0].forEach(async (pm) => {
            pro_member.push(pm.pmember);
          });
        }
        index = pro_member.indexOf(team_member2);
      }

      if (pro_owner == user_id || pro_manager == user_id || portfolio_owner_id == user_id) {
        if (pro_owner != team_member2) {
          if (index === -1) {
            const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [project_id, team_member2]);
            if (check_if_suggested[0][0]) {
              const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
              const suggestTM1 = `pid = '${project_id}'`;
              const suggestTM2 = `suggest_id = '${team_member2}'`;
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [suggestTMFieldsValues, suggestTM1, suggestTM2]);
            }

            const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
            const tmFieldsValues = `"${project_id}", "${portfolio_id}", "${team_member2}", "send", "${user_id}", "${formattedDate}", "no"`;

            await pool.execute("CALL InsertProjectMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

            const [inserted_pm] = await pool.execute("CALL LastInsertedProjectMembers(?)", [user_id]);
            const inserted_pm_id = inserted_pm[0][0].pm_id;

            const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmember_id";
            const tmHistoryFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${inserted_pm_id}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);

            let get_portfolio_name = "";
            const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]);
            if (check_portfolio_name) {
              if (check_portfolio_name[0][0].portfolio_user == "individual") {
                get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
              } else {
                get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
              }
            }

            const RequestEmailID = team_member2_row[0][0].email_address;

            const acceptProjectRequest = `http://localhost:3000/project-request/${project_id}/${inserted_pm_id}/1`;
            const rejectProjectRequest = `http://localhost:3000/project-request/${project_id}/${inserted_pm_id}/2`;
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: RequestEmailID,
              subject: "Project Request | Decision 168",
              html: generateEmailTemplate(
                `Hello ${team_member2_row[0][0].first_name},
            ${student.first_name} ${
                  student.last_name
                } has requested you to join project ${pname} as a team member. Just click the appropriate button below to join the project or request more information.
            Portfolio: ${get_portfolio_name}
            Project Short Description: ${pdes.substring(0, 100)}...`,
                `<a href="${acceptProjectRequest}">Join Project</a>`,
                `<a href="${rejectProjectRequest}">Need More Info</a>`
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send portfolio invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "added successfully.",
                });
              }
            });
          }
        }
      } else {
        if (pro_owner != team_member2) {
          if (index === -1) {
            const [check] = await pool.execute("CALL check_suggested(?,?)", [project_id, team_member2]);
            const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [project_id, team_member2]);

            if (!check[0][0] && !check_pmem[0][0]) {
              const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
              const tmFieldsValues = `"${project_id}", "${team_member2}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

              await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

              const [inserted_tm] = await pool.execute("CALL LastInsertProjectSuggestedMembers(?)", [user_id]);
              const inserted_tm_id = inserted_tm[0][0].s_id;

              const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmsuggested_id";
              const tmHistoryFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}", "${inserted_tm_id}"`;

              await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);
            }
          }
        }
      }

      // Assuming this.input.post('tdue_date') is a valid date string
      const dueTDate = new Date(tdue_date);
      // Formatting the date as "YYYY-MM-DD"
      const taskformattedDueDate = dueTDate.toISOString().split("T")[0];

      const tFieldsValues = `tcode = "${get_tcode}", tname = "${tname}", tdes = "${tdes}", tlink = "${links_string}", tlink_comment = "${link_comments_string}", tnote = "${tnote}", tfile = "${tfile_string}", tpriority = "${tpriority}", tstatus = 'to_do', tstatus_date = "${formattedDate}", tproject_assign = "${project_id}", portfolio_id = "${portfolio_id}", tassignee = "${team_member2}", tcreated_by = "${user_id}", tcreated_date = "${formattedDate}", tfnotify = "${final_mem}", tfnotify_clear = "${final_mem}", tfnotify_date = "${formattedDate}", tnotify = "${tnotify}", tnotify_clear = "${tnotify_clear}", tnotify_date = "${formattedDate}", tdue_date = "${taskformattedDueDate}", tdue_date_clear = 'no', gid = "${gid}", sid = "${sid}", dept_id = "${dept}"`;
      const task_id = `tid = '${tid}'`;

      await pool.execute("CALL UpdateTask(?,?)", [tFieldsValues, task_id]);

      const historyFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, task_id";
      const historyFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Task Code: ${get_tcode}, Task Name: ${tname}, Edited By ${student.first_name} ${student.last_name} and assigned to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${tid}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
    }
    return res.status(200).json({ message: "Task Edited Successfully." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Insert Subtask
router.post("/subtask/insert-subtask/:user_id/:portfolio_id", async (req, res) => {
  let { user_id, portfolio_id } = req.params;
  const { tid, tproject_assign, sid, gid, dept, taskArray } = req.body;
  let inserted_task_id; // Declare outside the try block
  try {
    const [project_row] = await pool.execute("CALL getProjectById(?)", [tproject_assign]);
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (student) {
      let get_tcode = "";
      let pro_owner = "";
      let pro_manager = "";
      let pname = "";
      let pdes = "";
      let portfolio_owner_id = "";
      if (tproject_assign) {
        const project_name = project_row[0][0].pname;
        const letter = project_name.trim().substring(0, 2).toUpperCase();
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `${letter}-${random_num}`;

        portfolio_id = project_row[0][0].portfolio_id;
        pro_owner = project_row[0][0].pcreated_by;
        pro_manager = project_row[0][0].pmanager;
        pname = project_row[0][0].pname;
        pdes = project_row[0][0].pdes;
        const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);
        portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
      } else {
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `T-${random_num}`;
      }
      const results = await Promise.all(
        taskArray.map(async (item) => {
          const [team_member2_row] = await pool.execute("CALL getStudentById(?)", [item.team_member2]);
          const slinks_string = item.slinks.map((linkObj) => Object.values(linkObj).join(",")).join(",");
          const slink_comments_string = item.slink_comments.map((linkObj) => Object.values(linkObj).join(",")).join(",");
          const stfile_string = item.stfile.map((linkObj) => Object.values(linkObj).join(",")).join(",");

          let index = "";
          if (pro_owner != item.team_member2) {
            const [pdetail_member] = await pool.execute("CALL getMemberProject(?)", [tproject_assign]);
            let pro_member = [];
            if (pdetail_member[0]) {
              pdetail_member[0].forEach(async (pm) => {
                pro_member.push(pm.pmember);
              });
            }
            index = pro_member.indexOf(item.team_member2);
          }

          if (pro_owner == user_id || pro_manager == user_id || portfolio_owner_id == user_id) {
            if (pro_owner != item.team_member2) {
              if (index === -1) {
                const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [tproject_assign, item.team_member2]);
                if (check_if_suggested[0][0]) {
                  const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
                  const suggestTM1 = `pid = '${tproject_assign}'`;
                  const suggestTM2 = `suggest_id = '${item.team_member2}'`;
                  await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [suggestTMFieldsValues, suggestTM1, suggestTM2]);
                }

                const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
                const tmFieldsValues = `"${tproject_assign}", "${portfolio_id}", "${item.team_member2}", "send", "${user_id}", "${formattedDate}", "no"`;

                await pool.execute("CALL InsertProjectMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

                const [inserted_pm] = await pool.execute("CALL LastInsertedProjectMembers(?)", [user_id]);
                const inserted_pm_id = inserted_pm[0][0].pm_id;

                const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmember_id";
                const tmHistoryFieldsValues = `"${tproject_assign}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${inserted_pm_id}"`;

                await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);

                let get_portfolio_name = "";
                const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]);
                if (check_portfolio_name) {
                  if (check_portfolio_name[0][0].portfolio_user == "individual") {
                    get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
                  } else {
                    get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
                  }
                }

                const RequestEmailID = team_member2_row[0][0].email_address;

                const acceptProjectRequest = `http://localhost:3000/project-request/${tproject_assign}/${inserted_pm_id}/1`;
                const rejectProjectRequest = `http://localhost:3000/project-request/${tproject_assign}/${inserted_pm_id}/2`;
                const mailOptions = {
                  from: process.env.SMTP_USER,
                  to: RequestEmailID,
                  subject: "Project Request | Decision 168",
                  html: generateEmailTemplate(
                    `Hello ${team_member2_row[0][0].first_name},
            ${student.first_name} ${
                      student.last_name
                    } has requested you to join project ${pname} as a team member. Just click the appropriate button below to join the project or request more information.
            Portfolio: ${get_portfolio_name}
            Project Short Description: ${pdes.substring(0, 100)}...`,
                    `<a href="${acceptProjectRequest}">Join Project</a>`,
                    `<a href="${rejectProjectRequest}">Need More Info</a>`
                  ),
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    res.status(500).json({
                      error: "Failed to send portfolio invitation email.",
                    });
                  } else {
                    res.status(201).json({
                      message: "added successfully.",
                    });
                  }
                });
              }
            }
          } else {
            if (pro_owner != item.team_member2) {
              if (index === -1) {
                const [check] = await pool.execute("CALL check_suggested(?,?)", [tproject_assign, item.team_member2]);
                const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [tproject_assign, item.team_member2]);

                if (!check[0][0] && !check_pmem[0][0]) {
                  const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
                  const tmFieldsValues = `"${tproject_assign}", "${item.team_member2}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

                  await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

                  const [inserted_tm] = await pool.execute("CALL LastInsertProjectSuggestedMembers(?)", [user_id]);
                  const inserted_tm_id = inserted_tm[0][0].s_id;

                  const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmsuggested_id";
                  const tmHistoryFieldsValues = `"${tproject_assign}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}", "${inserted_tm_id}"`;

                  await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);
                }
              }
            }
          }

          // Assuming this.input.post('tdue_date') is a valid date string
          const dueTDate = new Date(item.stdue_date);
          // Formatting the date as "YYYY-MM-DD"
          const taskformattedDueDate = dueTDate.toISOString().split("T")[0];

          const taskFieldsNames =
            "tid, stcode, stname, stdes, stlink, stlink_comment, stnote, stfile, stpriority, ststatus, ststatus_date, stproject_assign, portfolio_id, stassignee, stcreated_by, stcreated_date, stnotify, stnotify_clear, stnotify_date, stdue_date, stdue_date_clear, gid, sid, dept_id";
          const taskFieldsValues = `"${tid}", "${get_tcode}", "${item.stname}", "${item.stdes}", "${slinks_string}", "${slink_comments_string}", "${item.stnote}", "${stfile_string}", "${item.stpriority}", 'to_do', "${formattedDate}", "${tproject_assign}", "${portfolio_id}", "${item.team_member2}", "${user_id}", "${formattedDate}", 'yes', 'no', "${formattedDate}", "${taskformattedDueDate}", 'no', "${gid}", "${sid}", "${dept}"`;

          await pool.execute("CALL InsertSubtask(?,?)", [taskFieldsNames, taskFieldsValues]);

          const [inserted_task] = await pool.execute("CALL LastInsertSubTask(?)", [user_id]);
          inserted_task_id = inserted_task[0][0].stid;

          const historyFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, subtask_id";
          const historyFieldsValues = `"${tproject_assign}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Subtask Code: ${get_tcode}, Subtask Name: ${item.stname}, Created By ${student.first_name} ${student.last_name} and assigned to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${inserted_task_id}"`;

          await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);

          if (inserted_task_id) {
            const [t_changestatus] = await pool.execute("CALL getTasksDetailsbyID(?)", [tid]);
            let new_tstatus = "in_progress";
            if (t_changestatus[0][0]) {
              if (t_changestatus[0][0].tstatus == "to_do") {
                new_tstatus = "to_do";
              }
            }
            const tFieldsValues = `tstatus = "${new_tstatus}", review = "", review_clear = "", review_notify = "", po_review_clear = "", po_review_notify = "", tstatus_date = "${formattedDate}"`;
            const task_id = `tid = '${tid}'`;

            await pool.execute("CALL UpdateTask(?,?)", [tFieldsValues, task_id]);
          }
        })
      );
    }
    return res.status(200).json({ subtaskInsertedId: inserted_task_id, message: "Subtask Created Successfully." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit SubTask
router.post("/subtask/edit-subtask/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  const { stid, stproject_assign, team_member2, slinks, slink_comments, sid, gid, stname, stdes, stnote, stfile, tpriority, dept, tdue_date } = req.body;
  try {
    const [subtask_row] = await pool.execute("CALL check_subtask(?)", [stid]);
    const check_subtask = subtask_row[0][0];
    const [project_row] = await pool.execute("CALL getProjectById(?)", [stproject_assign]);
    const pdetail = project_row[0][0];
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (student) {
      const [team_member2_row] = await pool.execute("CALL getStudentById(?)", [team_member2]);
      const slinks_string = slinks.map((linkObj) => Object.values(linkObj).join(",")).join(",");
      const slink_comments_string = slink_comments.map((linkObj) => Object.values(linkObj).join(",")).join(",");
      const stfile_string = stfile.map((linkObj) => Object.values(linkObj).join(",")).join(",");

      const [pdetail_member] = await pool.execute("CALL getMemberProject(?)", [stproject_assign]);

      let stnotify = "";
      let stnotify_clear = "";
      if (check_subtask) {
        if (check_subtask.stassignee == team_member2) {
          stnotify = check_subtask.stnotify;
          stnotify_clear = check_subtask.stnotify_clear;
        } else {
          stnotify = "yes";
          stnotify_clear = "no";
        }
      }

      let get_tcode = "";
      if (stproject_assign) {
        const project_name = project_row[0][0].pname;
        const letter = project_name.trim().substring(0, 2).toUpperCase();
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `${letter}-${random_num}`;
      } else {
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `T-${random_num}`;
      }

      let pro_member = [];
      let pro_member1 = [];
      let pro_member2 = [];
      if (pdetail || pdetail_member) {
        if (pdetail) {
          pro_member1.push(pdetail.pcreated_by);
        }
        if (pdetail_member) {
          pdetail_member.forEach(async (pm) => {
            pro_member2.push(pm.pmember);
          });
        }
      }
      pro_member = pro_member2.concat(pro_member1);
      const user_index = pro_member.indexOf(user_id);
      if (user_index !== -1) {
        pro_member.splice(parseInt(user_index), 1);
      }
      // const final_mem = pro_member.map((linkObj) => Object?.values(linkObj).join(",")).join(",");

      const final_mem = pro_member
        .filter((linkObj) => linkObj) // Filter out undefined or null values
        .map((linkObj) => Object?.values(linkObj).join(","))
        .join(",");

      let pro_owner = "";
      let pro_manager = "";
      let pname = "";
      let pdes = "";
      let portfolio_owner_id = "";
      if (project_row[0][0]) {
        pro_owner = project_row[0][0].pcreated_by;
        pro_manager = project_row[0][0].pmanager;
        pname = project_row[0][0].pname;
        pdes = project_row[0][0].pdes;
        const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);
        portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
      }

      let index = "";
      if (pro_owner != team_member2) {
        let pro_member = [];
        if (pdetail_member[0]) {
          pdetail_member[0].forEach(async (pm) => {
            pro_member.push(pm.pmember);
          });
        }
        index = pro_member.indexOf(team_member2);
      }

      if (pro_owner == user_id || pro_manager == user_id || portfolio_owner_id == user_id) {
        if (pro_owner != team_member2) {
          if (index === -1) {
            const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [stproject_assign, team_member2]);
            if (check_if_suggested[0][0]) {
              const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
              const suggestTM1 = `pid = '${stproject_assign}'`;
              const suggestTM2 = `suggest_id = '${team_member2}'`;
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [suggestTMFieldsValues, suggestTM1, suggestTM2]);
            }

            const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
            const tmFieldsValues = `"${stproject_assign}", "${portfolio_id}", "${team_member2}", "send", "${user_id}", "${formattedDate}", "no"`;

            await pool.execute("CALL InsertProjectMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

            const [inserted_pm] = await pool.execute("CALL LastInsertedProjectMembers(?)", [user_id]);
            const inserted_pm_id = inserted_pm[0][0].pm_id;

            const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmember_id";
            const tmHistoryFieldsValues = `"${stproject_assign}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${inserted_pm_id}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);

            let get_portfolio_name = "";
            const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]);
            if (check_portfolio_name) {
              if (check_portfolio_name[0][0].portfolio_user == "individual") {
                get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
              } else {
                get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
              }
            }

            const RequestEmailID = team_member2_row[0][0].email_address;

            const acceptProjectRequest = `http://localhost:3000/project-request/${stproject_assign}/${inserted_pm_id}/1`;
            const rejectProjectRequest = `http://localhost:3000/project-request/${stproject_assign}/${inserted_pm_id}/2`;
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: RequestEmailID,
              subject: "Project Request | Decision 168",
              html: generateEmailTemplate(
                `Hello ${team_member2_row[0][0].first_name},
            ${student.first_name} ${
                  student.last_name
                } has requested you to join project ${pname} as a team member. Just click the appropriate button below to join the project or request more information.
            Portfolio: ${get_portfolio_name}
            Project Short Description: ${pdes.substring(0, 100)}...`,
                `<a href="${acceptProjectRequest}">Join Project</a>`,
                `<a href="${rejectProjectRequest}">Need More Info</a>`
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send portfolio invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "added successfully.",
                });
              }
            });
          }
        }
      } else {
        if (pro_owner != team_member2) {
          if (index === -1) {
            const [check] = await pool.execute("CALL check_suggested(?,?)", [stproject_assign, team_member2]);
            const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [stproject_assign, team_member2]);

            if (!check[0][0] && !check_pmem[0][0]) {
              const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
              const tmFieldsValues = `"${stproject_assign}", "${team_member2}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

              await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

              const [inserted_tm] = await pool.execute("CALL LastInsertProjectSuggestedMembers(?)", [user_id]);
              const inserted_tm_id = inserted_tm[0][0].s_id;

              const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmsuggested_id";
              const tmHistoryFieldsValues = `"${stproject_assign}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}", "${inserted_tm_id}"`;

              await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);
            }
          }
        }
      }

      // Assuming this.input.post('tdue_date') is a valid date string
      const dueTDate = new Date(tdue_date);
      // Formatting the date as "YYYY-MM-DD"
      const taskformattedDueDate = dueTDate.toISOString().split("T")[0];

      const tFieldsValues = `stcode = "${get_tcode}", stname = "${stname}", stdes = "${stdes}", stlink = "${slinks_string}", stlink_comment = "${slink_comments_string}", stnote = "${stnote}", stfile = "${stfile_string}", stpriority = "${tpriority}", ststatus = 'to_do', ststatus_date = "${formattedDate}", stproject_assign = "${stproject_assign}", portfolio_id = "${portfolio_id}", stassignee = "${team_member2}", stfnotify = "${final_mem}", stfnotify_clear = "${final_mem}", stfnotify_date = "${formattedDate}", stnotify = "${stnotify}", stnotify_clear = "${stnotify_clear}", stnotify_date = "${formattedDate}", stdue_date = "${taskformattedDueDate}", stdue_date_clear = 'no', gid = "${gid}", sid = "${sid}", dept_id = "${dept}"`;
      const subtask_id = `stid = '${stid}'`;

      await pool.execute("CALL UpdateSubtask(?,?)", [tFieldsValues, subtask_id]);

      const historyFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, subtask_id";
      const historyFieldsValues = `"${stproject_assign}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Task Code: ${get_tcode}, Subtask Name: ${stname}, Edited By ${student.first_name} ${student.last_name} and assigned to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}", "${stid}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
    }
    return res.status(200).json({ message: "Subtask Edited Successfully." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change task Status
router.patch("/task/change-status/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { tid, tassignee, status_but } = req.body;
  try {
    const formattedDate = dateConversion();
    const [taskDetail] = await pool.execute("CALL check_task_assignProOwner(?)", [tid]);
    const task_detail = taskDetail[0][0];

    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [tassignee]);
    const student = getMydetail[0][0];

    let status = "";
    if (status_but == "to_do" || status_but == "in_progress") {
      (status_but == "to_do" && (status = "To Do")) || (status_but == "in_progress" && (status = "In Progress"));

      const statusFieldsValues = `tstatus = '${status_but}', review = '', review_clear = '', review_notify = '', po_review_clear = '', po_review_notify = '', tstatus_date = '${formattedDate}' `;
      const task_id = `tid = '${tid}'`;

      await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);

      if (task_detail.tproject_assign) {
        const history = {
          pid: task_detail.tproject_assign,
          gid: task_detail.gid,
          sid: task_detail.sid,
          h_date: formattedDate,
          h_resource_id: student.reg_id,
          h_resource: `${student.first_name} ${student.last_name}`,
          h_description: `${student.first_name} ${student.last_name} Changed Status of ${task_detail.tcode}, New status:- ${status}`,
          task_id: tid,
        };

        const paramNamesString1 = Object.keys(history).join(", ");
        const paramValuesString1 = Object.values(history)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
      }
      return res.status(200).json({
        message: "Status Changed Successfully.",
      });
    } else if (status_but == "in_review" || status_but == "done") {
      const [check_st] = await pool.execute("CALL subtask_progress_total(?)", [tid]);
      const [check_stdone] = await pool.execute("CALL subtask_progress_done(?)", [tid]);
      let task_with_subtasks = "";
      let task_with_no_subtasks = "";
      if (check_st[0][0]) {
        const all_stcount = check_st[0][0].count_rows;
        const done_stcount = check_stdone[0][0].count_rows;
        if (all_stcount == done_stcount) {
          task_with_subtasks = "yes";
        } else {
          return res.status(400).json({
            message: "Subtasks are not completed, so you are unable to change the task status to 'Done'.",
          });
        }
      } else {
        task_with_no_subtasks = "yes";
      }

      if (task_with_subtasks == "yes" || task_with_no_subtasks == "yes") {
        if (task_detail.tproject_assign) {
          const [getPcreated_by] = await pool.execute("CALL getProjectById(?)", [task_detail.tproject_assign]);
          const project_detail = getPcreated_by[0][0];
          const project_createdby = project_detail.pcreated_by;
          const project_manager = project_detail.pmanager;
          let portfolio_owner_id = "";
          const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [project_detail.portfolio_id]);
          if (!check_Portfolio_owner_id[0][0]) {
            portfolio_owner_id = check_Portfolio_owner_id[0][0]?.portfolio_createdby;
          }

          if (project_createdby != user_id && project_manager != user_id && portfolio_owner_id != user_id) {
            const statusFieldsValues = `tstatus = 'in_review', review = 'sent', review_clear = 'no', review_notify= 'sent_yes', po_review_clear = 'no', po_review_notify = 'sent_yes', review_notdate = '${formattedDate}', tstatus_date = '${formattedDate}'`;
            const task_id = `tid = '${tid}'`;

            await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
            if (task_detail.tproject_assign) {
              const history = {
                pid: task_detail.tproject_assign,
                gid: task_detail.gid,
                sid: task_detail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Changed Status of ${task_detail.tcode}, New status:- Submit for Review, Review:- Sent`,
                task_id: tid,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
            return res.status(200).json({
              message: "Status Changed Successfully.",
            });
          } else {
            const statusFieldsValues = `tstatus = 'done', tstatus_date = '${formattedDate}'`;
            const task_id = `tid = '${tid}'`;

            await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
            if (task_detail.tproject_assign) {
              const history = {
                pid: task_detail.tproject_assign,
                gid: task_detail.gid,
                sid: task_detail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Changed Status of ${task_detail.tcode}, New status:- Done`,
                task_id: tid,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
            return res.status(200).json({
              message: "Status Changed Successfully.",
            });
          }
        } else {
          const statusFieldsValues = `tstatus = 'done', tstatus_date = '${formattedDate}'`;
          const task_id = `tid = '${tid}'`;

          await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
          return res.status(200).json({
            message: "Status Changed Successfully.",
          });
        }
      } else {
        return res.status(400).json({
          message: "Subtasks are not completed, so you are unable to change the task status to 'Done'.",
        });
      }
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change task Status on checkbox
router.patch("/task/checkbox-change-status/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { tid, tassignee } = req.body;
  try {
    const [taskDetail] = await pool.execute("CALL check_task_assign(?,?)", [tid, tassignee]);
    const task_detail = taskDetail[0][0];
    const formattedDate = dateConversion();

    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [tassignee]);
    const student = getMydetail[0][0];

    if (task_detail.tstatus == "to_do" || task_detail.tstatus == "in_progress" || task_detail.tstatus == "in_review") {
      const [check_st] = await pool.execute("CALL subtask_progress_total(?)", [tid]);
      const [check_stdone] = await pool.execute("CALL subtask_progress_done(?)", [tid]);
      let task_with_subtasks = "";
      let task_with_no_subtasks = "";
      if (check_st[0][0]) {
        const all_stcount = check_st[0][0].count_rows;
        const done_stcount = check_stdone[0][0].count_rows;
        if (all_stcount == done_stcount) {
          task_with_subtasks = "yes";
        } else {
          return res.status(400).json({
            error: "Subtasks are not completed, so you are unable to change the task status to 'Done'.",
          });
        }
      } else {
        task_with_no_subtasks = "yes";
      }

      if (task_with_subtasks == "yes" || task_with_no_subtasks == "yes") {
        if (task_detail.tproject_assign) {
          const [getPcreated_by] = await pool.execute("CALL getProjectById(?)", [task_detail.tproject_assign]);

          if (getPcreated_by[0].length > 0) {
            const project_detail = getPcreated_by[0][0];
            const project_createdby = project_detail.pcreated_by;
            const project_manager = project_detail.pmanager;
            let portfolio_owner_id = "";

            const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [project_detail.portfolio_id]);

            if (check_Portfolio_owner_id[0].length > 0) {
              portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
            }

            if (project_createdby !== user_id && project_manager !== user_id && portfolio_owner_id !== user_id) {
              const statusFieldsValues = `tstatus = 'in_review', review = 'sent', review_clear = 'no', review_notify= 'sent_yes', po_review_clear = 'no', po_review_notify = 'sent_yes', review_notdate = '${formattedDate}', tstatus_date = '${formattedDate}'`;
              const task_id = `tid = '${tid}'`;

              await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);

              if (task_detail.tproject_assign) {
                const history = {
                  pid: task_detail.tproject_assign,
                  gid: task_detail.gid,
                  sid: task_detail.sid,
                  h_date: formattedDate,
                  h_resource_id: student.reg_id,
                  h_resource: `${student.first_name} ${student.last_name}`,
                  h_description: `${student.first_name} ${student.last_name} Changed Status of ${task_detail.tcode}, New status:- Submit for Review, Review:- Sent`,
                  task_id: tid,
                };

                const paramNamesString1 = Object.keys(history).join(", ");
                const paramValuesString1 = Object.values(history)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
              }

              return res.status(200).json({
                message: "Status Changed Successfully.",
              });
            } else {
              const statusFieldsValues = `tstatus = 'done', tstatus_date = '${formattedDate}'`;
              const task_id = `tid = '${tid}'`;

              await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);

              if (task_detail.tproject_assign) {
                const history = {
                  pid: task_detail.tproject_assign,
                  gid: task_detail.gid,
                  sid: task_detail.sid,
                  h_date: formattedDate,
                  h_resource_id: student.reg_id,
                  h_resource: `${student.first_name} ${student.last_name}`,
                  h_description: `${student.first_name} ${student.last_name} Changed Status of ${task_detail.tcode}, New status:- Done`,
                  task_id: tid,
                };

                const paramNamesString1 = Object.keys(history).join(", ");
                const paramValuesString1 = Object.values(history)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
              }

              return res.status(200).json({
                message: "Status Changed Successfully.",
              });
            }
          } else {
            // Handle the case when getProjectById returns no results
            return res.status(400).json({
              error: "Project details not found for the specified task.",
            });
          }
        } else {
          const statusFieldsValues = `tstatus = 'done', tstatus_date = '${formattedDate}'`;
          const task_id = `tid = '${tid}'`;

          await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);

          return res.status(200).json({
            message: "Status Changed Successfully.",
          });
        }
      } else {
        return res.status(400).json({
          error: "Subtasks are not completed, so you are unable to change the task status to 'Done'.",
        });
      }
    }

    if (task_detail.tstatus == "done") {
      const statusFieldsValues = `tstatus = 'to_do', review = '', review_clear = '', review_notify = '', po_review_clear = '', po_review_notify = '', tstatus_date = '${formattedDate}' `;
      const task_id = `tid = '${tid}'`;

      await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);

      if (task_detail.tproject_assign) {
        const history = {
          pid: task_detail.tproject_assign,
          gid: task_detail.gid,
          sid: task_detail.sid,
          h_date: formattedDate,
          h_resource_id: student.reg_id,
          h_resource: `${student.first_name} ${student.last_name}`,
          h_description: `${student.first_name} ${student.last_name} Changed Status of ${task_detail.tcode}, New status:- To Do`,
          task_id: tid,
        };

        const paramNamesString1 = Object.keys(history).join(", ");
        const paramValuesString1 = Object.values(history)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
      }

      return res.status(200).json({
        message: "Task Status Changed to Incomplete.",
      });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change Subtask Status
router.patch("/subtask/change-status/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { stid, stassignee, status_but } = req.body;
  try {
    const formattedDate = dateConversion();
    const [subtaskDetail] = await pool.execute("CALL check_subtask_assign2(?)", [stid]);
    const subtask_detail = subtaskDetail[0][0];

    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [stassignee]);
    const student = getMydetail[0][0];

    let status = "";
    if ((status_but == "to_do" && (status = "To Do")) || (status_but == "in_progress" && (status = "In Progress"))) {
      const statusFieldsValues = `ststatus = '${status_but}', sreview = '', sreview_clear = '', sreview_notify = '', po_sreview_clear = '', po_sreview_notify = '', ststatus_date = '${formattedDate}' `;
      const subtask_id = `stid = '${stid}'`;

      await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);

      if (subtask_detail.stproject_assign) {
        const history = {
          pid: subtask_detail.stproject_assign,
          gid: subtask_detail.gid,
          sid: subtask_detail.sid,
          h_date: formattedDate,
          h_resource_id: student.reg_id,
          h_resource: `${student.first_name} ${student.last_name}`,
          h_description: `${student.first_name} ${student.last_name} Changed Status of ${subtask_detail.stcode}, New status:- ${status}`,
          subtask_id: stid,
        };

        const paramNamesString1 = Object.keys(history).join(", ");
        const paramValuesString1 = Object.values(history)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
      }
      return res.status(200).json({
        message: "Status Changed Successfully.",
      });
    } else if (status_but == "in_review" || status_but == "done") {
      if (subtask_detail.stproject_assign) {
        const [getPcreated_by] = await pool.execute("CALL getProjectById(?)", [subtask_detail.stproject_assign]);
        const project_detail = getPcreated_by[0][0];
        const project_createdby = project_detail.pcreated_by;
        const project_manager = project_detail.pmanager;
        let portfolio_owner_id = "";
        const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [project_detail.portfolio_id]);
        if (!check_Portfolio_owner_id[0][0]) {
          portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
        }

        if (project_createdby != user_id && project_manager != user_id && portfolio_owner_id != user_id) {
          const statusFieldsValues = `ststatus = 'in_review', sreview = 'sent', sreview_clear = 'no', sreview_notify= 'sent_yes', po_sreview_clear = 'no', po_sreview_notify = 'sent_yes', sreview_notdate = '${formattedDate}', ststatus_date = '${formattedDate}'`;
          const subtask_id = `stid = '${stid}'`;

          await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
          if (subtask_detail.stproject_assign) {
            const history = {
              pid: subtask_detail.stproject_assign,
              gid: subtask_detail.gid,
              sid: subtask_detail.sid,
              h_date: formattedDate,
              h_resource_id: student.reg_id,
              h_resource: `${student.first_name} ${student.last_name}`,
              h_description: `${student.first_name} ${student.last_name} Changed Status of ${subtask_detail.stcode}, New status:- Submit for Review, Review:- Sent`,
              subtask_id: stid,
            };

            const paramNamesString1 = Object.keys(history).join(", ");
            const paramValuesString1 = Object.values(history)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
          }
          return res.status(200).json({
            message: "Status Changed Successfully.",
          });
        } else {
          const statusFieldsValues = `ststatus = 'done', ststatus_date = '${formattedDate}'`;
          const subtask_id = `stid = '${stid}'`;

          await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
          if (subtask_detail.stproject_assign) {
            const history = {
              pid: subtask_detail.stproject_assign,
              gid: subtask_detail.gid,
              sid: subtask_detail.sid,
              h_date: formattedDate,
              h_resource_id: student.reg_id,
              h_resource: `${student.first_name} ${student.last_name}`,
              h_description: `${student.first_name} ${student.last_name} Changed Status of ${subtask_detail.stcode}, New status:- Done`,
              subtask_id: stid,
            };

            const paramNamesString1 = Object.keys(history).join(", ");
            const paramValuesString1 = Object.values(history)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
          }
          return res.status(200).json({
            message: "Status Changed Successfully.",
          });
        }
      } else {
        const statusFieldsValues = `ststatus = 'done', ststatus_date = '${formattedDate}'`;
        const subtask_id = `stid = '${stid}'`;

        await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
        return res.status(200).json({
          message: "Status Changed Successfully.",
        });
      }
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change Subtask Status on checkbox
router.patch("/subtask/checkbox-change-status/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { stid, stassignee } = req.body;
  try {
    const [subtaskDetail] = await pool.execute("CALL check_subtask_assign2(?)", [stid]);
    const subtask_detail = subtaskDetail[0][0];
    const formattedDate = dateConversion();

    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [stassignee]);
    const student = getMydetail[0][0];

    if (subtask_detail.ststatus == "to_do" || subtask_detail.ststatus == "in_progress" || subtask_detail.ststatus == "in_review") {
      if (subtask_detail.stproject_assign) {
        const [getPcreated_by] = await pool.execute("CALL getProjectById(?)", [subtask_detail.stproject_assign]);
        const project_detail = getPcreated_by[0][0];
        const project_createdby = project_detail.pcreated_by;
        const project_manager = project_detail.pmanager;
        let portfolio_owner_id = "";
        const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [project_detail.portfolio_id]);
        if (!check_Portfolio_owner_id[0][0]) {
          portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
        }

        if (project_createdby != user_id && project_manager != user_id && portfolio_owner_id != user_id) {
          const statusFieldsValues = `ststatus = 'in_review', sreview = 'sent', sreview_clear = 'no', sreview_notify= 'sent_yes', po_sreview_clear = 'no', po_sreview_notify = 'sent_yes', sreview_notdate = '${formattedDate}', ststatus_date = '${formattedDate}'`;
          const subtask_id = `stid = '${stid}'`;

          await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);

          const [subt_detail] = await pool.execute("CALL getSubtasksDetailsbyID(?)", [stid]);
          const [t_changestatus] = await pool.execute("CALL getTasksDetailsbyID(?)", [subt_detail[0][0].tid]);
          let new_tstatus = "in_progress";
          if (t_changestatus[0][0]) {
            if (t_changestatus[0][0].tstatus == "to_do") {
              new_tstatus = "to_do";
            }
          }
          const tFieldsValues = `tstatus = "${new_tstatus}", review = "", review_clear = "", review_notify = "", po_review_clear = "", po_review_notify = "", tstatus_date = "${formattedDate}"`;
          const task_id = `tid = '${subt_detail[0][0].tid}'`;

          await pool.execute("CALL UpdateTask(?,?)", [tFieldsValues, task_id]);

          if (subtask_detail.stproject_assign) {
            const history = {
              pid: subtask_detail.stproject_assign,
              gid: subtask_detail.gid,
              sid: subtask_detail.sid,
              h_date: formattedDate,
              h_resource_id: student.reg_id,
              h_resource: `${student.first_name} ${student.last_name}`,
              h_description: `${student.first_name} ${student.last_name} Changed Status of ${subtask_detail.stcode}, New status:- Submit for Review, Review:- Sent`,
              subtask_id: stid,
            };

            const paramNamesString1 = Object.keys(history).join(", ");
            const paramValuesString1 = Object.values(history)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
          }
          return res.status(200).json({
            message: "Status Changed Successfully.",
          });
        } else {
          const statusFieldsValues = `ststatus = 'done', ststatus_date = '${formattedDate}'`;
          const subtask_id = `stid = '${stid}'`;

          await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
          if (subtask_detail.stproject_assign) {
            const history = {
              pid: subtask_detail.stproject_assign,
              gid: subtask_detail.gid,
              sid: subtask_detail.sid,
              h_date: formattedDate,
              h_resource_id: student.reg_id,
              h_resource: `${student.first_name} ${student.last_name}`,
              h_description: `${student.first_name} ${student.last_name} Changed Status of ${subtask_detail.stcode}, New status:- Done`,
              subtask_id: stid,
            };

            const paramNamesString1 = Object.keys(history).join(", ");
            const paramValuesString1 = Object.values(history)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
            await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
          }
          return res.status(200).json({
            message: "Status Changed Successfully.",
          });
        }
      } else {
        const statusFieldsValues = `ststatus = 'done', ststatus_date = '${formattedDate}'`;
        const subtask_id = `stid = '${stid}'`;

        await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
        return res.status(200).json({
          message: "Status Changed Successfully.",
        });
      }
    }

    if (subtask_detail.ststatus == "done") {
      const statusFieldsValues = `ststatus = 'to_do', sreview = '', sreview_clear = '', sreview_notify = '', po_sreview_clear = '', po_sreview_notify = '', ststatus_date = '${formattedDate}' `;
      const subtask_id = `stid = '${stid}'`;

      await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);

      const [subt_detail] = await pool.execute("CALL getSubtasksDetailsbyID(?)", [stid]);
      const [t_changestatus] = await pool.execute("CALL getTasksDetailsbyID(?)", [subt_detail[0][0].tid]);
      let new_tstatus = "in_progress";
      if (t_changestatus[0][0]) {
        if (t_changestatus[0][0].tstatus == "to_do") {
          new_tstatus = "to_do";
        }
      }
      const tFieldsValues = `tstatus = "${new_tstatus}", review = "", review_clear = "", review_notify = "", po_review_clear = "", po_review_notify = "", tstatus_date = "${formattedDate}"`;
      const task_id = `tid = '${subt_detail[0][0].tid}'`;

      await pool.execute("CALL UpdateTask(?,?)", [tFieldsValues, task_id]);

      if (subtask_detail.stproject_assign) {
        const history = {
          pid: subtask_detail.stproject_assign,
          gid: subtask_detail.gid,
          sid: subtask_detail.sid,
          h_date: formattedDate,
          h_resource_id: student.reg_id,
          h_resource: `${student.first_name} ${student.last_name}`,
          h_description: `${student.first_name} ${student.last_name} Changed Status of ${subtask_detail.stcode}, New status:- To Do`,
          subtask_id: stid,
        };

        const paramNamesString1 = Object.keys(history).join(", ");
        const paramValuesString1 = Object.values(history)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
      }
      return res.status(200).json({
        message: "Subtask Status Changed to Incomplete.",
      });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Team Member Task list
router.get("/task/team-member-tasks-list/:project_id/:task_assignee", async (req, res) => {
  const { project_id, task_assignee } = req.params;
  try {
    const [ProjectDetailCheck] = await pool.execute("CALL ProjectDetailCheck(?)", [project_id]);
    const [team_member_tasks_listNew] = await pool.execute("CALL team_member_tasks_listNew(?,?)", [project_id, task_assignee]);
    const [team_member_subtasks_listNew] = await pool.execute("CALL team_member_subtasks_listNew(?,?)", [project_id, task_assignee]);
    res.status(200).json({
      pid: project_id,
      tassignee: task_assignee,
      pdetail: ProjectDetailCheck[0][0],
      tlist: team_member_tasks_listNew[0],
      stlist: team_member_subtasks_listNew[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Task details for edit page
router.get("/task/portfolios-edit-task/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { tid, portfolio_id } = req.body;
  try {
    const [check_task] = await pool.execute("CALL check_task(?)", [tid]);
    const [ProjectListbyPortCookie] = await pool.execute("CALL ProjectListbyPortCookie(?,?)", [portfolio_id, user_id]);
    const [AcceptedProjectListbyPortCookie] = await pool.execute("CALL AcceptedProjectListbyPortCookie(?,?)", [portfolio_id, user_id]);
    res.status(200).json({
      tdetail: check_task[0][0],
      plist: ProjectListbyPortCookie[0],
      accepted_plist: AcceptedProjectListbyPortCookie[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get projects
router.get("/get-projects-list/:portfolio_id/:user_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;

  try {
    const [ProjectListbyPortCookie] = await pool.execute("CALL ProjectListbyPortCookie(?,?)", [portfolio_id, user_id]);
    const [AcceptedProjectListbyPortCookie] = await pool.execute("CALL AcceptedProjectListbyPortCookie(?,?)", [portfolio_id, user_id]);

    // Combine project lists and extract desired properties
    const projects = [...ProjectListbyPortCookie[0], ...AcceptedProjectListbyPortCookie[0]];
    const simplifiedProjects = projects.map(({ pid, pname, dept_id }) => ({ pid, pname, dept_id }));

    res.status(200).json(simplifiedProjects);
  } catch (error) {
    console.log(error);
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Project Task list
router.get("/task/project-tasks-list/:project_id", async (req, res) => {
  const { project_id } = req.params;
  try {
    const [ProjectDetailCheck] = await pool.execute("CALL ProjectDetailCheck(?)", [project_id]);
    const [project_tasks_listNew] = await pool.execute("CALL project_tasks_listNew(?)", [project_id]);
    res.status(200).json({
      pid: project_id,
      pdetail: ProjectDetailCheck[0][0],
      tlist: project_tasks_listNew[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Download History
router.get("/task/download-history", async (req, res) => {
  const { tfile_name, tid, user_id } = req.body;
  try {
    const [taskDetail] = await pool.execute("CALL getTaskById(?)", [tid]);
    const task_detail = taskDetail[0][0];

    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];

    if (task_detail.tproject_assign) {
      const trimmedTfile = tfile_name.trim();
      const indexOfUnderscore = trimmedTfile.indexOf("_");
      const task_file = trimmedTfile.substr(indexOfUnderscore + 1);

      const formattedDate = dateConversion();

      const history = {
        pid: task_detail.tproject_assign,
        gid: task_detail.gid,
        sid: task_detail.sid,
        h_date: formattedDate,
        h_resource_id: student.reg_id,
        h_resource: `${student.first_name} ${student.last_name}`,
        h_description: `${task_file} File Downloaded By ${student.first_name} ${student.last_name}`,
        task_id: tid,
      };

      const paramNamesString1 = Object.keys(history).join(", ");
      const paramValuesString1 = Object.values(history)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
    }
    res.status(200).json({ message: "File Downloaded Successfully." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Trash Task files
router.get("/task/trash-tasks-files/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [TrashTaskFiles] = await pool.execute("CALL TrashTaskFiles(?)", [portfolio_id]);
    res.status(200).json({
      trash_task_files: TrashTaskFiles[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Task Editable fields
router.patch("/task/table-editable/:portfolio_id", async (req, res) => {
  let { portfolio_id } = req.params;
  const { div_class, div_field, div_id, txt, user_id } = req.body;
  try {
    if (txt) {
      const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = getMydetail[0][0];
      const formattedDate = dateConversion();

      if (div_class == "task_editable") {
        const [task_detail] = await pool.execute("CALL getTaskById(?)", [div_id]);
        const tdetail = task_detail[0][0];
        if (tdetail) {
          if (div_field == "tname_field") {
            const statusFieldsValues = `tname = '${txt}' `;
            const task_id = `tid = '${div_id}'`;

            await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
            if (tdetail.tproject_assign) {
              const history = {
                pid: tdetail.tproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Edited Task Name of ${tdetail.tcode}, Name: ${txt}`,
                task_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
          if (div_field == "tassignee_field") {
            let tnotify = "";
            let tnotify_clear = "";
            if (tdetail.tassignee == txt) {
              tnotify = tdetail.tnotify;
              tnotify_clear = tdetail.tnotify_clear;
            } else {
              tnotify = "yes";
              tnotify_clear = "no";
            }
            const [project_row] = await pool.execute("CALL getProjectById(?)", [tdetail.tproject_assign]);
            const check_Pro_Owner = project_row[0][0];

            let pro_owner = "";
            let pro_manager = "";
            let pname = "";
            let pdes = "";
            let portfolio_owner_id = "";

            if (check_Pro_Owner) {
              portfolio_id = check_Pro_Owner.portfolio_id;
              pro_owner = check_Pro_Owner.pcreated_by;
              pro_manager = check_Pro_Owner.pmanager;
              pname = check_Pro_Owner.pname;
              pdes = check_Pro_Owner.pdes;

              const [portfolio_row] = await pool.execute("CALL getPortfolioById(?)", [check_Pro_Owner.portfolio_id]);
              const check_Portfolio_owner_id = portfolio_row[0][0];
              if (check_Portfolio_owner_id) {
                portfolio_owner_id = check_Portfolio_owner_id.portfolio_createdby;
              }
            }
            let index = "";
            if (pro_owner != txt) {
              const [pdetail_member] = await pool.execute("CALL getMemberProject(?)", [tdetail.tproject_assign]);
              let pro_member = [];
              if (pdetail_member[0]) {
                pdetail_member[0].forEach(async (pm) => {
                  pro_member.push(pm.pmember);
                });
              }
              index = pro_member.indexOf(txt);
            }

            if (pro_owner == user_id || pro_manager == user_id || portfolio_owner_id == user_id) {
              if (pro_owner != txt) {
                if (index === -1) {
                  const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [tdetail.tproject_assign, txt]);
                  if (check_if_suggested[0][0]) {
                    const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
                    const suggestTM1 = `pid = '${tdetail.tproject_assign}'`;
                    const suggestTM2 = `suggest_id = '${txt}'`;
                    await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [suggestTMFieldsValues, suggestTM1, suggestTM2]);
                  }

                  const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
                  const tmFieldsValues = `"${tdetail.tproject_assign}", "${portfolio_id}", "${txt}", "send", "${user_id}", "${formattedDate}", "no"`;

                  await pool.execute("CALL InsertProjectMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

                  const [inserted_pm] = await pool.execute("CALL LastInsertedProjectMembers(?)", [user_id]);
                  const inserted_pm_id = inserted_pm[0][0].pm_id;
                  const [txt_row] = await pool.execute("CALL getStudentById(?)", [txt]);

                  const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmember_id";
                  const tmHistoryFieldsValues = `"${tdetail.tproject_assign}", "${tdetail.gid}", "${tdetail.sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${txt_row[0][0].first_name} ${txt_row[0][0].last_name}", "${inserted_pm_id}"`;

                  await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);

                  let get_portfolio_name = "";
                  const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]);
                  if (check_portfolio_name) {
                    if (check_portfolio_name[0][0].portfolio_user == "individual") {
                      get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
                    } else {
                      get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
                    }
                  }

                  const RequestEmailID = txt_row[0][0].email_address;

                  const acceptProjectRequest = `http://localhost:3000/project-request/${tdetail.tproject_assign}/${inserted_pm_id}/1`;
                  const rejectProjectRequest = `http://localhost:3000/project-request/${tdetail.tproject_assign}/${inserted_pm_id}/2`;
                  const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: RequestEmailID,
                    subject: "Project Request | Decision 168",
                    html: generateEmailTemplate(
                      `Hello ${txt_row[0][0].first_name},
                  ${student.first_name} ${
                        student.last_name
                      } has requested you to join project ${pname} as a team member. Just click the appropriate button below to join the project or request more information.
                  Portfolio: ${get_portfolio_name}
                  Project Short Description: ${pdes.substring(0, 100)}...`,
                      `<a href="${acceptProjectRequest}">Join Project</a>`,
                      `<a href="${rejectProjectRequest}">Need More Info</a>`
                    ),
                  };

                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      res.status(500).json({
                        error: "Failed to send portfolio invitation email.",
                      });
                    } else {
                      res.status(201).json({
                        message: "added successfully.",
                      });
                    }
                  });
                }
              }
            } else {
              if (pro_owner != txt) {
                if (index === -1) {
                  const [check] = await pool.execute("CALL check_suggested(?,?)", [tdetail.tproject_assign, txt]);
                  const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [tdetail.tproject_assign, txt]);

                  if (!check[0][0] && !check_pmem[0][0]) {
                    const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
                    const tmFieldsValues = `"${tdetail.tproject_assign}", "${txt}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

                    await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

                    const [inserted_tm] = await pool.execute("CALL LastInsertProjectSuggestedMembers(?)", [user_id]);
                    const inserted_tm_id = inserted_tm[0][0].s_id;

                    const [txt_row] = await pool.execute("CALL getStudentById(?)", [txt]);

                    const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmsuggested_id";
                    const tmHistoryFieldsValues = `"${tdetail.tproject_assign}", "${tdetail.gid}", "${tdetail.sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${txt_row[0][0].first_name} ${txt_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}", "${inserted_tm_id}"`;

                    await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);
                  }
                }
              }
            }

            const statusFieldsValues = `tassignee = '${txt}', tnotify = '${tnotify}', tnotify_clear = '${tnotify_clear}', tnotify_date = '${formattedDate}' `;
            const task_id = `tid = '${div_id}'`;

            await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
            if (tdetail.tproject_assign) {
              const history = {
                pid: tdetail.tproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Changed Task Assignee of ${tdetail.tcode}`,
                task_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
          if (div_field == "tpriority_field") {
            const statusFieldsValues = `tpriority = '${txt}' `;
            const task_id = `tid = '${div_id}'`;

            await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
            if (tdetail.tproject_assign) {
              const history = {
                pid: tdetail.tproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Edited Task Priority of ${tdetail.tcode}, Priority: ${txt}`,
                task_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
          if (div_field == "tstatus_field") {
            let status = "";
            if (txt == "to_do" || txt == "in_progress") {
              txt == "to_do" && (status = "To Do");
              txt == "in_progress" && (status = "In Progress");

              const statusFieldsValues = `tstatus = '${txt}', tstatus_date = '${formattedDate}' `;
              const task_id = `tid = '${div_id}'`;

              await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);

              if (tdetail.tproject_assign) {
                const history = {
                  pid: tdetail.tproject_assign,
                  gid: tdetail.gid,
                  sid: tdetail.sid,
                  h_date: formattedDate,
                  h_resource_id: student.reg_id,
                  h_resource: `${student.first_name} ${student.last_name}`,
                  h_description: `${student.first_name} ${student.last_name} Changed Status of ${tdetail.tcode}, Status:- ${status}`,
                  task_id: div_id,
                };

                const paramNamesString1 = Object.keys(history).join(", ");
                const paramValuesString1 = Object.values(history)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
              }
              return res.status(200).json({
                message: "Status Changed Successfully.",
              });
            } else if (txt == "in_review" || txt == "done") {
              const [check_st] = await pool.execute("CALL subtask_progress_total(?)", [div_id]);
              const [check_stdone] = await pool.execute("CALL subtask_progress_done(?)", [div_id]);
              let task_with_subtasks = "";
              let task_with_no_subtasks = "";
              if (check_st[0][0]) {
                const all_stcount = check_st[0][0].count_rows;
                const done_stcount = check_stdone[0][0].count_rows;
                if (all_stcount == done_stcount) {
                  task_with_subtasks = "yes";
                } else {
                  return res.status(400).json({
                    message: "Subtasks are not completed, so you are unable to change the task status to 'Done'.",
                  });
                }
              } else {
                task_with_no_subtasks = "yes";
              }

              if (task_with_subtasks == "yes" || task_with_no_subtasks == "yes") {
                if (tdetail.tproject_assign) {
                  const [getPcreated_by] = await pool.execute("CALL getProjectById(?)", [tdetail.tproject_assign]);
                  const project_detail = getPcreated_by[0][0];
                  const project_createdby = project_detail.pcreated_by;
                  const project_manager = project_detail.pmanager;
                  let portfolio_owner_id = "";
                  const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [project_detail.portfolio_id]);
                  if (!check_Portfolio_owner_id[0][0]) {
                    portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
                  }

                  if (project_createdby != user_id && project_manager != user_id && portfolio_owner_id != user_id) {
                    const statusFieldsValues = `tstatus = 'in_review', review = 'sent', review_clear = 'no', review_notify= 'sent_yes', po_review_clear = 'no', po_review_notify = 'sent_yes', review_notdate = '${formattedDate}', tstatus_date = '${formattedDate}'`;
                    const task_id = `tid = '${div_id}'`;

                    await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
                    if (tdetail.tproject_assign) {
                      const history = {
                        pid: tdetail.tproject_assign,
                        gid: tdetail.gid,
                        sid: tdetail.sid,
                        h_date: formattedDate,
                        h_resource_id: student.reg_id,
                        h_resource: `${student.first_name} ${student.last_name}`,
                        h_description: `${student.first_name} ${student.last_name} Changed Status of ${tdetail.tcode}, New status:- Submit for Review, Review:- Sent`,
                        task_id: div_id,
                      };

                      const paramNamesString1 = Object.keys(history).join(", ");
                      const paramValuesString1 = Object.values(history)
                        .map((value) => `'${value}'`)
                        .join(", ");

                      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                      await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
                    }
                    return res.status(200).json({
                      message: "Status Changed Successfully.",
                    });
                  } else {
                    const statusFieldsValues = `tstatus = 'done', tstatus_date = '${formattedDate}'`;
                    const task_id = `tid = '${div_id}'`;

                    await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
                    if (tdetail.tproject_assign) {
                      const history = {
                        pid: tdetail.tproject_assign,
                        gid: tdetail.gid,
                        sid: tdetail.sid,
                        h_date: formattedDate,
                        h_resource_id: student.reg_id,
                        h_resource: `${student.first_name} ${student.last_name}`,
                        h_description: `${student.first_name} ${student.last_name} Changed Status of ${tdetail.tcode}, New status:- Done`,
                        task_id: div_id,
                      };

                      const paramNamesString1 = Object.keys(history).join(", ");
                      const paramValuesString1 = Object.values(history)
                        .map((value) => `'${value}'`)
                        .join(", ");

                      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                      await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
                    }
                    return res.status(200).json({
                      message: "Status Changed Successfully.",
                    });
                  }
                } else {
                  const statusFieldsValues = `tstatus = 'done', tstatus_date = '${formattedDate}'`;
                  const task_id = `tid = '${div_id}'`;

                  await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
                  return res.status(200).json({
                    message: "Status Changed Successfully.",
                  });
                }
              } else {
                return res.status(400).json({
                  message: "Subtasks are not completed, so you are unable to change the task status to 'Done'.",
                });
              }
            }
          }
          if (div_field == "tduedate_field") {
            const statusFieldsValues = `tdue_date = '${txt}' `;
            const task_id = `tid = '${div_id}'`;

            await pool.execute("CALL UpdateTask(?,?)", [statusFieldsValues, task_id]);
            if (tdetail.tproject_assign) {
              const history = {
                pid: tdetail.tproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Edited Task Due Date of ${tdetail.tcode}, Due Date: ${txt}`,
                task_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
        }
        res.status(200).json({ message: "Updated Successfully." });
      } else if (div_class == "subtask_editable") {
        const [subtask_detail] = await pool.execute("CALL check_subtask_assign2(?)", [div_id]);
        const tdetail = subtask_detail[0][0];
        if (tdetail) {
          if (div_field == "stname_field") {
            const statusFieldsValues = `stname = '${txt}' `;
            const subtask_id = `stid = '${div_id}'`;

            await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
            if (tdetail.stproject_assign) {
              const history = {
                pid: tdetail.stproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Edited Subtask Name of ${tdetail.stcode}, Name: ${txt}`,
                subtask_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
          if (div_field == "stassignee_field") {
            let stnotify = "";
            let stnotify_clear = "";
            if (tdetail.stassignee == txt) {
              stnotify = tdetail.stnotify;
              stnotify_clear = tdetail.stnotify_clear;
            } else {
              stnotify = "yes";
              stnotify_clear = "no";
            }
            const [project_row] = await pool.execute("CALL getProjectById(?)", [tdetail.stproject_assign]);
            const check_Pro_Owner = project_row[0][0];

            let pro_owner = "";
            let pro_manager = "";
            let pname = "";
            let pdes = "";
            let portfolio_owner_id = "";
            if (check_Pro_Owner) {
              pro_owner = check_Pro_Owner.pcreated_by;
              pro_manager = check_Pro_Owner.pmanager;
              pname = check_Pro_Owner.pname;
              pdes = check_Pro_Owner.pdes;

              const [portfolio_row] = await pool.execute("CALL getPortfolioById(?)", [check_Pro_Owner.portfolio_id]);
              const check_Portfolio_owner_id = portfolio_row[0][0];
              if (check_Portfolio_owner_id) {
                portfolio_owner_id = check_Portfolio_owner_id.portfolio_createdby;
              }
            }
            let index = "";
            if (pro_owner != txt) {
              const [pdetail_member] = await pool.execute("CALL getMemberProject(?)", [tdetail.stproject_assign]);
              let pro_member = [];
              if (pdetail_member[0]) {
                pdetail_member[0].forEach(async (pm) => {
                  pro_member.push(pm.pmember);
                });
              }
              index = pro_member.indexOf(txt);
            }

            if (pro_owner == user_id || pro_manager == user_id || portfolio_owner_id == user_id) {
              if (pro_owner != txt) {
                if (index === -1) {
                  const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [tdetail.stproject_assign, txt]);
                  if (check_if_suggested[0][0]) {
                    const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
                    const suggestTM1 = `pid = '${tdetail.stproject_assign}'`;
                    const suggestTM2 = `suggest_id = '${txt}'`;
                    await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [suggestTMFieldsValues, suggestTM1, suggestTM2]);
                  }

                  const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
                  const tmFieldsValues = `"${tdetail.stproject_assign}", "${portfolio_id}", "${txt}", "send", "${user_id}", "${formattedDate}", "no"`;

                  await pool.execute("CALL InsertProjectMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

                  const [inserted_pm] = await pool.execute("CALL LastInsertedProjectMembers(?)", [user_id]);
                  const inserted_pm_id = inserted_pm[0][0].pm_id;
                  const [txt_row] = await pool.execute("CALL getStudentById(?)", [txt]);

                  const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmember_id";
                  const tmHistoryFieldsValues = `"${tdetail.stproject_assign}", "${tdetail.gid}", "${tdetail.sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${txt_row[0][0].first_name} ${txt_row[0][0].last_name}", "${inserted_pm_id}"`;

                  await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);

                  let get_portfolio_name = "";
                  const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]);
                  if (check_portfolio_name) {
                    if (check_portfolio_name[0][0].portfolio_user == "individual") {
                      get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
                    } else {
                      get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
                    }
                  }

                  const RequestEmailID = txt_row[0][0].email_address;

                  const acceptProjectRequest = `http://localhost:3000/project-request/${tdetail.stproject_assign}/${inserted_pm_id}/1`;
                  const rejectProjectRequest = `http://localhost:3000/project-request/${tdetail.stproject_assign}/${inserted_pm_id}/2`;
                  const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: RequestEmailID,
                    subject: "Project Request | Decision 168",
                    html: generateEmailTemplate(
                      `Hello ${txt_row[0][0].first_name},
                  ${student.first_name} ${
                        student.last_name
                      } has requested you to join project ${pname} as a team member. Just click the appropriate button below to join the project or request more information.
                  Portfolio: ${get_portfolio_name}
                  Project Short Description: ${pdes.substring(0, 100)}...`,
                      `<a href="${acceptProjectRequest}">Join Project</a>`,
                      `<a href="${rejectProjectRequest}">Need More Info</a>`
                    ),
                  };

                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      res.status(500).json({
                        error: "Failed to send portfolio invitation email.",
                      });
                    } else {
                      res.status(201).json({
                        message: "added successfully.",
                      });
                    }
                  });
                }
              }
            } else {
              if (pro_owner != txt) {
                if (index === -1) {
                  const [check] = await pool.execute("CALL check_suggested(?,?)", [tdetail.stproject_assign, txt]);
                  const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [tdetail.stproject_assign, txt]);

                  if (!check[0][0] && !check_pmem[0][0]) {
                    const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
                    const tmFieldsValues = `"${tdetail.stproject_assign}", "${txt}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

                    await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [tmFieldsNames, tmFieldsValues]);

                    const [inserted_tm] = await pool.execute("CALL LastInsertProjectSuggestedMembers(?)", [user_id]);
                    const inserted_tm_id = inserted_tm[0][0].s_id;

                    const [txt_row] = await pool.execute("CALL getStudentById(?)", [txt]);

                    const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description, pmsuggested_id";
                    const tmHistoryFieldsValues = `"${tdetail.stproject_assign}", "${tdetail.gid}", "${tdetail.sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${txt_row[0][0].first_name} ${txt_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}", "${inserted_tm_id}"`;

                    await pool.execute("CALL InsertProjectHistory(?,?)", [tmHistoryFieldsNames, tmHistoryFieldsValues]);
                  }
                }
              }
            }

            const statusFieldsValues = `stassignee = '${txt}', stnotify = '${stnotify}', stnotify_clear = '${stnotify_clear}', stnotify_date = '${formattedDate}' `;
            const subtask_id = `stid = '${div_id}'`;

            await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
            if (tdetail.stproject_assign) {
              const history = {
                pid: tdetail.stproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Changed Subtask Assignee of ${tdetail.stcode}`,
                subtask_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
          if (div_field == "stpriority_field") {
            const statusFieldsValues = `stpriority = '${txt}' `;
            const subtask_id = `stid = '${div_id}'`;

            await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
            if (tdetail.stproject_assign) {
              const history = {
                pid: tdetail.stproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Edited Subtask Priority of ${tdetail.stcode}, Priority: ${txt}`,
                subtask_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
          if (div_field == "ststatus_field") {
            let status = "";
            if (txt == "to_do" || txt == "in_progress") {
              txt == "to_do" && (status = "To Do");
              txt == "in_progress" && (status = "In Progress");

              const statusFieldsValues = `ststatus = '${txt}', ststatus_date = '${formattedDate}' `;
              const subtask_id = `stid = '${div_id}'`;

              await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);

              if (tdetail.stproject_assign) {
                const history = {
                  pid: tdetail.stproject_assign,
                  gid: tdetail.gid,
                  sid: tdetail.sid,
                  h_date: formattedDate,
                  h_resource_id: student.reg_id,
                  h_resource: `${student.first_name} ${student.last_name}`,
                  h_description: `${student.first_name} ${student.last_name} Changed Status of ${tdetail.stcode}, Status:- ${status}`,
                  subtask_id: div_id,
                };

                const paramNamesString1 = Object.keys(history).join(", ");
                const paramValuesString1 = Object.values(history)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
              }
              return res.status(200).json({
                message: "Status Changed Successfully.",
              });
            } else if (txt == "in_review" || txt == "done") {
              if (tdetail.stproject_assign) {
                const [getPcreated_by] = await pool.execute("CALL getProjectById(?)", [tdetail.stproject_assign]);
                const project_detail = getPcreated_by[0][0];
                const project_createdby = project_detail.pcreated_by;
                const project_manager = project_detail.pmanager;
                let portfolio_owner_id = "";
                const [check_Portfolio_owner_id] = await pool.execute("CALL getPortfolioById(?)", [project_detail.portfolio_id]);
                if (!check_Portfolio_owner_id[0][0]) {
                  portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby;
                }

                if (project_createdby != user_id && project_manager != user_id && portfolio_owner_id != user_id) {
                  const statusFieldsValues = `ststatus = 'in_review', sreview = 'sent', sreview_clear = 'no', sreview_notify = 'sent_yes', po_sreview_clear = 'no', po_sreview_notify = 'sent_yes', sreview_notdate = '${formattedDate}', ststatus_date = '${formattedDate}'`;
                  const subtask_id = `stid = '${div_id}'`;

                  await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
                  if (tdetail.stproject_assign) {
                    const history = {
                      pid: tdetail.stproject_assign,
                      gid: tdetail.gid,
                      sid: tdetail.sid,
                      h_date: formattedDate,
                      h_resource_id: student.reg_id,
                      h_resource: `${student.first_name} ${student.last_name}`,
                      h_description: `${student.first_name} ${student.last_name} Changed Status of ${tdetail.stcode}, New status:- Submit for Review, Review:- Sent`,
                      subtask_id: div_id,
                    };

                    const paramNamesString1 = Object.keys(history).join(", ");
                    const paramValuesString1 = Object.values(history)
                      .map((value) => `'${value}'`)
                      .join(", ");

                    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                    await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
                  }
                  return res.status(200).json({
                    message: "Status Changed Successfully.",
                  });
                } else {
                  const statusFieldsValues = `ststatus = 'done', ststatus_date = '${formattedDate}'`;
                  const subtask_id = `stid = '${div_id}'`;

                  await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
                  if (tdetail.stproject_assign) {
                    const history = {
                      pid: tdetail.stproject_assign,
                      gid: tdetail.gid,
                      sid: tdetail.sid,
                      h_date: formattedDate,
                      h_resource_id: student.reg_id,
                      h_resource: `${student.first_name} ${student.last_name}`,
                      h_description: `${student.first_name} ${student.last_name} Changed Status of ${tdetail.stcode}, New status:- Done`,
                      subtask_id: div_id,
                    };

                    const paramNamesString1 = Object.keys(history).join(", ");
                    const paramValuesString1 = Object.values(history)
                      .map((value) => `'${value}'`)
                      .join(", ");

                    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
                    await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
                  }
                  return res.status(200).json({
                    message: "Status Changed Successfully.",
                  });
                }
              } else {
                const statusFieldsValues = `ststatus = 'done', ststatus_date = '${formattedDate}'`;
                const subtask_id = `stid = '${div_id}'`;

                await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
                return res.status(200).json({
                  message: "Status Changed Successfully.",
                });
              }
            }
          }
          if (div_field == "stduedate_field") {
            const statusFieldsValues = `stdue_date = '${txt}' `;
            const subtask_id = `stid = '${div_id}'`;

            await pool.execute("CALL UpdateSubtask(?,?)", [statusFieldsValues, subtask_id]);
            if (tdetail.stproject_assign) {
              const history = {
                pid: tdetail.stproject_assign,
                gid: tdetail.gid,
                sid: tdetail.sid,
                h_date: formattedDate,
                h_resource_id: student.reg_id,
                h_resource: `${student.first_name} ${student.last_name}`,
                h_description: `${student.first_name} ${student.last_name} Edited Subtask Due Date of ${tdetail.stcode}, Due Date: ${txt}`,
                subtask_id: div_id,
              };

              const paramNamesString1 = Object.keys(history).join(", ");
              const paramValuesString1 = Object.values(history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
            }
          }
        }
        res.status(200).json({ message: "Updated Successfully." });
      } else {
        return res.status(400).json({ message: "No Text Provided." });
      }
    } else {
      return res.status(400).json({ message: "No Text Provided." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
    copy_detailDuplicate;
  }
});

//  Duplicate Task
router.post("/task/duplicate-task", async (req, res) => {
  const { tid, tname, copy_detail, cust_tws, user_id } = req.body;
  try {
    const formattedDate = dateConversion();
    const [task_detail] = await pool.execute("CALL TaskDetail(?)", [tid]);
    const check_Task = task_detail[0][0];
    if (check_Task) {
      const [student_detail] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const P_Owner = student_detail[0][0];
      const project_id = check_Task.tproject_assign;
      const [project_row] = await pool.execute("CALL getProjectById(?)", [project_id]);
      let get_tcode = "";
      if (project_id) {
        const project_name = project_row[0][0].pname;
        const letter = project_name.trim().substring(0, 2).toUpperCase();
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `${letter}-${random_num}`;
      } else {
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `T-${random_num}`;
      }

      if (copy_detail == "everything" || copy_detail == "custom") {
        const formattedDueDate = check_Task.tdue_date.toISOString().slice(0, 19).replace("T", " ");
        const task_data = {
          gid: check_Task.gid,
          sid: check_Task.sid,
          tcode: get_tcode,
          tname: tname,
          tdes: check_Task.tdes,
          tlink: check_Task.tlink,
          tlink_comment: check_Task.tlink_comment,
          tnote: check_Task.tnote,
          tfile: "",
          tpriority: check_Task.tpriority,
          tstatus: "to_do",
          tstatus_date: formattedDate,
          tproject_assign: check_Task.tproject_assign,
          portfolio_id: check_Task.portfolio_id,
          tassignee: check_Task.tassignee,
          tcreated_by: user_id,
          tcreated_date: formattedDate,
          tnotify: "yes",
          tnotify_clear: "no",
          tnotify_date: formattedDate,
          tdue_date: formattedDueDate,
          tdue_date_clear: "no",
          dept_id: check_Task.dept_id,
        };

        const paramNamesString1 = Object.keys(task_data).join(", ");
        const paramValuesString1 = Object.values(task_data)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertTask(?, ?)`;
        await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);

        const [inserted_task] = await pool.execute("CALL LastInsertTask(?)", [user_id]);
        const inserted_task_id = inserted_task[0][0].tid;

        const task_history = {
          pid: check_Task.tproject_assign,
          gid: check_Task.gid,
          sid: check_Task.sid,
          h_date: formattedDate,
          h_resource_id: P_Owner.reg_id,
          h_resource: `${P_Owner.first_name} ${P_Owner.last_name}`,
          h_description: `Task Code: ${get_tcode}, Task Name: ${tname}, Created By ${P_Owner.first_name} ${P_Owner.last_name}`,
          task_id: inserted_task_id,
        };

        const paramNamesString2 = Object.keys(task_history).join(", ");
        const paramValuesString2 = Object.values(task_history)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL2 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL2, [paramNamesString2, paramValuesString2]);

        if (cust_tws == "2" && copy_detail == "custom") {
          const [subtask_detail] = await pool.execute("CALL Check_Task_ALL_Subtasks2(?)", [tid]);
          const Check_Task_Subtasks = subtask_detail[0];
          if (Check_Task_Subtasks) {
            Check_Task_Subtasks.forEach(async (ts) => {
              let get_stcode = get_tcode;

              const subtask_data = {
                tid: inserted_task_id,
                gid: check_Task.gid,
                sid: check_Task.sid,
                stcode: get_stcode,
                stname: ts.stname,
                stdes: ts.stdes,
                stlink: ts.tlink,
                stlink_comment: ts.tlink_comment,
                stnote: ts.stnote,
                stfile: "",
                stpriority: ts.stpriority,
                ststatus: "to_do",
                ststatus_date: formattedDate,
                stproject_assign: check_Task.tproject_assign,
                portfolio_id: check_Task.portfolio_id,
                stassignee: ts.stassignee,
                stcreated_by: user_id,
                stcreated_date: formattedDate,
                stnotify: "yes",
                stnotify_clear: "no",
                stnotify_date: formattedDate,
                stdue_date: ts.stdue_date,
                stdue_date_clear: "no",
                dept_id: ts.dept_id,
              };

              const paramNamesString3 = Object.keys(subtask_data).join(", ");
              const paramValuesString3 = Object.values(subtask_data)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL3 = `CALL InsertSubtask(?, ?)`;
              await pool.execute(callProcedureSQL3, [paramNamesString3, paramValuesString3]);

              const [inserted_subtask] = await pool.execute("CALL LastInsertSubTask(?)", [user_id]);
              const inserted_subtask_id = inserted_subtask[0][0].stid;

              const subtask_history = {
                pid: check_Task.tproject_assign,
                gid: check_Task.gid,
                sid: check_Task.sid,
                h_date: formattedDate,
                h_resource_id: P_Owner.reg_id,
                h_resource: `${P_Owner.first_name} ${P_Owner.last_name}`,
                h_description: `Subtask Code: ${get_stcode}, Subtask Name: ${ts.stname}, Created By ${P_Owner.first_name} ${P_Owner.last_name}`,
                subtask_id: inserted_subtask_id,
              };

              const paramNamesString4 = Object.keys(subtask_history).join(", ");
              const paramValuesString4 = Object.values(subtask_history)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL4 = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL4, [paramNamesString4, paramValuesString4]);
            });
          }
        }
        res.status(200).json({ insertedTaskId: inserted_task_id, message: "Task Copied Successfully." });
      } else {
        res.status(400).json({ error: "Cannot Duplicate this task." });
      }
    } else {
      res.status(400).json({ error: "Cannot Duplicate this task." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Insert Comment
router.post("/task/insert-comment/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { project_id, tid, stid, message } = req.body;
  try {
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const [project_row] = await pool.execute("CALL getProjectById(?)", [project_id]);
    let get_tcode = "";
    let portfolio_id = "";
    if (project_id) {
      const project_name = project_row[0][0].pname;
      const letter = project_name.trim().substring(0, 2).toUpperCase();
      const random_num = Math.floor(Math.random() * 10000) + 1;
      get_tcode = `${letter}-${random_num}`;
      portfolio_id = project_row[0][0].portfolio_id;
    } else {
      const random_num = Math.floor(Math.random() * 10000) + 1;
      get_tcode = `T-${random_num}`;
    }

    const pdetail = project_row[0][0];
    const [pdetail_mem] = await pool.execute("CALL getMemberProject(?)", [project_id]);
    const pdetail_member = pdetail_mem[0];
    let pro_member = [];
    let pro_member1 = [];
    let pro_member2 = [];
    if (pdetail || pdetail_member) {
      if (pdetail) {
        pro_member1.push(pdetail.pcreated_by);
      }
      if (pdetail_member) {
        pdetail_member.forEach(async (pm) => {
          pro_member2.push(pm.pmember);
        });
      }
    }
    pro_member = pro_member2.concat(pro_member1);
    const user_index = pro_member.indexOf(user_id);
    if (user_index !== -1) {
      pro_member.splice(parseInt(user_index), 1);
    }
    // const final_mem = join(",", pro_member);
    const final_mem = pro_member.map((linkObj) => Object.values(linkObj).join(",")).join(",");

    const formattedDate = dateConversion();

    const comment_data = {
      project_id: project_id,
      task_id: tid,
      subtask_id: stid,
      portfolio_id: portfolio_id,
      c_code: get_tcode,
      message: message,
      c_created_by: user_id,
      c_created_date: formattedDate,
      c_notify: final_mem,
      c_notify_clear: final_mem,
    };

    const paramNamesString = Object.keys(comment_data).join(", ");
    const paramValuesString = Object.values(comment_data)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertComments(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [inserted_cm] = await pool.execute("CALL LastInsertedComment(?)", [user_id]);
    const inserted_cm_id = inserted_cm[0][0].cid;

    const history = {
      pid: project_id,
      gid: pdetail.gid,
      sid: pdetail.sid,
      h_date: formattedDate,
      h_resource_id: student.reg_id,
      h_resource: `${student.first_name} ${student.last_name}`,
      h_description: `Comment Code: ${get_tcode} Sent by ${student.first_name} ${student.last_name}`,
      c_id: inserted_cm_id,
    };

    const paramNamesString1 = Object.keys(history).join(", ");
    const paramValuesString1 = Object.values(history)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);

    let currentDate = new Date();
    let formattedCommentDate = currentDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    res.status(200).json({ message: "Comment Successfully Added." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Delete Comment
router.get("/task/delete-comment/:user_id/:cid", async (req, res) => {
  const { user_id, cid } = req.params;
  try {
    const [comment_row] = await pool.execute("CALL get_comment(?)", [cid]);
    const comment = comment_row[0][0];

    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];

    const [project_row] = await pool.execute("CALL getProjectById(?)", [comment.project_id]);
    const pdetail = project_row[0][0];

    const formattedDate = dateConversion();

    const cmFieldsNames = `delete_msg = "yes", deleted_date = "${formattedDate}"`;
    const comment_id = `cid = "${cid}"`;

    await pool.execute("CALL UpdateComments(?,?)", [cmFieldsNames, comment_id]);

    const history = {
      pid: comment.project_id,
      gid: pdetail.gid,
      sid: pdetail.sid,
      h_date: formattedDate,
      h_resource_id: student.reg_id,
      h_resource: `${student.first_name} ${student.last_name}`,
      h_description: `Comment Code: ${comment.c_code} Deleted by ${student.first_name} ${student.last_name}`,
      c_id: cid,
    };

    const paramNamesString1 = Object.keys(history).join(", ");
    const paramValuesString1 = Object.values(history)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);

    res.status(200).json({ message: "Comment Deleted Successfully." });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Insert Task File
router.patch("/task/insert-task-file/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { tid, task_file, tcode } = req.body;
  try {
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const [task_row] = await pool.execute("CALL getTasksDetail(?)", [tid]);

    const oldFiles = task_row[0][0].tfile;
    const newFiles = task_file;

    let allFiles = newFiles;
    if (oldFiles) {
      allFiles = `${oldFiles},${newFiles}`;
    }

    let final_mem = task_row[0][0].tfnotify;
    if (task_row[0][0].tproject_assign) {
      const [project_row] = await pool.execute("CALL getProjectById(?)", [task_row[0][0].tproject_assign]);
      const pdetail = project_row[0][0];
      const [pdetail_mem] = await pool.execute("CALL getMemberProject(?)", [task_row[0][0].tproject_assign]);
      const pdetail_member = pdetail_mem[0];
      let pro_member = [];
      let pro_member1 = [];
      let pro_member2 = [];
      if (pdetail || pdetail_member) {
        if (pdetail) {
          pro_member1.push(pdetail.pcreated_by);
        }
        if (pdetail_member) {
          pdetail_member.forEach(async (pm) => {
            pro_member2.push(pm.pmember);
          });
        }
      }
      pro_member = pro_member2.concat(pro_member1);
      const user_index = pro_member.indexOf(user_id);
      if (user_index !== -1) {
        pro_member.splice(parseInt(user_index), 1);
      }
      final_mem = pro_member.map((linkObj) => Object.values(linkObj).join(",")).join(",");
    }
    const formattedDate = dateConversion();
    const tFieldsValues = `tfile = '${allFiles}', new_file = '${task_file}', tfnotify = '${final_mem}', tfnotify_clear = '${final_mem}', tfnotify_date = '${formattedDate}'`;
    const task_id = `tid = '${tid}'`;
    await pool.execute("CALL UpdateTask(?,?)", [tFieldsValues, task_id]);

    if (task_row[0][0].tproject_assign) {
      const history = {
        pid: task_row[0][0].tproject_assign,
        gid: task_row[0][0].gid,
        sid: task_row[0][0].sid,
        h_date: formattedDate,
        h_resource_id: student.reg_id,
        h_resource: `${student.first_name} ${student.last_name}`,
        h_description: `Task Code: ${tcode}, New File Uploaded by ${student.first_name} ${student.last_name}`,
        task_id: tid,
      };

      const paramNamesString1 = Object.keys(history).join(", ");
      const paramValuesString1 = Object.values(history)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
    }

    res.status(200).json({ message: "File(s) Attached Successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Insert Subtask File
router.patch("/subtask/insert-subtask-file/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { stid, stask_file, stcode } = req.body;
  try {
    const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = getMydetail[0][0];
    const [subtask_row] = await pool.execute("CALL getSubtasksDetail(?)", [stid]);

    const oldFiles = subtask_row[0][0].stfile;
    const newFiles = stask_file;

    let allFiles = newFiles;
    if (oldFiles) {
      allFiles = `${oldFiles},${newFiles}`;
    }

    let final_mem = subtask_row[0][0].stfnotify;
    if (subtask_row[0][0].stproject_assign) {
      const [project_row] = await pool.execute("CALL getProjectById(?)", [subtask_row[0][0].stproject_assign]);
      const pdetail = project_row[0][0];
      const [pdetail_mem] = await pool.execute("CALL getMemberProject(?)", [subtask_row[0][0].stproject_assign]);
      const pdetail_member = pdetail_mem[0];
      let pro_member = [];
      let pro_member1 = [];
      let pro_member2 = [];
      if (pdetail || pdetail_member) {
        if (pdetail) {
          pro_member1.push(pdetail.pcreated_by);
        }
        if (pdetail_member) {
          pdetail_member.forEach(async (pm) => {
            pro_member2.push(pm.pmember);
          });
        }
      }
      pro_member = pro_member2.concat(pro_member1);
      const user_index = pro_member.indexOf(user_id);
      if (user_index !== -1) {
        pro_member.splice(parseInt(user_index), 1);
      }
      final_mem = pro_member.map((linkObj) => Object.values(linkObj).join(",")).join(",");
    }

    const formattedDate = dateConversion();
    const tFieldsValues = `stfile = '${allFiles}', snew_file = '${stask_file}', stfnotify = '${final_mem}', stfnotify_clear = '${final_mem}', stfnotify_date = '${formattedDate}'`;
    const subtask_id = `stid = '${stid}'`;
    await pool.execute("CALL UpdateSubtask(?,?)", [tFieldsValues, subtask_id]);

    if (subtask_row[0][0].stproject_assign) {
      const history = {
        pid: subtask_row[0][0].stproject_assign,
        gid: subtask_row[0][0].gid,
        sid: subtask_row[0][0].sid,
        h_date: formattedDate,
        h_resource_id: student.reg_id,
        h_resource: `${student.first_name} ${student.last_name}`,
        h_description: `Subtask Code: ${stcode}, New File Uploaded by ${student.first_name} ${student.last_name}`,
        subtask_id: stid,
      };

      const paramNamesString1 = Object.keys(history).join(", ");
      const paramValuesString1 = Object.values(history)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL1 = `CALL InsertProjectHistory(?, ?)`;
      await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);
    }

    res.status(200).json({ message: "File(s) Attached Successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Todays Tasks
router.get("/task/today-tasks/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { tdue_date } = req.body;
  try {
    const [TodayTasks] = await pool.execute("CALL TodayTasks(?,?)", [user_id, tdue_date]);
    const [TodaySubtasklist_Task] = await pool.execute("CALL TodaySubtasklist_Task(?,?)", [user_id, tdue_date]);
    const [TodaySubtasks] = await pool.execute("CALL TodaySubtasks(?,?)", [user_id, tdue_date]);
    res.status(200).json({
      todayTasks: TodayTasks[0],
      todaySubtasklist_Task: TodaySubtasklist_Task[0],
      todaySubtasks: TodaySubtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Weeks Tasks
router.get("/task/week-tasks/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    let currentDate = new Date();
    let firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() + 1);

    let lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    let formattedFirstDay = firstDay.toISOString().split("T")[0];
    let formattedLastDay = lastDay.toISOString().split("T")[0];

    const [WeekTasks] = await pool.execute("CALL WeekTasks(?,?,?)", [user_id, formattedFirstDay, formattedLastDay]);
    const [WeekSubtaskslist_Task] = await pool.execute("CALL WeekSubtaskslist_Task(?,?,?)", [user_id, formattedFirstDay, formattedLastDay]);
    const [WeekSubtasks] = await pool.execute("CALL WeekSubtasks(?,?,?)", [user_id, formattedFirstDay, formattedLastDay]);
    res.status(200).json({
      weekTasks: WeekTasks[0],
      weekSubtaskslist_Task: WeekSubtaskslist_Task[0],
      weekSubtasks: WeekSubtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Tasks List
router.get("/task/tasks-list/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [createdTaskList] = await pool.execute("CALL CreatedTaskList(?,?)", [portfolio_id, user_id]);
    const [createdSubTaskList] = await pool.execute("CALL CreatedSubTaskList(?)", [portfolio_id, user_id]);
    res.status(200).json({
      CreatedTaskList: createdTaskList[0],
      CreatedSubTaskList: createdSubTaskList[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Project tasks
router.get("/task/project-tasks", async (req, res) => {
  const { project_id } = req.body;
  try {
    const [p_tasks] = await pool.execute("CALL p_tasks(?)", [project_id]);
    res.status(200).json({
      projectTasks: p_tasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  KPI tasks
router.get("/task/kpi-tasks", async (req, res) => {
  const { sid } = req.body;
  try {
    const [Strategy_tasks] = await pool.execute("CALL Strategy_tasks(?)", [sid]);
    res.status(200).json({
      strategyTasks: Strategy_tasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Goal tasks
router.get("/task/goal-tasks", async (req, res) => {
  const { gid } = req.body;
  try {
    const [Goal_tasks] = await pool.execute("CALL Goal_tasks(?)", [gid]);
    res.status(200).json({
      goalTasks: Goal_tasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  User tasks
router.get("/task/user-tasks", async (req, res) => {
  const { reg_id } = req.body;
  try {
    const [get_all_task] = await pool.execute("CALL get_all_task(?)", [reg_id]);
    res.status(200).json({
      getAllTasks: get_all_task[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get Task Comments
router.get("/task/get-task-comments/:tid/:user_id", async (req, res) => {
  const { tid, user_id } = req.params;
  try {
    // Call stored procedure to get task comments
    const [rows] = await pool.execute("CALL getTaskComments(?)", [tid]);
    const taskCommentData = rows[0];

    let taskComment_promises = [];

    if (taskCommentData) {
      // Map task comment data to a new structure
      taskComment_promises = taskCommentData.map(async (item) => {
        const deleteStatus = item.delete_msg === "yes" ? true : false;

        // Call stored procedure to get student by ID
        const [creator] = await pool.execute("CALL getStudentById(?)", [item.c_created_by]);
        const student = creator[0][0];
        const userName = user_id == item.c_created_by ? "Me" : `${student.first_name} ${student.last_name}`;
        const meStatus = user_id == item.c_created_by ? true : false;
        const createdDate = item.c_created_date;
        const formattedDate = new Date(createdDate).toLocaleDateString();
        const formattedTime = new Date(createdDate).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });

        return {
          id: item.cid,
          sender: userName,
          content: item.message,
          timestamp: formattedTime,
          date: formattedDate,
          isMe: meStatus,
          isDeleted: deleteStatus,
          cCode: item.c_code,
          createdBy: item.c_created_by,
          taskId: item.task_id,
          subtaskId: item.subtask_id,
        };
      });
    }

    // Wait for all promises to resolve
    const [taskComment_parent] = await Promise.all([Promise.all(taskComment_promises)]);

    // Send the response with the formatted task comment data
    res.status(200).json({
      taskCommentDetail: taskComment_parent.flat().filter(Boolean),
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//getSubtaskComments
router.get("/subtask/get-subtask-comments/:subtask_id/:user_id", async (req, res) => {
  const { subtask_id, user_id } = req.params;
  try {
    const [rows] = await pool.execute("CALL getSubtaskComments(?)", [subtask_id]);
    const subtaskCommentData = rows[0];

    let subtaskComment_promises = [];
    if (subtaskCommentData) {
      subtaskComment_promises = subtaskCommentData.map(async (item) => {
        const deleteStatus = item.delete_msg == "yes" ? true : false;
        const [creator] = await pool.execute("CALL getStudentById(?)", [item.c_created_by]);
        const student = creator[0][0];
        const userName = user_id == item.c_created_by ? "Me" : `${student?.first_name} ${student?.last_name}`;
        const meStatus = user_id == item.c_created_by ? true : false;
        const createdDate = item.c_created_date;
        const formattedDate = new Date(createdDate).toLocaleDateString();
        const formattedTime = new Date(createdDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
        return {
          id: item.cid,
          sender: userName,
          content: item.message,
          timestamp: formattedTime,
          date: formattedDate,
          isMe: meStatus,
          isDeleted: deleteStatus,
          cCode: item.c_code,
          createdBy: item.c_created_by,
          taskId: item.task_id,
          subtaskId: item.subtask_id,
        };
      });
    }

    const [subtaskComment_parent] = await Promise.all([Promise.all(subtaskComment_promises)]);

    res.status(200).json({
      subtaskCommentDetail: subtaskComment_parent.flat().filter(Boolean),
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Duplicate Subtask
router.post("/subtask/duplicate-subtask", async (req, res) => {
  const { stid, stname, copy_detail, user_id } = req.body;
  try {
    const formattedDate = dateConversion();
    const [subtask_detail] = await pool.execute("CALL SubtaskDetail(?)", [stid]);
    const check_Task = subtask_detail[0][0];
    // console.log(check_Task);
    if (check_Task) {
      const [student_detail] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const P_Owner = student_detail[0][0];
      const project_id = check_Task.stproject_assign;
      const [project_row] = await pool.execute("CALL getProjectById(?)", [project_id]);
      let get_tcode = "";
      if (project_id) {
        const project_name = project_row[0][0].pname;
        const letter = project_name.trim().substring(0, 2).toUpperCase();
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `${letter}-${random_num}`;
      } else {
        const random_num = Math.floor(Math.random() * 10000) + 1;
        get_tcode = `T-${random_num}`;
      }

      if (copy_detail == "everything" || copy_detail == "custom") {
        const formattedDueDate = check_Task.stdue_date.toISOString().slice(0, 19).replace("T", " ");
        const task_data = {
          tid: check_Task.tid,
          gid: check_Task.gid,
          sid: check_Task.sid,
          stcode: get_tcode,
          stname: stname,
          stdes: check_Task.stdes,
          stlink: check_Task.stlink,
          stlink_comment: check_Task.stlink_comment,
          stnote: check_Task.stnote,
          stfile: "",
          stpriority: check_Task.stpriority,
          ststatus: "to_do",
          ststatus_date: formattedDate,
          stproject_assign: check_Task.stproject_assign,
          portfolio_id: check_Task.portfolio_id,
          stassignee: check_Task.stassignee,
          stcreated_by: user_id,
          stcreated_date: formattedDate,
          stnotify: "yes",
          stnotify_clear: "no",
          stnotify_date: formattedDate,
          stdue_date: formattedDueDate,
          stdue_date_clear: "no",
          dept_id: check_Task.dept_id,
        };

        const paramNamesString1 = Object.keys(task_data).join(", ");
        const paramValuesString1 = Object.values(task_data)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL1 = `CALL InsertSubtask(?, ?)`;
        await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);

        const [inserted_task] = await pool.execute("CALL LastInsertSubtask(?)", [user_id]);
        const inserted_task_id = inserted_task[0][0].stid;

        const task_history = {
          pid: check_Task.stproject_assign,
          gid: check_Task.gid,
          sid: check_Task.sid,
          h_date: formattedDate,
          h_resource_id: P_Owner.reg_id,
          h_resource: `${P_Owner.first_name} ${P_Owner.last_name}`,
          h_description: `Task Code: ${get_tcode}, Task Name: ${stname}, Copied By ${P_Owner.first_name} ${P_Owner.last_name}`,
          subtask_id: inserted_task_id,
        };

        const paramNamesString2 = Object.keys(task_history).join(", ");
        const paramValuesString2 = Object.values(task_history)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL2 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL2, [paramNamesString2, paramValuesString2]);
        res.status(200).json({ insertedSubTaskId: inserted_task_id, message: "Subtask Copied Successfully." });
      } else {
        res.status(400).json({
          error: "Cannot Duplicate this task.",
        });
      }
    } else {
      res.status(400).json({ error: "Cannot Duplicate this task." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  User subtasks
router.get("/subtask/user-subtasks", async (req, res) => {
  const { reg_id } = req.body;
  try {
    const [get_all_subtask] = await pool.execute("CALL get_all_subtask(?)", [reg_id]);
    res.status(200).json({
      getAllSubtasks: get_all_subtask[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Project subtasks
router.get("/subtask/project-subtasks", async (req, res) => {
  const { project_id } = req.body;
  try {
    const [p_subtasks] = await pool.execute("CALL p_subtasks(?)", [project_id]);
    res.status(200).json({
      projectSubtasks: p_subtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  KPI subtasks
router.get("/subtask/kpi-subtasks", async (req, res) => {
  const { sid } = req.body;
  try {
    const [Strategy_subtasks] = await pool.execute("CALL Strategy_subtasks(?)", [sid]);
    res.status(200).json({
      strategySubtasks: Strategy_subtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Goal subtasks
router.get("/subtask/goal-subtasks", async (req, res) => {
  const { gid } = req.body;
  try {
    const [Goal_subtasks] = await pool.execute("CALL Goal_subtasks(?)", [gid]);
    res.status(200).json({
      goalSubtasks: Goal_subtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get Subtasks List by portfolio id
router.get("/subtask/portfolio-subtasks/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [portfolio_subtasks] = await pool.execute("CALL portfolio_subtasks(?)", [portfolio_id]);
    res.status(200).json({
      portfolioSubtasks: portfolio_subtasks[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Portfolio tasks
router.get("/task/portfolio-tasks/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [portfolio_tasksNew] = await pool.execute("CALL portfolio_tasksNew(?)", [portfolio_id]);
    res.status(200).json(portfolio_tasksNew[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
