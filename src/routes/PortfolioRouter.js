require("dotenv").config();
const express = require("express");
const pool = require("../database/connection");
const { dateConversion, transporter } = require("../utils/common-functions");
const { isEmail } = require("validator");
const generateEmailTemplate = require("../utils/emailTemplate");
const router = express.Router();
//get_SideBar_Portfolio;
router.get("/portfolio/get-all-portfolio/:email_address", async (req, res) => {
  const { email_address } = req.params;
  try {
    const [rows] = await pool.execute("CALL get_SideBar_Portfolio(?)", [
      email_address,
    ]);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

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
    const { reg_id } = req.body;
    try {
      const [rows] = await pool.execute(
        "CALL get_portfolio_accepted_notification(?,?)",
        [pim_id, reg_id]
      );
      return res.status(200).json(rows[0]);
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
      const id = `pim_id  = '${pim_id}'`;
      const updateData = Object.entries(req.body)
        .map(([key, value]) => `${key} = "${value}"`)
        .join(", ");
      await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
        updateData,
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
    const [rows] = await pool.execute(
      "CALL check_PortfolioMemberActive(?, ?)",
      [sent_to, port_id]
    );
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.log(err);
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

//InsertPortfolio
router.post("/portfolio/insert-portfolio", async (req, res) => {
  try {
    let { email_address } = req.body;

    if (!isEmail(email_address)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    const formattedDate = dateConversion();
    const additionalFields = {
      portfolio_createddate: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...req.body,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertPortfolio(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Portfolio created successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//UpdateProjectPortfolio
router.patch("/portfolio/update-portfolio/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const updateData = Object.entries(req.body)
      .map(([key, value]) => `${key} = "${value}"`)
      .join(", ");
    const id = `portfolio_id  = '${portfolio_id}'`;
    await pool.execute("CALL UpdateProjectPortfolio(?, ?)", [updateData, id]);
    res.status(201).json({ message: "Portfolio updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//InsertProjectPortfolioDepartment;
router.post("/portfolio/insert-project-department", async (req, res) => {
  try {
    const formattedDate = dateConversion();
    const additionalFields = {
      createddate: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...req.body,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertProjectPortfolioDepartment(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Department added successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//UpdateProjectPortfolioDepartment
router.patch("/portfolio/update-project-department/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = Object.entries(req.body)
      .map(([key, value]) => `${key} = "${value}"`)
      .join(", ");
    const portfolio_dept_id = `portfolio_dept_id  = '${id}'`;
    await pool.execute("CALL UpdateProjectPortfolioDepartment(?, ?)", [
      updateData,
      portfolio_dept_id,
    ]);
    res.status(201).json({ message: "Department updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//UpdateProjectPortfolioMember
router.patch("/portfolio/update-project-member/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = Object.entries(req.body)
      .map(([key, value]) => `${key} = "${value}"`)
      .join(", ");
    const pim_id = `pim_id  = '${id}'`;
    await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
      updateData,
      pim_id,
    ]);
    res.status(201).json({ message: "Project member updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//InsertProjectPortfolioMember;
router.post("/portfolio/insert-project-member", async (req, res) => {
  try {
    let { portfolio_id, sent_to, sent_from } = req.body;

    if (!isEmail(sent_to)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const [checkEmail] = await pool.execute(
      "CALL checkPortfolioMemberEmail(?,?)",
      [sent_to, portfolio_id]
    );
    if (checkEmail[0]?.length > 0) {
      return res.status(400).json({ error: "Member Already Exist." });
    } else {
      const paramNamesString = Object.keys(req.body).join(", ");
      const paramValuesString = Object.values(req.body)
        .map((value) => `'${value}'`)
        .join(", ");
      const callProcedureSQL = `CALL InsertProjectPortfolioMember(?, ?)`;
      await pool.execute(callProcedureSQL, [
        paramNamesString,
        paramValuesString,
      ]);
      const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
        portfolio_id,
      ]);
      const PortfolioName = getPortfolio[0][0]?.portfolio_name;
      const [getPID] = await pool.execute(
        "CALL checkPortfolioMemberEmail(?,?)",
        [sent_to, portfolio_id]
      );
      const PIM_id = getPID[0][0]?.pim_id;

      const acceptRequest = `http://localhost:3000/portfolio-invite-request/${portfolio_id}/${PIM_id}/1`;
      const rejectRequest = `http://localhost:3000/portfolio-invite-request/${portfolio_id}/${PIM_id}/2`;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: sent_to,
        subject: "Portfolio Team Member Request | Decision 168",
        html: generateEmailTemplate(
          `Hello ${PortfolioName} has invited you to join ${PortfolioName} portfolio as a team member.
            Just click the appropriate button below to join the portfolio or request more information.`,
          `<a href="${acceptRequest}">JOIN THE TEAM</a> <a href="${rejectRequest}">DENY REQUEST</a>`
        ),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res
            .status(500)
            .json({ error: "Failed to send portfolio invitation email." });
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
});

//portfolio-invite-request
router.get(
  "/portfolio-invite-request/:portfolio_id/:pim_id/:flag",
  async (req, res) => {
    const { portfolio_id, pim_id, flag } = req.params;
    try {
      if (flag == 1) {
        const [getportd] = await pool.execute("CALL getPortfolioMember(?,?)", [
          pim_id,
          portfolio_id,
        ]);
        if (getportd[0].length > 0) {
          const email_address = getportd[0][0]?.sent_to;
          const status = getportd[0][0]?.status;
          const [check_if_registered] = await pool.execute(
            "CALL selectLogin(?)",
            [email_address]
          );
          if (status == "pending") {
            if (check_if_registered[0].length > 0) {
              const formattedDate = dateConversion();
              const dynamicFieldsValues = `status = 'accepted',
                     working_status = 'active',
                     status_date = '${formattedDate}',
                     status_notify = 'yes',
                     status_notify_clear = 'no'`;
              const id = `pim_id  = '${pim_id}'`;
              await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
                dynamicFieldsValues,
                id,
              ]);
              res.status(200).json({ user_status: "registered" });
            } else {
              res.status(400).json({ user_status: "not_registered." });
            }
          } else {
            res.status(400).json({ user_status: status });
          }
        } else {
          res.status(400).json({ user_status: "pages-404" });
        }
      } else if (flag == 2) {
        const [getportd] = await pool.execute("CALL getPortfolioMember(?,?)", [
          pim_id,
          portfolio_id,
        ]);
        if (getportd[0].length > 0) {
          const status = getportd[0][0]?.status;
          if (status == "pending") {
            const formattedDate = dateConversion();
            const dynamicFieldsValues = `status = 'rejected',status_date = '${formattedDate}'`;
            const id = `pim_id  = '${pim_id}'`;
            await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
              dynamicFieldsValues,
              id,
            ]);
            res.status(200).json({ user_status: "rejected_request" });
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

//change_portfolio_member_status
router.patch(
  "/user/change-portfolio-member-status/:pim_id/:portfolio_id",
  async (req, res) => {
    const pim_id = req.params.pim_id;
    const portfolio_id = req.params.portfolio_id;
    const status = req.body.status;
    try {
      const [check_ppm] = await pool.execute("CALL check_PPMToClear(?)", [
        pim_id,
      ]);
      const check = check_ppm[0][0];

      if (check) {
        if (status === "active") {
          const updateFieldsValues1 = `working_status = 'active'`;
          const upid = `pim_id  = '${pim_id}'`;
          await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
            updateFieldsValues1,
            upid,
          ]);

          res.status(200).json({ message: "status changed successfully" });
        }
        if (status === "inactive") {
          const [getpm] = await pool.execute("CALL selectLogin(?)", [
            check.sent_to,
          ]);
          const pm = getpm[0][0];
          if (pm) {
            const reg_id = pm.reg_id;

            const [getGoals] = await pool.execute("CALL TMOpenGoals(?,?)", [
              reg_id,
              portfolio_id,
            ]);
            let goal_count = 0;
            if (getGoals[0]) {
              goal_count = getGoals[0].length;
            }

            const [getGoalTM] = await pool.execute("CALL getGoalOpenTM(?,?)", [
              reg_id,
              portfolio_id,
            ]);
            let goal_tm_count = 0;
            if (getGoalTM[0]) {
              goal_tm_count = getGoalTM[0].length;
            }

            const [getStrategies] = await pool.execute(
              "CALL TMOpenStrategies(?,?)",
              [reg_id, portfolio_id]
            );
            let strategies_count = 0;
            if (getStrategies[0]) {
              strategies_count = getStrategies[0].length;
            }

            const [getProjects] = await pool.execute(
              "CALL TMOpenProjects(?,?)",
              [reg_id, portfolio_id]
            );
            let pro_count = 0;
            let only_pro_count = 0;
            if (getProjects[0]) {
              pro_count = getProjects[0].length;
              getProjects[0].forEach((gp) => {
                if (gp.pmanager !== reg_id && gp.pcreated_by === reg_id) {
                  only_pro_count++;
                } else if (
                  gp.pmanager === reg_id &&
                  gp.pcreated_by === reg_id
                ) {
                  only_pro_count++;
                }
              });
            }

            const [getTasks] = await pool.execute("CALL TMOpenTasks(?,?)", [
              reg_id,
              portfolio_id,
            ]);
            let task_count = 0;
            if (getTasks[0]) {
              task_count = getTasks[0].length;
            }

            const [getSubtasks] = await pool.execute(
              "CALL TMOpenSubtasks(?,?)",
              [reg_id, portfolio_id]
            );
            let subtask_count = 0;
            if (getSubtasks[0]) {
              subtask_count = getSubtasks[0].length;
            }

            const [getProjectTM] = await pool.execute(
              "CALL getProjectOpenTM(?,?)",
              [reg_id, portfolio_id]
            );
            let pro_tm_count = 0;
            if (getProjectTM[0]) {
              pro_tm_count = getProjectTM[0].length;
            }

            if (
              goal_count === 0 &&
              strategies_count === 0 &&
              pro_count === 0 &&
              task_count === 0 &&
              subtask_count === 0 &&
              pro_tm_count === 0 &&
              goal_tm_count === 0
            ) {
              const updateFieldsValues1 = `working_status = 'inactive'`;
              const upid = `pim_id  = '${pim_id}'`;
              await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
                updateFieldsValues1,
                upid,
              ]);

              res.status(200).json({ message: "status changed successfully" });
            } else {
              res.status(200).json({
                goal_countResult: goal_count,
                goal_tm_countResult: goal_tm_count,
                strategies_countResult: strategies_count,
                only_pro_countResult: only_pro_count,
                task_countResult: task_count,
                subtask_countResult: subtask_count,
                pro_tm_countResult: pro_tm_count,
              });
            }
          }
        }
      } else {
        res.status(200).json({ message: "member not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//open_work_new_assignee
router.patch(
  "/user/open-work-new-assignee/:reg_id/:new_reg_id/:old_reg_id/:pim_id/:portfolio_id",
  async (req, res) => {
    const reg_id = req.params.reg_id;
    const new_reg_id = req.params.new_reg_id;
    const old_reg_id = req.params.old_reg_id;
    const pim_id = req.params.pim_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [check_ppm] = await pool.execute("CALL check_PPMToClear(?)", [
        pim_id,
      ]);
      const check = check_ppm[0][0];

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

        const [getGoalsRes] = await pool.execute("CALL TMOpenGoals(?,?)", [
          old_reg_id,
          portfolio_id,
        ]);
        const getGoals = getGoalsRes[0];
        if (getGoals) {
          // console.log("getGoals",getGoals);
          for (const gg of getGoals) {
            if (gg.gcreated_by == old_reg_id) {
              const [checkIfGoalTM] = await pool.execute(
                "CALL TMOpenGoals(?,?)",
                [new_reg_id, gg.gid]
              );
              //console.log("checkIfGoalTM",checkIfGoalTM[0]);
              if (checkIfGoalTM[0]) {
                const del1 = `gmember = '${new_reg_id}' AND gid = '${gg.gid}'`;
                await pool.execute("CALL DeleteGoalsMembers(?)", [del1]);
              }

              const updateFieldsValues = `gcreated_by = '${new_reg_id}'`;
              const upid = `gid  = '${gg.gid}'`;
              await pool.execute("CALL UpdateGoals(?, ?)", [
                updateFieldsValues,
                upid,
              ]);

              const hdata = {
                gid: gg.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} Transfer Goal ${gg.gname} Ownership to ${new_mem.first_name} ${new_mem.last_name}`,
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

              const data2 = {
                gid: gg.gid,
                portfolio_id: portfolio_id,
                gmember: new_reg_id,
                status: "accepted",
                gcreated_by: new_reg_id,
                sent_date: formattedDate,
                sent_notify_clear: "yes",
              };

              const paramNamesString2 = Object.keys(data2).join(", ");
              const paramValuesString2 = Object.values(data2)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL2 = `CALL InsertGoalsMembers(?, ?)`;
              await pool.execute(callProcedureSQL2, [
                paramNamesString2,
                paramValuesString2,
              ]);
            }

            if (gg.gmanager == old_reg_id) {
              console.log("yes");
              const updateFieldsValues = `gmanager = '${new_reg_id}'`;
              const upid = `gid  = '${gg.gid}'`;
              await pool.execute("CALL UpdateGoals(?, ?)", [
                updateFieldsValues,
                upid,
              ]);

              const hdata = {
                gid: gg.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} Transfer Goal ${gg.gname} Manager to ${new_mem.first_name} ${new_mem.last_name}`,
              };
              const paramNamesString1 = Object.keys(hdata).join(", ");
              const paramValuesString1 = Object.values(hdata)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL = `CALL InsertProjectHistory(?, ?)`;
              await pool.execute(callProcedureSQL, [
                paramNamesString1,
                paramValuesString1,
              ]);
            }

            // Check if team member in any goal
            const [checkTM] = await pool.execute("CALL checkOpenGoalTM(?,?)", [
              old_reg_id,
              gg.gid,
            ]);

            if (checkTM[0][0]) {
              const del2 = `gmember = '${old_reg_id}' AND portfolio_id = '${portfolio_id}'`;
              await pool.execute("CALL DeleteGoalsMembers(?)", [del2]);
            }
          }
        }

        const [getGoalTMRes] = await pool.execute("CALL getGoalOpenTM(?,?)", [
          old_reg_id,
          portfolio_id,
        ]);
        const getGoalTM = getGoalTMRes[0];
        if (getGoalTM) {
          for (const ggtm of getGoalTM) {
            const [check_if_already_goaltmRes] = await pool.execute(
              "CALL check_if_already_goaltm(?,?,?)",
              [new_reg_id, ggtm.gid, portfolio_id]
            );

            const check_if_already_goaltm = check_if_already_goaltmRes[0];
            if (check_if_already_goaltm.length == 0) {
              const [check_if_goalownerRes] = await pool.execute(
                "CALL check_if_goalowner(?,?)",
                [new_reg_id, ggtm.gid]
              );

              const check_if_goalowner = check_if_goalownerRes[0];
              if (check_if_goalowner.length == 0) {
                const data2 = {
                  gid: ggtm.gid,
                  portfolio_id: portfolio_id,
                  gmember: new_reg_id,
                  status: ggtm.status,
                  gcreated_by: reg_id,
                  sent_date: formattedDate,
                  sent_notify_clear: ggtm.sent_notify_clear,
                };

                const paramNamesString2 = Object.keys(data2).join(", ");
                const paramValuesString2 = Object.values(data2)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL2 = `CALL InsertGoalsMembers(?, ?)`;
                await pool.execute(callProcedureSQL2, [
                  paramNamesString2,
                  paramValuesString2,
                ]);

                const hdata = {
                  gid: ggtm.gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${powner.first_name} ${powner.last_name} Added ${new_mem.first_name} ${new_mem.last_name} as a team member`,
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
              const del2 = `gmember = '${old_reg_id}' AND portfolio_id = '${portfolio_id}'`;
              await pool.execute("CALL DeleteGoalsMembers(?)", [del2]);
            }
          }
        }

        const [getStrategiesRes] = await pool.execute(
          "CALL TMOpenStrategies(?,?)",
          [old_reg_id, portfolio_id]
        );

        const getStrategies = getStrategiesRes[0];
        if (getStrategies) {
          for (const ggs of getStrategies) {
            const updateFieldsValues = `screated_by = '${new_reg_id}'`;
            const upid = `sid  = '${ggs.sid}'`;
            await pool.execute("CALL UpdateStrategies(?, ?)", [
              updateFieldsValues,
              upid,
            ]);
            const hdata = {
              gid: ggs.gid,
              sid: ggs.sid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `${powner.first_name} ${powner.last_name} Transfer KPI ${ggs.sname} Ownership to ${new_mem.first_name} ${new_mem.last_name}`,
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

        const [getProjectsRes] = await pool.execute(
          "CALL TMOpenProjects(?,?)",
          [old_reg_id, portfolio_id]
        );
        const getProjects = getProjectsRes[0];
        if (getProjects) {
          for (const gp of getProjects) {
            if (gp.pcreated_by == old_reg_id) {
              const [check_if_tm] = await pool.execute(
                "CALL TMOpenGoals(?,?)",
                [new_reg_id, gp.pid]
              );
              if (check_if_tm[0]) {
                const del1 = `pmember = '${new_reg_id}' AND pid = '${gp.pid}'`;
                await pool.execute("CALL DeleteProjectMembers(?)", [del1]);
              }

              const updateFieldsValues = `pcreated_by = '${new_reg_id}'`;
              const upid = `pid  = '${gp.pid}'`;
              await pool.execute("CALL UpdateProject(?, ?)", [
                updateFieldsValues,
                upid,
              ]);

              const hdata = {
                gid: gp.gid,
                sid: gp.sid,
                pid: gp.pid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} Transfer Project ${gp.gname} Ownership to ${new_mem.first_name} ${new_mem.last_name}`,
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
            if (gp.pmanager == old_reg_id) {
              const updateFieldsValues = `pmanager = '${new_reg_id}'`;
              const upid = `pid  = '${gp.pid}'`;
              await pool.execute("CALL UpdateProject(?, ?)", [
                updateFieldsValues,
                upid,
              ]);
              const hdata = {
                gid: gp.gid,
                sid: gp.sid,
                pid: gp.pid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} Transfer Project ${gp.gname} Manager to ${new_mem.first_name} ${new_mem.last_name}`,
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

            // Check if team member in any project
            const [checkTM] = await pool.execute("CALL CheckOpenTM(?,?)", [
              old_reg_id,
              gp.pid,
            ]);

            if (checkTM[0][0]) {
              const del2 = `pmember = '${old_reg_id}' AND portfolio_id = '${portfolio_id}'`;
              await pool.execute("CALL DeleteProjectMembers(?)", [del2]);
            }
          }
        }

        const [getProjectTMRes] = await pool.execute(
          "CALL getProjectOpenTM(?,?)",
          [old_reg_id, portfolio_id]
        );
        const getProjectTM = getProjectTMRes[0];
        if (getProjectTM) {
          for (const gtm of getProjectTM) {
            const [check_if_already_tmRes] = await pool.execute(
              "CALL check_if_already_tm(?,?,?)",
              [new_reg_id, gtm.pid, portfolio_id]
            );

            const check_if_already_tm = check_if_already_tmRes[0];
            if (check_if_already_tm.length == 0) {
              const [check_if_pownerRes] = await pool.execute(
                "CALL check_if_powner(?,?)",
                [new_reg_id, gtm.pid]
              );

              const check_if_powner = check_if_pownerRes[0];
              if (check_if_powner.length == 0) {
                const data2 = {
                  pid: gtm.pid,
                  portfolio_id: portfolio_id,
                  pmember: new_reg_id,
                  status: gtm.status,
                  pcreated_by: reg_id,
                  sent_date: formattedDate,
                  sent_notify_clear: gtm.sent_notify_clear,
                };

                const paramNamesString2 = Object.keys(data2).join(", ");
                const paramValuesString2 = Object.values(data2)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL2 = `CALL InsertProjectMembers(?, ?)`;
                await pool.execute(callProcedureSQL2, [
                  paramNamesString2,
                  paramValuesString2,
                ]);

                const hdata = {
                  gid: gtm.pid,
                  sid: gtm.sid,
                  pid: gtm.pid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${powner.first_name} ${powner.last_name} Added ${new_mem.first_name} ${new_mem.last_name} as a team member`,
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
              const del2 = `pmember = '${old_reg_id}' AND portfolio_id = '${portfolio_id}'`;
              await pool.execute("CALL DeleteProjectMembers(?)", [del2]);
            }
          }
        }

        const [getTasksRes] = await pool.execute("CALL TMOpenTasks(?,?)", [
          old_reg_id,
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
              gid: gt.gid,
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
          "CALL TMOpenSubtasks(?,?)",
          [old_reg_id, portfolio_id]
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
              gid: gs.gid,
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

        const updateFieldsValues1 = `working_status = 'inactive'`;
        const upid = `pim_id  = '${pim_id}'`;
        await pool.execute("CALL UpdateProjectPortfolioMember(?, ?)", [
          updateFieldsValues1,
          upid,
        ]);

        res.status(200).json({ message: "status changed successfully" });
      } else {
        res.status(200).json({ message: "member not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//get_SideBar_ALLPortfolio;
router.get("/portfolio/get-all-portfolios/:email_address", async (req, res) => {
  const { email_address } = req.params;
  try {
    const [rows] = await pool.execute("CALL get_SideBar_ALLPortfolio(?)", [
      email_address,
    ]);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//getPortfolioCount
router.get("/user/get-portfolio-count/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL getPortfolioCount(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//count_portfolio_project
router.get("/user/count-portfolio-project/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL count_portfolio_project(?)", [portfolio_id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//count_Portfolio_task
router.get("/user/count-portfolio-task/:portfolio_id", async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL count_Portfolio_task(?)", [portfolio_id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
