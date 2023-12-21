const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion } = require("../utils/common-functions");
const moment = require("moment");

// Get All portfolio departments wise modules
router.get("/file-cabinet/data/:portfolio_id/:user_id", async (req, res) => {
  const { portfolio_id } = req.params;
  const { user_id } = req.params;
  try {
    const [departments] = await pool.execute("CALL get_PortfolioDepartment(?)", [portfolio_id]);

    const getSubtaskFiles = async (stid, portfolio_dept_id) => {
      let subtask_files_parent = [];
      const [subtasks_files] = await pool.execute("CALL file_itSubtaskFilesTaskWise(?,?,?,?)", [user_id, stid, portfolio_dept_id, portfolio_id]);

      if (subtasks_files[0]) {
        const subtask_files_data = subtasks_files[0];
        const subtask_files_promises = subtask_files_data.map(async (row) => {
          const stfile = row.stfile;
          return (
            stfile &&
            stfile.split(",").map((file, index) => ({
              id: `sf-${row.stid}-${index}`,
              name: file,
              table_id: row.stid,
              color: "#c7df19",
              type: "subtask-file",
              description: "",
              overview: "yes",
              section: "12",
            }))
          );
        });
        subtask_files_parent = (await Promise.all(subtask_files_promises)).flat();
      }
      return subtask_files_parent;
    };

    const getTaskSubtasks = async (tid, portfolio_dept_id) => {
      let subtask_parent = [];
      const [subtasks] = await pool.execute("CALL file_itSubtaskCountTaskWise(?,?,?,?)", [user_id, tid, portfolio_dept_id, portfolio_id]);

      if (subtasks[0]) {
        const subtask_data = subtasks[0];
        const subtask_promises = subtask_data.map(async (row) => {
          const subtask_files = await getSubtaskFiles(row.stid, row.dept_id);
          return {
            id: `st-${row.stid}`,
            name: row.stname,
            table_id: row.stid,
            color: "#21ff9d",
            type: "subtask-content",
            description: row.stdes,
            overview: "yes",
            section: "11",
            children: subtask_files,
          };
        });
        subtask_parent = await Promise.all(subtask_promises);
      }
      return subtask_parent;
    };

    const getProjectTasks = async (pid, portfolio_dept_id) => {
      let task_parent = [];
      const [tasks] = await pool.execute("CALL file_itTasksCountProjectWise(?,?,?,?)", [user_id, pid, portfolio_dept_id, portfolio_id]);

      if (tasks[0]) {
        const task_data = tasks[0];
        const task_promises = task_data.map(async (row) => {
          const subtasks = await getTaskSubtasks(row.tid, row.dept_id);
          return {
            id: `t-${row.tid}`,
            name: row.tname,
            table_id: row.tid,
            color: "#00dd7c",
            type: "task-content",
            description: row.tdes,
            overview: "yes",
            section: "9",
            children: [
              {
                id: `t-${row.tid}-0`,
                name: "Subtasks",
                table_id: 0,
                color: "#0bff94",
                type: "subtask",
                description: "",
                overview: "no",
                section: "10",
                children: subtasks,
              },
            ],
          };
        });
        task_parent = await Promise.all(task_promises);
      }
      return task_parent;
    };

    const getKpiProject = async (sid, portfolio_dept_id) => {
      let project_parent = [];
      const [projects_1] = await pool.execute("CALL file_itProjectsCountStrategyWise(?,?,?,?)", [user_id, sid, portfolio_dept_id, portfolio_id]);
      const [projects_2] = await pool.execute("CALL file_itAcceptedProjectsCountStrategyWise(?,?,?,?)", [user_id, sid, portfolio_dept_id, portfolio_id]);

      if (projects_1[0]) {
        const project_1_data = projects_1[0];
        const project_promises_1 = project_1_data.map(async (row) => {
          const tasks = await getProjectTasks(row.pid, row.dept_id);
          return {
            id: `p-${row.pid}`,
            name: row.pname,
            table_id: row.pid,
            color: "#00c770",
            type: "project-content",
            description: row.pdes,
            overview: "yes",
            section: "7",
            children: [
              {
                id: `p-${row.pid}-0`,
                name: "Tasks",
                table_id: 0,
                color: "#00dd7c",
                type: "task",
                description: "",
                overview: "no",
                section: "8",
                children: tasks,
              },
            ],
          };
        });
        const result_1 = await Promise.all(project_promises_1);
        project_parent = project_parent.concat(result_1);
      }

      if (projects_2[0]) {
        const project_2_data = projects_2[0];
        const project_promises_2 = project_2_data.map(async (row) => {
          const tasks = await getProjectTasks(row.pid, row.dept_id);
          return {
            id: `p-${row.pid}`,
            name: row.pname,
            table_id: row.pid,
            color: "#00c770",
            type: "project-content",
            description: row.pdes,
            overview: "yes",
            section: "7",
            children: [
              {
                id: `p-${row.pid}-0`,
                name: "Tasks",
                table_id: 0,
                color: "#00dd7c",
                type: "task",
                description: "",
                overview: "no",
                section: "8",
                children: tasks,
              },
            ],
          };
        });
        const result_2 = await Promise.all(project_promises_2);
        project_parent = project_parent.concat(result_2);
      }
      return project_parent;
    };

    const getGoalKpi = async (gid, portfolio_dept_id) => {
      let kpi_parent = [];
      const [kpis] = await pool.execute("CALL file_itStrategiesCountGoalWise(?,?,?)", [gid, portfolio_dept_id, portfolio_id]);

      if (kpis[0]) {
        const kpi_data = kpis[0];
        const kpi_promises = kpi_data.map(async (row) => {
          const projects = await getKpiProject(row.sid, row.gdept_id);
          return {
            id: `k-${row.sid}`,
            name: row.sname,
            table_id: row.sid,
            color: "#009b57",
            type: "kpi-content",
            description: row.sdes,
            overview: "yes",
            section: "5",
            children: [
              {
                id: `k-${row.sid}-0`,
                name: "Projects",
                table_id: 0,
                color: "#00b163",
                type: "project",
                description: "",
                overview: "no",
                section: "6",
                children: projects,
              },
            ],
          };
        });
        kpi_parent = await Promise.all(kpi_promises);
      }
      return kpi_parent;
    };

    const getDepartmentGoal = async (portfolio_dept_id) => {
      let goal_parent = [];
      const [goals_1] = await pool.execute("CALL file_itGoalsDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);
      const [goals_2] = await pool.execute("CALL file_itAcceptedGoalsDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);

      if (goals_1[0]) {
        const goal_1_data = goals_1[0];
        const goal_promises_1 = goal_1_data.map(async (row) => {
          const kpis = await getGoalKpi(row.gid, row.gdept);
          return {
            id: `g-${row.gid}`,
            name: row.gname,
            table_id: row.gid,
            color: "#006e3e",
            type: "goal-content",
            description: row.gdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `g-${row.gid}-0`,
                name: "KPIs",
                table_id: 0,
                color: "#00854a",
                type: "kpi",
                description: "",
                overview: "no",
                section: "4",
                children: kpis,
              },
            ],
          };
        });
        const result_1 = await Promise.all(goal_promises_1);
        goal_parent = goal_parent.concat(result_1);
      }

      if (goals_2[0]) {
        const goal_2_data = goals_2[0];
        const goal_promises_2 = goal_2_data.map(async (row) => {
          const kpis = await getGoalKpi(row.gid, row.gdept);
          return {
            id: `g-${row.gid}`,
            name: row.gname,
            table_id: row.gid,
            color: "#006e3e",
            type: "goal-content",
            description: row.gdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `g-${row.gid}-0`,
                name: "KPIs",
                table_id: 0,
                color: "#00854a",
                type: "kpi",
                description: "",
                overview: "no",
                section: "4",
                children: kpis,
              },
            ],
          };
        });
        const result_2 = await Promise.all(goal_promises_2);
        goal_parent = goal_parent.concat(result_2);
      }
      return goal_parent;
    };

    const getDepartmentKpi = async (portfolio_dept_id) => {
      let kpi_parent = [];
      const [kpis_1] = await pool.execute("CALL file_itStrategiesDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);

      const [kpis_2] = await pool.execute("CALL file_itAcceptedStrategiesDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);

      if (kpis_1[0]) {
        const kpi_1_data = kpis_1[0];
        const kpi_promises_1 = kpi_1_data.map(async (row) => {
          const projects = await getKpiProject(row.sid, row.gdept_id);
          return {
            id: `k-${row.sid}`,
            name: row.sname,
            table_id: row.sid,
            color: "#006e3e",
            type: "kpi-content",
            description: row.sdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `k-${row.sid}-0`,
                name: "Projects",
                table_id: 0,
                color: "#00854a",
                type: "project",
                description: "",
                overview: "no",
                section: "4",
                children: projects,
              },
            ],
          };
        });
        const result_1 = await Promise.all(kpi_promises_1);
        kpi_parent = kpi_parent.concat(result_1);
      }

      if (kpis_2[0]) {
        const kpi_2_data = kpis_2[0];
        const kpi_promises_2 = kpi_2_data.map(async (row) => {
          const projects = await getKpiProject(row.sid, row.gdept_id);
          return {
            id: `k-${row.sid}`,
            name: row.sname,
            table_id: row.sid,
            color: "#006e3e",
            type: "kpi-content",
            description: row.sdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `k-${row.sid}-0`,
                name: "Projects",
                table_id: 0,
                color: "#00854a",
                type: "project",
                description: "",
                overview: "no",
                section: "4",
                children: projects,
              },
            ],
          };
        });
        const result_2 = await Promise.all(kpi_promises_2);
        kpi_parent = kpi_parent.concat(result_2);
      }

      return kpi_parent;
    };

    const getDepartmentProject = async (portfolio_dept_id) => {
      let project_parent = [];
      const [projects_1] = await pool.execute("CALL file_itProjectsDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);
      const [projects_2] = await pool.execute("CALL file_itAcceptedProjectsDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);

      if (projects_1[0]) {
        const project_1_data = projects_1[0];
        const project_promises_1 = project_1_data.map(async (row) => {
          const tasks = await getProjectTasks(row.pid, row.dept_id);
          return {
            id: `p-${row.pid}`,
            name: row.pname,
            table_id: row.pid,
            color: "#006e3e",
            type: "project-content",
            description: row.pdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `p-${row.pid}-0`,
                name: "Tasks",
                table_id: 0,
                color: "#00854a",
                type: "task",
                description: "",
                overview: "no",
                section: "4",
                children: tasks,
              },
            ],
          };
        });
        const result_1 = await Promise.all(project_promises_1);
        project_parent = project_parent.concat(result_1);
      }

      if (projects_2[0]) {
        const project_2_data = projects_2[0];
        const project_promises_2 = project_2_data.map(async (row) => {
          const tasks = await getProjectTasks(row.pid, row.dept_id);
          return {
            id: `p-${row.pid}`,
            name: row.pname,
            table_id: row.pid,
            color: "#006e3e",
            type: "project-content",
            description: row.pdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `p-${row.pid}-0`,
                name: "Tasks",
                table_id: 0,
                color: "#00854a",
                type: "task",
                description: "",
                overview: "no",
                section: "4",
                children: tasks,
              },
            ],
          };
        });
        const result_2 = await Promise.all(project_promises_2);
        project_parent = project_parent.concat(result_2);
      }
      return project_parent;
    };

    const getDepartmentTask = async (portfolio_dept_id) => {
      let task_parent = [];
      const [tasks_1] = await pool.execute("CALL file_itTasksDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);
      const [tasks_2] = await pool.execute("CALL file_itSingleTasksDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);

      if (tasks_1[0]) {
        const task_1_data = tasks_1[0];
        const task_promises_1 = task_1_data.map(async (row) => {
          const subtasks = await getTaskSubtasks(row.tid, row.dept_id);
          return {
            id: `t-${row.tid}`,
            name: row.tname,
            table_id: row.tid,
            color: "#006e3e",
            type: "task-content",
            description: row.tdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `t-${row.tid}-0`,
                name: "Subtasks",
                table_id: 0,
                color: "#00854a",
                type: "subtask",
                description: "",
                overview: "no",
                section: "4",
                children: subtasks,
              },
            ],
          };
        });
        const result_1 = await Promise.all(task_promises_1);
        task_parent = task_parent.concat(result_1);
      }

      if (tasks_2[0]) {
        const task_2_data = tasks_2[0];
        const task_promises_2 = task_2_data.map(async (row) => {
          const subtasks = await getTaskSubtasks(row.tid, row.dept_id);
          return {
            id: `t-${row.tid}`,
            name: row.tname,
            table_id: row.tid,
            color: "#006e3e",
            type: "task-content",
            description: row.tdes,
            overview: "yes",
            section: "3",
            children: [
              {
                id: `t-${row.tid}-0`,
                name: "Subtasks",
                table_id: 0,
                color: "#00854a",
                type: "subtask",
                description: "",
                overview: "no",
                section: "4",
                children: subtasks,
              },
            ],
          };
        });
        const result_2 = await Promise.all(task_promises_2);
        task_parent = task_parent.concat(result_2);
      }
      return task_parent;
    };

    const getDepartmentSubtask = async (portfolio_dept_id) => {
      let subtask_parent = [];
      const [subtasks_1] = await pool.execute("CALL file_itSubtasksDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);
      const [subtasks_2] = await pool.execute("CALL file_itSingleSubtasksDeptWise(?,?,?)", [user_id, portfolio_dept_id, portfolio_id]);

      if (subtasks_1[0]) {
        const subtask_1_data = subtasks_1[0];
        const subtask_promises_1 = subtask_1_data.map(async (row) => {
          const subtask_files = await getSubtaskFiles(row.stid, row.dept_id);
          return {
            id: `st-${row.stid}`,
            name: row.stname,
            table_id: row.stid,
            color: "#006e3e",
            type: "subtask-content",
            description: row.stdes,
            overview: "yes",
            section: "3",
            children: subtask_files,
          };
        });
        const result_1 = await Promise.all(subtask_promises_1);
        subtask_parent = subtask_parent.concat(result_1);
      }

      if (subtasks_2[0]) {
        const subtask_2_data = subtasks_2[0];
        const subtask_promises_2 = subtask_2_data.map(async (row) => {
          const subtask_files = await getSubtaskFiles(row.stid, row.dept_id);
          return {
            id: `st-${row.stid}`,
            name: row.stname,
            table_id: row.stid,
            color: "#006e3e",
            type: "subtask-content",
            description: row.stdes,
            overview: "yes",
            section: "3",
            children: subtask_files,
          };
        });
        const result_2 = await Promise.all(subtask_promises_2);
        subtask_parent = subtask_parent.concat(result_2);
      }
      return subtask_parent;
    };

    const department_data = departments[0];
    const department_promises = department_data.map(async (row) => {
      const goals = await getDepartmentGoal(row.portfolio_dept_id);
      const kpis = await getDepartmentKpi(row.portfolio_dept_id);
      const projects = await getDepartmentProject(row.portfolio_dept_id);
      const tasks = await getDepartmentTask(row.portfolio_dept_id);
      const subtasks = await getDepartmentSubtask(row.portfolio_dept_id);
      return {
        id: `d-${row.portfolio_dept_id}`,
        name: row.department,
        table_id: row.portfolio_dept_id,
        color: "#004225",
        type: "department",
        description: "",
        overview: "no",
        section: "1",
        children: [
          {
            id: `d-${row.portfolio_dept_id}-0`,
            name: "Goals",
            table_id: 0,
            color: "#005831",
            type: "goal",
            description: "",
            overview: "no",
            section: "2",
            children: goals,
          },
          {
            id: `d-${row.portfolio_dept_id}-1`,
            name: "KPIs",
            table_id: 0,
            color: "#005831",
            type: "kpi",
            description: "",
            overview: "no",
            section: "2",
            children: kpis,
          },
          {
            id: `d-${row.portfolio_dept_id}-2`,
            name: "Projects",
            table_id: 0,
            color: "#005831",
            type: "project",
            description: "",
            overview: "no",
            section: "2",
            children: projects,
          },
          {
            id: `d-${row.portfolio_dept_id}-3`,
            name: "Tasks",
            table_id: 0,
            color: "#005831",
            type: "task",
            description: "",
            overview: "no",
            section: "2",
            children: tasks,
          },
          {
            id: `d-${row.portfolio_dept_id}-4`,
            name: "Subtasks",
            table_id: 0,
            color: "#005831",
            type: "subtask",
            description: "",
            overview: "no",
            section: "2",
            children: subtasks,
          },
        ],
      };
    });
    const department_parent = await Promise.all(department_promises);
    res.status(200).json(department_parent);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Get User detail by ID
router.get("/file-cabinet/get-student-detail/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [user_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    res.status(200).json(user_row[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Portfolio departments
router.get("/file-cabinet/files/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL get_PortfolioDepartment(?)", [portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// File it Goal
router.patch("/file-cabinet/file-it/goal/:goal_id/:user_id", async (req, res) => {
  const { goal_id, user_id } = req.params;
  try {
    const [goal_row] = await pool.execute("CALL file_itGoalDetail(?)", [goal_id]);

    const [goal_wise_tasks] = await pool.execute("CALL Goalprogress_total(?)", [goal_id]);
    const [goal_wise_done_tasks] = await pool.execute("CALL Goalprogress_done(?)", [goal_id]);

    const [goal_wise_subtasks] = await pool.execute("CALL Goalsub_progress_total(?)", [goal_id]);
    const [goal_wise_done_subtasks] = await pool.execute("CALL Goalsub_progress_done(?)", [goal_id]);

    const formattedDate = dateConversion();
    const goalFieldsValues = `g_file_it = 'yes', g_file_it_date = '${formattedDate}'`;
    const gid = `gid = '${goal_id}'`;

    if (goal_row[0][0]) {
      const all_task = goal_wise_tasks[0][0].count_rows;
      const done_task = goal_wise_done_tasks[0][0].count_rows;
      const all_subtask = goal_wise_subtasks[0][0].count_rows;
      const done_subtask = goal_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        await pool.execute("CALL UpdateGoals(?, ?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsInvitedMembers(?, ?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsMembers(?, ?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsSuggestedMembers(?, ?)", [goalFieldsValues, gid]);

        const [goal_wise_kpis] = await pool.execute("CALL GoalsAllStrategiesList_to_delete(?)", [goal_id]);
        if (goal_wise_kpis[0]) {
          const kpi_array = goal_wise_kpis[0];
          kpi_array.forEach(async (row) => {
            const kpiFieldsValues = `s_file_it = 'yes', s_file_it_date = '${formattedDate}'`;
            const sid = `sid = '${row.sid}'`;
            await pool.execute("CALL UpdateStrategies(?, ?)", [kpiFieldsValues, sid]);
            const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [row.sid]);
            if (kpi_wise_projects[0]) {
              const project_array = kpi_wise_projects[0];
              project_array.forEach(async (row) => {
                const projectFieldsValues = `project_file_it = 'yes', project_file_it_date = '${formattedDate}'`;
                const pid = `pid = '${row.pid}'`;
                await pool.execute("CALL UpdateProject(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectFiles(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectManagement(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectManagementFields(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectMembers(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectSuggestedMembers(?, ?)", [projectFieldsValues, pid]);

                const taskFieldsValues = `task_file_it = 'yes', task_file_it_date = '${formattedDate}'`;
                const tproject_assign = `tproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tproject_assign]);

                const subtaskFieldsValues = `subtask_file_it = 'yes', subtask_file_it_date = '${formattedDate}'`;
                const stproject_assign = `stproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stproject_assign]);
              });
            }
          });
        }
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
        const student = owner_row[0][0];

        const historyFieldsNames = "gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${goal_id}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Filed By Goal Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Goal Filed Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Tasks and Subtasks to File it the Goal!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get Goal details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// File it KPI
router.patch("/file-cabinet/file-it/kpi/:strategy_id/:user_id", async (req, res) => {
  const { strategy_id, user_id } = req.params;
  try {
    const [kpi_row] = await pool.execute("CALL file_itStrategyDetail(?)", [strategy_id]);

    const [kpi_wise_tasks] = await pool.execute("CALL Strategyprogress_total(?)", [strategy_id]);
    const [kpi_wise_done_tasks] = await pool.execute("CALL Strategyprogress_done(?)", [strategy_id]);

    const [kpi_wise_subtasks] = await pool.execute("CALL Strategysub_progress_total(?)", [strategy_id]);
    const [kpi_wise_done_subtasks] = await pool.execute("CALL Strategysub_progress_done(?)", [strategy_id]);
    const formattedDate = dateConversion();
    if (kpi_row[0][0]) {
      const all_task = kpi_wise_tasks[0][0].count_rows;
      const done_task = kpi_wise_done_tasks[0][0].count_rows;
      const all_subtask = kpi_wise_subtasks[0][0].count_rows;
      const done_subtask = kpi_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        const kpiFieldsValues = `s_file_it = 'yes', s_file_it_date = '${formattedDate}'`;
        const sid = `sid = '${strategy_id}'`;
        await pool.execute("CALL UpdateStrategies(?, ?)", [kpiFieldsValues, sid]);
        const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [strategy_id]);
        if (kpi_wise_projects[0]) {
          const project_array = kpi_wise_projects[0];
          project_array.forEach(async (row) => {
            const projectFieldsValues = `project_file_it = 'yes', project_file_it_date = '${formattedDate}'`;
            const pid = `pid = '${row.pid}'`;
            await pool.execute("CALL UpdateProject(?, ?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectFiles(?, ?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectManagement(?, ?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectManagementFields(?, ?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectMembers(?, ?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectSuggestedMembers(?, ?)", [projectFieldsValues, pid]);

            const taskFieldsValues = `task_file_it = 'yes', task_file_it_date = '${formattedDate}'`;
            const tproject_assign = `tproject_assign = '${row.pid}'`;
            await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tproject_assign]);

            const subtaskFieldsValues = `subtask_file_it = 'yes', subtask_file_it_date = '${formattedDate}'`;
            const stproject_assign = `stproject_assign = '${row.pid}'`;
            await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stproject_assign]);
          });
        }
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
        const student = owner_row[0][0];

        const historyFieldsNames = "sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Filed By KPI Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "KPI Filed Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Tasks and Subtasks to File it the KPI!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get KPI details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// File it Project
router.patch("/file-cabinet/file-it/project/:project_id/:user_id", async (req, res) => {
  const { project_id, user_id } = req.params;
  try {
    const [project_row] = await pool.execute("CALL file_itProjectDetail2(?)", [project_id]);

    const [project_wise_tasks] = await pool.execute("CALL progress_total(?)", [project_id]);
    const [project_wise_done_tasks] = await pool.execute("CALL progress_done(?)", [project_id]);

    const [project_wise_subtasks] = await pool.execute("CALL sub_progress_total(?)", [project_id]);
    const [project_wise_done_subtasks] = await pool.execute("CALL sub_progress_done(?)", [project_id]);
    const formattedDate = dateConversion();
    if (project_row[0][0]) {
      const all_task = project_wise_tasks[0][0].count_rows;
      const done_task = project_wise_done_tasks[0][0].count_rows;
      const all_subtask = project_wise_subtasks[0][0].count_rows;
      const done_subtask = project_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        const projectFieldsValues = `project_file_it = 'yes', project_file_it_date = '${formattedDate}'`;
        const pid = `pid = '${project_id}'`;
        await pool.execute("CALL UpdateProject(?, ?)", [projectFieldsValues, pid]);
        await pool.execute("CALL UpdateProjectFiles(?, ?)", [projectFieldsValues, pid]);
        await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [projectFieldsValues, pid]);
        await pool.execute("CALL UpdateProjectManagement(?, ?)", [projectFieldsValues, pid]);
        await pool.execute("CALL UpdateProjectManagementFields(?, ?)", [projectFieldsValues, pid]);
        await pool.execute("CALL UpdateProjectMembers(?, ?)", [projectFieldsValues, pid]);
        await pool.execute("CALL UpdateProjectSuggestedMembers(?, ?)", [projectFieldsValues, pid]);

        const taskFieldsValues = `task_file_it = 'yes', task_file_it_date = '${formattedDate}'`;
        const tproject_assign = `tproject_assign = '${project_id}'`;
        await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tproject_assign]);

        const subtaskFieldsValues = `subtask_file_it = 'yes', subtask_file_it_date = '${formattedDate}'`;
        const stproject_assign = `stproject_assign = '${project_id}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stproject_assign]);
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
        const student = owner_row[0][0];

        const historyFieldsNames = "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Filed By Project Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Project Filed Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Tasks and Subtasks to File it the Project!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get Project details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// File it Task
router.patch("/file-cabinet/file-it/task/:task_id/:user_id", async (req, res) => {
  const { task_id, user_id } = req.params;
  try {
    const [task_row] = await pool.execute("CALL check_Donetask(?)", [task_id]);

    const [subtasks] = await pool.execute("CALL subtask_progress_total(?)", [task_id]);
    const [done_subtasks] = await pool.execute("CALL subtask_progress_done(?)", [task_id]);
    const formattedDate = dateConversion();
    if (task_row[0][0]) {
      const all_subtask = subtasks[0][0].count_rows;
      const done_subtask = done_subtasks[0][0].count_rows;
      if (all_subtask == done_subtask) {
        const taskFieldsValues = `task_file_it = 'yes', task_file_it_date = '${formattedDate}'`;
        const tid = `tid = '${task_id}'`;
        await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tid]);

        const subtaskFieldsValues = `subtask_file_it = 'yes', subtask_file_it_date = '${formattedDate}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, tid]);
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
        const student = owner_row[0][0];

        const historyFieldsNames = "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Filed By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Task Filed Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Subtasks to File it the Task.",
        });
      }
    } else {
      res.status(400).json({ error: "Please Complete Task to file it." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// File it Subtask
router.patch("/file-cabinet/file-it/subtask/:subtask_id/:user_id", async (req, res) => {
  const { subtask_id, user_id } = req.params;
  try {
    const [subtask_row] = await pool.execute("CALL check_Donesubtask(?)", [subtask_id]);
    const formattedDate = dateConversion();
    if (subtask_row[0][0]) {
      const subtaskFieldsValues = `subtask_file_it = 'yes', subtask_file_it_date = '${formattedDate}'`;
      const stid = `stid = '${subtask_id}'`;
      await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stid]);
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = owner_row[0][0];

      const historyFieldsNames = "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Filed By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
      return res.status(200).json({ message: "Subtask Filed Successfully." });
    } else {
      res.status(400).json({ error: "Please Complete Subtask to file it." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Goal
router.patch("/file-cabinet/reopen/goal/:goal_id/:portfolio_id/:user_id", async (req, res) => {
  const { goal_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [goal_count] = await pool.execute("CALL getGoalCount(?, ?)", [user_id, portfolio_id]);
        if (package[0][0]) {
          const total_goals = package[0][0].pack_goals;
          const used_goals = goal_count[0][0].goal_count_rows;
          const check_type = !isNaN(total_goals);
          if (check_type) {
            if (used_goals < total_goals) {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
    } else {
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [goal_count] = await pool.execute("CALL getGoalCount(?, ?)", [user_id, portfolio_id]);
      if (package[0][0]) {
        const total_goals = package[0][0].pack_goals;
        const used_goals = goal_count[0][0].goal_count_rows;
        const check_type = !isNaN(total_goals);
        if (check_type) {
          if (used_goals < total_goals) {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          } else {
            res.status(400).json({ error: "Limit Exceeds." });
          }
        } else {
          if (portfolio_id) {
            var limitation = "in_limit";
          }
        }
      } else {
        res.status(400).json({ error: "Package Expired." });
      }
    }
    if (limitation == "in_limit") {
      const [goal_row] = await pool.execute("CALL check_goal_file_it(?,?)", [user_id, goal_id]);

      if (goal_row[0][0]) {
        const goalFieldsValues = `g_file_it = '', g_file_it_date = ''`;
        const gid = `gid = '${goal_id}'`;
        await pool.execute("CALL UpdateGoals(?, ?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsInvitedMembers(?, ?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsMembers(?, ?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsSuggestedMembers(?, ?)", [goalFieldsValues, gid]);

        const [goal_wise_kpis] = await pool.execute("CALL GoalsAllStrategiesList_to_delete(?)", [goal_id]);
        if (goal_wise_kpis[0]) {
          const kpi_array = goal_wise_kpis[0];
          kpi_array.forEach(async (row) => {
            const kpiFieldsValues = `s_file_it = '', s_file_it_date = ''`;
            const sid = `sid = '${row.sid}'`;
            await pool.execute("CALL UpdateStrategies(?, ?)", [kpiFieldsValues, sid]);

            const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [row.sid]);
            if (kpi_wise_projects[0]) {
              const project_array = kpi_wise_projects[0];
              project_array.forEach(async (row) => {
                const projectFieldsValues = `project_file_it = '', project_file_it_date = ''`;
                const pid = `pid = '${row.pid}'`;
                await pool.execute("CALL UpdateProject(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectFiles(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectManagement(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectManagementFields(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectMembers(?, ?)", [projectFieldsValues, pid]);
                await pool.execute("CALL UpdateProjectSuggestedMembers(?, ?)", [projectFieldsValues, pid]);

                const taskFieldsValues = `task_file_it = '', task_file_it_date = ''`;
                const tproject_assign = `tproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tproject_assign]);

                const subtaskFieldsValues = `subtask_file_it = '', subtask_file_it_date = ''`;
                const stproject_assign = `stproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stproject_assign]);
              });
            }
          });
        }

        const historyFieldsNames = "gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${goal_id}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Reopened By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Goal Reopened Successfully." });
      } else {
        res.status(400).json({ error: "Failed to get Goal details." });
      }
    } else {
      res.status(400).json({ error: "Limit Exceeds." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen KPI
router.patch("/file-cabinet/reopen/kpi/:strategy_id/:portfolio_id/:user_id", async (req, res) => {
  const { strategy_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const [kpi] = await pool.execute("CALL StrategyDetailGid(?)", [strategy_id]);
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [kpi_count] = await pool.execute("CALL getStrategiesCount(?,?,?)", [user_id, kpi[0][0].gid, portfolio_id]);
        if (package[0][0]) {
          const total_kpis = package[0][0].pack_goals_strategies;
          const used_kpis = kpi_count[0][0].strategy_count_rows;
          const check_type = !isNaN(total_kpis);
          if (check_type) {
            if (used_kpis < total_kpis) {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
    } else {
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [kpi_count] = await pool.execute("CALL getStrategiesCount(?,?,?)", [user_id, kpi.gid, portfolio_id]);
      if (package[0][0]) {
        const total_kpis = package[0][0].pack_goals_strategies;
        const used_kpis = kpi_count[0][0].strategy_count_rows;
        const check_type = !isNaN(total_kpis);
        if (check_type) {
          if (used_kpis < total_kpis) {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          } else {
            res.status(400).json({ error: "Limit Exceeds." });
          }
        } else {
          if (portfolio_id) {
            var limitation = "in_limit";
          }
        }
      } else {
        res.status(400).json({ error: "Package Expired." });
      }
    }
    if (limitation == "in_limit") {
      const [kpi_row] = await pool.execute("CALL check_strategy_file_it(?,?)", [user_id, strategy_id]);
      if (kpi_row[0][0]) {
        const [goal_row] = await pool.execute("CALL checkStrategyGoalfile_it(?)", [kpi_row[0][0].gid]);
        if (goal_row[0][0]) {
          res.status(400).json({
            error: "Goal is Filed! To Reopen KPI please Reopen Goal.",
          });
        } else {
          const kpiFieldsValues = `s_file_it = '', s_file_it_date = ''`;
          const sid = `sid = '${strategy_id}'`;
          await pool.execute("CALL UpdateStrategies(?, ?)", [kpiFieldsValues, sid]);

          const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [strategy_id]);
          if (kpi_wise_projects[0]) {
            const project_array = kpi_wise_projects[0];
            project_array.forEach(async (row) => {
              const projectFieldsValues = `project_file_it = '', project_file_it_date = ''`;
              const pid = `pid = '${row.pid}'`;
              await pool.execute("CALL UpdateProject(?, ?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectFiles(?, ?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagement(?, ?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagementFields(?, ?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectMembers(?, ?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectSuggestedMembers(?, ?)", [projectFieldsValues, pid]);

              const taskFieldsValues = `task_file_it = '', task_file_it_date = ''`;
              const tproject_assign = `tproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tproject_assign]);

              const subtaskFieldsValues = `subtask_file_it = '', subtask_file_it_date = ''`;
              const stproject_assign = `stproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stproject_assign]);
            });
          }

          const historyFieldsNames = "sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Reopned By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
          return res.status(200).json({ message: "KPI Reopened Successfully." });
        }
      } else {
        res.status(400).json({ error: "Failed to get KPI details." });
      }
    } else {
      res.status(400).json({ error: "Limit Exceeds." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Project
router.patch("/file-cabinet/reopen/project/:project_id/:portfolio_id/:user_id", async (req, res) => {
  const { project_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const [project] = await pool.execute("CALL getProjectDetailID(?)", [project_id]);
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (project[0][0].ptype == "content") {
      res.status(400).json({ error: "Content Project." });
    } else {
      if (moment(student.package_expiry, format, true).isValid()) {
        const expiryDate = new Date(student.package_expiry);
        const currentDate = new Date();
        if (expiryDate <= currentDate) {
          res.status(400).json({ error: "Package Expired." });
        } else {
          const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
          const [project_count] = await pool.execute("CALL getProjectCount(?,?)", [user_id, portfolio_id]);
          if (package[0][0]) {
            const total_projects = package[0][0].pack_projects;
            const used_projects = project_count[0][0].project_count_rows;
            const check_type = !isNaN(total_projects);
            if (check_type) {
              if (used_projects < total_projects) {
                if (portfolio_id) {
                  var limitation = "in_limit";
                }
              } else {
                res.status(400).json({ error: "Limit Exceeds." });
              }
            } else {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            }
          } else {
            res.status(400).json({ error: "Package Expired." });
          }
        }
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [project_count] = await pool.execute("CALL getProjectCount(?,?)", [user_id, portfolio_id]);
        if (package[0][0]) {
          const total_projects = package[0][0].pack_projects;
          const used_projects = project_count[0][0].project_count_rows;
          const check_type = !isNaN(total_projects);
          if (check_type) {
            if (used_projects < total_projects) {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
    }

    if (limitation == "in_limit") {
      const [project_row] = await pool.execute("CALL checkTaskProjectfile_it(?)", [project_id]);
      if (project_row[0][0]) {
        const [kpi_row] = await pool.execute("CALL checkProjectStrategyfile_it(?)", [project_row[0][0].sid]);
        if (kpi_row[0][0]) {
          res.status(400).json({
            error: "KPI is Filed! To Reopen Project please Reopen KPI.",
          });
        } else {
          const projectFieldsValues = `project_file_it = '', project_file_it_date = ''`;
          const pid = `pid = '${project_id}'`;
          await pool.execute("CALL UpdateProject(?, ?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectFiles(?, ?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectInvitedMembers(?, ?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectManagement(?, ?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectManagementFields(?, ?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectMembers(?, ?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectSuggestedMembers(?, ?)", [projectFieldsValues, pid]);

          const taskFieldsValues = `task_file_it = '', task_file_it_date = ''`;
          const tproject_assign = `tproject_assign = '${project_id}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tproject_assign]);

          const subtaskFieldsValues = `subtask_file_it = '', subtask_file_it_date = ''`;
          const stproject_assign = `stproject_assign = '${project_id}'`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stproject_assign]);

          const historyFieldsNames = "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Reopened By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
          return res.status(200).json({ message: "Project Reopened Successfully." });
        }
      } else {
        res.status(400).json({ error: "Failed to get Project details." });
      }
    } else {
      res.status(400).json({ error: "Limit Exceeds." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Task
router.patch("/file-cabinet/reopen/task/:task_id/:portfolio_id/:user_id", async (req, res) => {
  const { task_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [task_count] = await pool.execute("CALL getTaskCount(?,?)", [user_id, portfolio_id]);
        if (package[0][0]) {
          const total_tasks = package[0][0].pack_tasks;
          const used_tasks = task_count[0][0].task_count_rows;
          const check_type = !isNaN(total_tasks);
          if (check_type) {
            const total_all_pro = package[0][0].pack_projects;
            var total_all_task = total_tasks;
            if (!isNaN(total_all_pro)) {
              var total_all_task = total_tasks * total_all_pro;
            }
            if (used_tasks < total_all_task) {
              var limitation = "in_limit";
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
    } else {
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [task_count] = await pool.execute("CALL getTaskCount(?,?)", [user_id, portfolio_id]);
      if (package[0][0]) {
        const total_tasks = package[0][0].pack_tasks;
        const used_tasks = task_count[0][0].task_count_rows;
        const check_type = !isNaN(total_tasks);
        if (check_type) {
          const total_all_pro = package[0][0].pack_projects;
          var total_all_task = total_tasks;
          if (!isNaN(total_all_pro)) {
            var total_all_task = total_tasks * total_all_pro;
          }
          if (used_tasks < total_all_task) {
            var limitation = "in_limit";
          } else {
            res.status(400).json({ error: "Limit Exceeds." });
          }
        } else {
          if (portfolio_id) {
            var limitation = "in_limit";
          }
        }
      } else {
        res.status(400).json({ error: "Package Expired." });
      }
    }

    if (limitation == "in_limit") {
      const [task_row] = await pool.execute("CALL checkSubtaskTaskfile_it(?)", [task_id]);
      if (task_row[0][0]) {
        const [project_row] = await pool.execute("CALL checkTaskProjectfile_it(?)", [task_row[0][0].tproject_assign]);
        if (project_row[0][0]) {
          res.status(400).json({
            error: "Project is Filed! To Reopen Task please Reopen Project.",
          });
        } else {
          const taskFieldsValues = `task_file_it = '', task_file_it_date = ''`;
          const tid = `tid = '${task_id}'`;
          await pool.execute("CALL UpdateTask(?, ?)", [taskFieldsValues, tid]);

          const subtaskFieldsValues = `subtask_file_it = '', subtask_file_it_date = ''`;
          await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, tid]);

          const historyFieldsNames = "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Reopened By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
          return res.status(200).json({ message: "Task Reopened Successfully." });
        }
      } else {
        res.status(400).json({ error: "Failed to get Task details." });
      }
    } else {
      res.status(400).json({ error: "Limit Exceeds." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Subtask
router.patch("/file-cabinet/reopen/subtask/:subtask_id/:user_id", async (req, res) => {
  const { subtask_id, user_id } = req.params;
  try {
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const [subtask_row] = await pool.execute("CALL check_subtask_file_it(?)", [subtask_id]);
    if (subtask_row[0][0]) {
      const [task_row] = await pool.execute("CALL checkSubtaskTaskfile_it(?)", [subtask_row[0][0].tid]);
      if (task_row[0][0]) {
        res.status(400).json({
          error: "Task is Filed! To Reopen Subtask please Reopen Task.",
        });
      } else {
        const subtaskFieldsValues = `subtask_file_it = '', subtask_file_it_date = ''`;
        const stid = `stid = '${subtask_id}'`;
        await pool.execute("CALL UpdateSubtask(?, ?)", [subtaskFieldsValues, stid]);

        const historyFieldsNames = "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Reopened By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?, ?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Subtask Reopened Successfully." });
      }
    } else {
      res.status(400).json({ error: "Failed to get Subtask details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/recent-files/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [task_files] = await pool.execute("CALL task_5Files(?,?)", [user_id, portfolio_id]);
    const [singletask_files] = await pool.execute("CALL singleTask_5Files(?,?)", [user_id, portfolio_id]);
    const [subtask_files] = await pool.execute("CALL subtask_5Files(?,?)", [user_id, portfolio_id]);
    const [singlesubtask_files] = await pool.execute("CALL singleSubtask_5Files(?,?)", [user_id, portfolio_id]);
    const [project_files] = await pool.execute("CALL project_5Files(?,?)", [user_id, portfolio_id]);

    // Set file_type property for each category
    task_files[0].forEach(async (tf) => (tf.file_type = "task"));
    singletask_files[0].forEach(async (stf) => (stf.file_type = "task"));
    subtask_files[0].forEach(async (sbtf) => (sbtf.file_type = "subtask"));
    singlesubtask_files[0].forEach(async (ssbtf) => (ssbtf.file_type = "subtask"));
    project_files[0].forEach(async (pf) => (pf.file_type = "project"));

    const all_files_data = [...task_files[0], ...singletask_files[0], ...subtask_files[0], ...singlesubtask_files[0], ...project_files[0]];

    // Sort the merged array by file_date in descending order
    all_files_data?.sort((a, b) => new Date(b.file_date) - new Date(a.file_date));

    let all_files_parent = [];
    if (all_files_data) {
      const all_files_promises = all_files_data.map(async (row) => {
        const fileName = row.file_name;
        return (
          fileName &&
          fileName.split(",").map((file, index) => ({
            id: `rf-${row.file_id}-${index}`,
            name: file,
            type: `${row.file_type}-file`,
            table_id: row.file_id,
            label: row.file_type,
            color: "#004225",
            overview: "yes",
            section: "1",
            file_date: row.file_date,
          }))
        );
      });
      all_files_parent = (await Promise.all(all_files_promises)).flat();
      all_files_parent = all_files_parent.slice(0, 5);
    }
    res.status(200).json(all_files_parent);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/goal-detail/:gid", async (req, res) => {
  const { gid } = req.params;
  try {
    const [goal_detail] = await pool.execute("CALL file_itGoalDetail(?)", [gid]);
    res.status(200).json(goal_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/kpi-detail/:sid", async (req, res) => {
  const { sid } = req.params;
  try {
    const [kpi_detail] = await pool.execute("CALL file_itStrategyDetail(?)", [sid]);
    res.status(200).json(kpi_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/project-detail/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const [project_detail] = await pool.execute("CALL file_itProjectDetailPortfolio(?)", [pid]);
    res.status(200).json(project_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/project-files-detail/:pfile_id", async (req, res) => {
  const { pfile_id } = req.params;
  try {
    const [project_files_detail] = await pool.execute("CALL pfile_detailfile_it(?)", [pfile_id]);
    res.status(200).json(project_files_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/task-detail/:tid", async (req, res) => {
  const { tid } = req.params;
  try {
    const [task_detail] = await pool.execute("CALL file_itgetTaskById(?)", [tid]);
    res.status(200).json(task_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/subtask-detail/:stid", async (req, res) => {
  const { stid } = req.params;
  try {
    const [subtask_detail] = await pool.execute("CALL file_itcheck_subtask(?)", [stid]);
    res.status(200).json(subtask_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/department-detail/:deptId", async (req, res) => {
  const { deptId } = req.params;
  try {
    const [department_detail] = await pool.execute("CALL get_PDepartment(?)", [deptId]);
    res.status(200).json(department_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/goal-kpi-detail/:gid/:portfolio_dept_id/:portfolio_id", async (req, res) => {
  const { gid, portfolio_dept_id, portfolio_id } = req.params;
  try {
    const [goal_kpi_detail] = await pool.execute("CALL file_itStrategiesCountGoalWise(?,?,?)", [gid, portfolio_dept_id, portfolio_id]);
    res.status(200).json(goal_kpi_detail[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/kpi-project-detail/:reg_id/:sid/:portfolio_dept_id/:portfolio_id", async (req, res) => {
  const { reg_id, sid, portfolio_dept_id, portfolio_id } = req.params;
  try {
    const [project_detail] = await pool.execute("CALL file_itProjectsStrategyWise(?,?,?,?)", [reg_id, sid, portfolio_dept_id, portfolio_id]);
    const [aproject_detail] = await pool.execute("CALL file_itAcceptedProjectsStrategyWise(?,?,?,?)", [reg_id, sid, portfolio_dept_id, portfolio_id]);

    const kpi_project_detail = [...project_detail[0], ...aproject_detail[0]];
    res.status(200).json(kpi_project_detail);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/task-subtask-detail/:reg_id/:tid/:portfolio_dept_id/:portfolio_id", async (req, res) => {
  const { reg_id, tid, portfolio_dept_id, portfolio_id } = req.params;
  try {
    const [subtask_detail] = await pool.execute("CALL file_itSubtaskCountTaskWise(?,?,?,?)", [reg_id, tid, portfolio_dept_id, portfolio_id]);
    const [single_subtask_detail] = await pool.execute("CALL file_itSingleSubtaskCountTaskWise(?,?,?,?)", [reg_id, tid, portfolio_dept_id, portfolio_id]);
    const task_subtask_detail = [...subtask_detail[0], ...single_subtask_detail[0]];
    res.status(200).json(task_subtask_detail);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/portfolio-detail/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [portfolio_detail] = await pool.execute("CALL getPortfolioById(?)", [portfolio_id]);
    res.status(200).json(portfolio_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
