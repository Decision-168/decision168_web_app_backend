const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion } = require("../utils/common-functions");
const moment = require("moment");

//  Portfolio Task list
router.get("/task/portfolio-tasks-list/:portfolio_id", async (req, res) => {
    const { portfolio_id } = req.params;
    const { reg_id } = req.body;
    try {
      const [asssignedTasklistPortfolio] = await pool.execute("CALL AssignedTasklistPortfolio(?,?)", [portfolio_id, reg_id]);
      const [assignedSubtasklist_TaskPortfolio] = await pool.execute("CALL AssignedSubtasklist_TaskPortfolio(?,?)", [portfolio_id, reg_id]);
      const [assignedSubtasklistPortfolio] = await pool.execute("CALL AssignedSubtasklistPortfolio(?,?)", [portfolio_id, reg_id]);
      res.status(200).json({
        check_port_id: portfolio_id,
        AssignedTasklist: asssignedTasklistPortfolio[0],
        AssignedSubtasklist_Task: assignedSubtasklist_TaskPortfolio[0],
        AssignedSubtasklist: assignedSubtasklistPortfolio[0],
      });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/task/task-detail/:task_id", async (req, res) => {
    const { task_id } = req.params;
    try {
      const [taskDetail] = await pool.execute("CALL TaskDetail(?)", [task_id]);
      res.status(200).json({
        tdetail: taskDetail,
      });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/task/subtask-detail/:subtask_id", async (req, res) => {
    const { subtask_id } = req.params;
    try {
      const [subtaskDetail] = await pool.execute("CALL SubtaskDetail(?)", [subtask_id]);
      res.status(200).json({
        stdetail: subtaskDetail,
      });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/task/insert-task/:user_id", async (req, res) => {
    const { user_id, portfolio_id } = req.params;
    const { project_id, team_member2, links, link_comments, sid, gid, tname, tdes, tnote, tfile, tpriority, dept } = req.body;
    try {
      const [project_row] = await pool.execute("CALL getProjectById(?)", [project_id]);
      const [getMydetail] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = getMydetail[0][0];
      const formattedDate = dateConversion();
      const format = "Y-MM-DD H:m:s";
      if(student){
        if (moment(student.package_expiry, format, true).isValid()) {
          const expiryDate = new Date(student.package_expiry);
          const currentDate = new Date();
          if (expiryDate <= currentDate) {
            res.status(400).json({ error: "Package Expired." });
          } else {
            const [package] = await pool.execute("CALL getPackDetail(?)", [
              student.package_id,
            ]);
            const [task_count] = await pool.execute("CALL getProject_TaskCount(?)", [project_id]);
            if (package[0][0]) {
              const total_tasks = package[0][0].pack_tasks;
              const used_tasks = task_count[0][0].task_count_rows;
              const check_type = !isNaN(total_tasks);
              if (check_type) {
                if (used_tasks < total_tasks) {
                  const [team_member2_row] = await pool.execute("CALL getStudentById(?)", [team_member2]);
                  const links_string = links.join(',');
                  const link_comments_string = link_comments.join(',');
                  const tfile_string = tfile.join(',');

                  let get_tcode = '';
                  let pro_owner = '';
                  let pro_manager = '';
                  let pname = '';
                  let pdes = '';
                  let portfolio_owner_id = '';
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
                    portfolio_owner_id = check_Portfolio_owner_id[0][0].portfolio_createdby
                  } else {
                    const random_num = Math.floor(Math.random() * 10000) + 1;
                    get_tcode = `T-${random_num}`;
                  }

                  if(pro_owner != team_member2){
                    const [pdetail_member] = await pool.execute("CALL getMemberProject(?)", [project_id]);
                    let pro_member = [];
                    if(pdetail_member[0])
                    {
                      pdetail_member[0].forEach(async (pm) => {
                        pro_member.push(pm.pmember);
                      });
                    }
                    const check_mem = explode(',', $implode_pro_member); 
                    const index = check_mem.indexOf(team_member2);
                  }

                  if((pro_owner == user_id) || (pro_manager == user_id) || (portfolio_owner_id == user_id)){
                    if(pro_owner != team_member2){
                      if(index === -1){
                        const [check_if_suggested] = await pool.execute("CALL check_suggested(?,?)", [project_id,team_member2]); 
                        if(check_if_suggested[0][0])
                        {
                          const suggestTMFieldsValues = `status = 'approved', approve_date = '${formattedDate}'`;
                          const suggestTM1 = `tproject_assign = '${project_id}'`;
                          const suggestTM2 = `tproject_assign = '${team_member2}'`;
                          await pool.execute("CALL UpdateProjectSuggestedMembers(?,?,?)", [
                            suggestTMFieldsValues,
                            suggestTM1,
                            suggestTM2
                          ]);
                        }

                        const tmFieldsNames = "pid, portfolio_id, pmember, status, pcreated_by, sent_date, sent_notify_clear";
                        const tmFieldsValues = `"${project_id}", "${portfolio_id}", "${team_member2}", "send", "${user_id}", "${formattedDate}", "no"`;

                        await pool.execute("CALL InsertProjectMembers(?,?)", [
                          tmFieldsNames,
                          tmFieldsValues,
                        ]);

                        const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description";
                        const tmHistoryFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${student.first_name} ${student.last_name} sent team member request to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}"`;

                        await pool.execute("CALL InsertProjectHistory(?,?)", [
                          tmHistoryFieldsNames,
                          tmHistoryFieldsValues,
                        ]);

                        let get_portfolio_name = "";
                        const [check_portfolio_name] = await pool.execute("CALL getPortfolioName(?)", [portfolio_id]); 
                        if(check_portfolio_name)
                        {
                          if(check_portfolio_name[0][0].portfolio_user == 'individual')
                          { 
                            get_portfolio_name = `${check_portfolio_name[0][0].portfolio_name} ${check_portfolio_name[0][0].portfolio_lname}`;
                          }
                          else
                          { 
                            get_portfolio_name = check_portfolio_name[0][0].portfolio_name;
                          }
                        }

                        // EMAIL SECTION== == == === == === === ==== ==== == === === == === === ====

                      }
                    }
                  }else{
                    if(pro_owner != team_member2){
                      if(index === -1){
                        const [check] = await pool.execute("CALL check_suggested(?,?)", [project_id,team_member2]); 
                        const [check_pmem] = await pool.execute("CALL check_pro_member2(?,?)", [project_id,team_member2]); 

                        const tmFieldsNames = "pid, suggest_id, status, already_register, suggested_by, suggested_date";
                        const tmFieldsValues = `"${project_id}", "${team_member2}", "suggested", "yes", "${user_id}", "${formattedDate}"`;

                        await pool.execute("CALL InsertProjectSuggestedMembers(?,?)", [
                          tmFieldsNames,
                          tmFieldsValues,
                        ]);

                        const tmHistoryFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description";
                        const tmHistoryFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name} is suggested by ${student.first_name} ${student.last_name}"`;

                        await pool.execute("CALL InsertProjectHistory(?,?)", [
                          tmHistoryFieldsNames,
                          tmHistoryFieldsValues,
                        ]);                 
                      }
                    }
                  }

                  const taskFieldsNames = "tcode, tname, tdes, tlink, tlink_comment, tnote, tfile, tpriority, tstatus, tstatus_date, tproject_assign, portfolio_id, tassignee, tcreated_by, tcreated_date, tnotify, tnotify_clear, tnotify_date, tdue_date, tdue_date_clear, gid, sid, dept_id";
                  const taskFieldsValues = `${get_tcode}, ${tname}, ${tdes}, ${links_string}, ${link_comments_string}, ${tnote}, ${tfile_string}, ${tpriority}, 'to_do', ${formattedDate}, ${project_id}, ${portfolio_id}, ${team_member2}, ${user_id}, ${formattedDate}, 'yes', 'no', ${formattedDate}, ${formattedDate}, 'no', ${gid}, ${sid}, ${dept}`;

                  await pool.execute("CALL InsertTask(?,?)", [
                    taskFieldsNames,
                    taskFieldsValues,
                  ]);

                  const historyFieldsNames = "pid, gid, sid, h_date, h_resource_id, h_resource, h_description";
                  const historyFieldsValues = `"${project_id}", "${gid}", "${sid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Task Code: ${get_tcode}, Task Name: ${tname}", Created By ${student.first_name} ${student.last_name} and assigned to ${team_member2_row[0][0].first_name} ${team_member2_row[0][0].last_name}`;

                  await pool.execute("CALL InsertProjectHistory(?,?)", [
                    historyFieldsNames,
                    historyFieldsValues,
                  ]);  
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
      }
      res.status(200).json({
        stdetail: subtaskDetail,
      });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;