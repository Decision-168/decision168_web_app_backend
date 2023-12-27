const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const {
  convertObjectToProcedureParams,
  dateConversion,
  transporter,
} = require("../utils/common-functions");
const moment = require("moment");
const { default: isEmail } = require("validator/lib/isEmail");
const authMiddleware = require("../middlewares/auth");
const generateGoalRequestEmailTemplate = require("../utils/GoalRequestEmailTemp");
const generateGoalInviteRequestEmailTemplate = require("../utils/GoalInviteRequestEmailTemp");
const generateProjectRequestEmailTemplate = require("../utils/ProjectRequestEmailTemp");
const config = require("../../config");
// //GoalsList
// router.get("/goal/get-goals-list/:user_id/:portfolio_id", authMiddleware , async (req, res) => {
//   const user_id = req.params.user_id;
//   const portfolio_id = req.params.portfolio_id;
//   try {
//     const [rows, fields] = await pool.execute("CALL GoalsList(?,?)", [
//       user_id,
//       portfolio_id,
//     ]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //AcceptedGoalsAllList
// router.get(
//   "/goal/get-accepted-goals-list/:user_id/:portfolio_id",
//   authMiddleware , async (req, res) => {
//     const user_id = req.params.user_id;
//     const portfolio_id = req.params.portfolio_id;
//     try {
//       const [rows, fields] = await pool.execute(
//         "CALL AcceptedGoalsAllList(?,?)",
//         [user_id, portfolio_id]
//       );
//       res.status(200).json(rows[0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// //PendingGoalsAllList
// router.get(
//   "/goal/get-pending-goals-list/:user_id/:portfolio_id",
//   authMiddleware , async (req, res) => {
//     const user_id = req.params.user_id;
//     const portfolio_id = req.params.portfolio_id;
//     try {
//       const [rows, fields] = await pool.execute(
//         "CALL PendingGoalsAllList(?,?)",
//         [user_id, portfolio_id]
//       );
//       res.status(200).json(rows[0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// //ReadMoreGoalsAllList
// router.get(
//   "/goal/get-readmore-goals-list/:user_id/:portfolio_id",
//   authMiddleware , async (req, res) => {
//     const user_id = req.params.user_id;
//     const portfolio_id = req.params.portfolio_id;
//     try {
//       const [rows, fields] = await pool.execute(
//         "CALL ReadMoreGoalsAllList(?,?)",
//         [user_id, portfolio_id]
//       );
//       res.status(200).json(rows[0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

//AllGoalList
router.get(
  "/goal/get-all-goals-list/:user_id/:portfolio_id",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [createrows] = await pool.execute("CALL GoalsList(?,?)", [
        user_id,
        portfolio_id,
      ]);

      const createpromises = createrows[0].map(async (item) => {
        const { gid } = item;
        const [t_progress_done_rows] = await pool.execute(
          "CALL Goalprogress_done(?)",
          [gid]
        );

        const [t_progress_total_rows] = await pool.execute(
          "CALL Goalprogress_total(?)",
          [gid]
        );

        const [st_progress_done_rows] = await pool.execute(
          "CALL Goalsub_progress_done(?)",
          [gid]
        );

        const [st_progress_total_rows] = await pool.execute(
          "CALL Goalsub_progress_total(?)",
          [gid]
        );

        let progress = 0;
        let progress_done = t_progress_done_rows[0][0]?.count_rows;
        let progress_total = t_progress_total_rows[0][0]?.count_rows;
        let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
        let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

        if (progress_total || sub_progress_total) {
          let total_pro_progress_done = progress_done + sub_progress_done;
          let total_pro_progress = progress_total + sub_progress_total;
          const progressCal =
            (total_pro_progress_done / total_pro_progress) * 100;
          progress = Math.round(progressCal);
        }
        const type = "created-goals";
        const data = {
          ...item,
          progress,
          type,
        };
        return data;
      });
      const createresults = await Promise.all(createpromises);

      const [acceptedrows] = await pool.execute(
        "CALL AcceptedGoalsAllList(?,?)",
        [user_id, portfolio_id]
      );

      const acceptedpromises = acceptedrows[0].map(async (item) => {
        const { gid } = item;
        const [t_progress_done_rows] = await pool.execute(
          "CALL Goalprogress_done(?)",
          [gid]
        );

        const [t_progress_total_rows] = await pool.execute(
          "CALL Goalprogress_total(?)",
          [gid]
        );

        const [st_progress_done_rows] = await pool.execute(
          "CALL Goalsub_progress_done(?)",
          [gid]
        );

        const [st_progress_total_rows] = await pool.execute(
          "CALL Goalsub_progress_total(?)",
          [gid]
        );

        let progress = 0;
        let progress_done = t_progress_done_rows[0][0]?.count_rows;
        let progress_total = t_progress_total_rows[0][0]?.count_rows;
        let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
        let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

        if (progress_total || sub_progress_total) {
          let total_pro_progress_done = progress_done + sub_progress_done;
          let total_pro_progress = progress_total + sub_progress_total;
          const progressCal =
            (total_pro_progress_done / total_pro_progress) * 100;
          progress = Math.round(progressCal);
        }
        const type = "accepted-goals";
        const data = {
          ...item,
          progress,
          type,
        };
        return data;
      });
      const acceptedresults = await Promise.all(acceptedpromises);

      const [pendingrows] = await pool.execute(
        "CALL PendingGoalsAllList(?,?)",
        [user_id, portfolio_id]
      );
      const pendingpromises = pendingrows[0].map(async (item) => {
        const { gid } = item;
        const [t_progress_done_rows] = await pool.execute(
          "CALL Goalprogress_done(?)",
          [gid]
        );

        const [t_progress_total_rows] = await pool.execute(
          "CALL Goalprogress_total(?)",
          [gid]
        );

        const [st_progress_done_rows] = await pool.execute(
          "CALL Goalsub_progress_done(?)",
          [gid]
        );

        const [st_progress_total_rows] = await pool.execute(
          "CALL Goalsub_progress_total(?)",
          [gid]
        );

        let progress = 0;
        let progress_done = t_progress_done_rows[0][0]?.count_rows;
        let progress_total = t_progress_total_rows[0][0]?.count_rows;
        let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
        let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

        if (progress_total || sub_progress_total) {
          let total_pro_progress_done = progress_done + sub_progress_done;
          let total_pro_progress = progress_total + sub_progress_total;
          const progressCal =
            (total_pro_progress_done / total_pro_progress) * 100;
          progress = Math.round(progressCal);
        }
        const type = "pending-requests";
        const data = {
          ...item,
          progress,
          type,
        };
        return data;
      });
      const pendingresults = await Promise.all(pendingpromises);

      const [moreInforows] = await pool.execute(
        "CALL ReadMoreGoalsAllList(?,?)",
        [user_id, portfolio_id]
      );

      const moreInfopromises = moreInforows[0].map(async (item) => {
        const { gid } = item;
        const [t_progress_done_rows] = await pool.execute(
          "CALL Goalprogress_done(?)",
          [gid]
        );

        const [t_progress_total_rows] = await pool.execute(
          "CALL Goalprogress_total(?)",
          [gid]
        );

        const [st_progress_done_rows] = await pool.execute(
          "CALL Goalsub_progress_done(?)",
          [gid]
        );

        const [st_progress_total_rows] = await pool.execute(
          "CALL Goalsub_progress_total(?)",
          [gid]
        );

        let progress = 0;
        let progress_done = t_progress_done_rows[0][0]?.count_rows;
        let progress_total = t_progress_total_rows[0][0]?.count_rows;
        let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
        let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

        if (progress_total || sub_progress_total) {
          let total_pro_progress_done = progress_done + sub_progress_done;
          let total_pro_progress = progress_total + sub_progress_total;
          const progressCal =
            (total_pro_progress_done / total_pro_progress) * 100;
          progress = Math.round(progressCal);
        }
        const type = "more-info-requests";
        const data = {
          ...item,
          progress,
          type,
        };
        return data;
      });
      const moreInforesults = await Promise.all(moreInfopromises);

      res.status(200).json({
        createData: createresults,
        acceptedData: acceptedresults,
        pendingRequest: pendingresults,
        moreInfoRequest: moreInforesults,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//check_PortfolioMemberActive
router.get(
  "/goal/check-portfolio-member-active/:email_id/:portfolio_id",
  authMiddleware,
  async (req, res) => {
    const email_id = req.params.email_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute(
        "CALL check_PortfolioMemberActive(?,?)",
        [email_id, portfolio_id]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getGoalCount
router.get(
  "/goal/get-goal-count/:user_id/:portfolio_id",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute("CALL getGoalCount(?,?)", [
        user_id,
        portfolio_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//Goal_tasks
router.get("/goal/get-goal-tasks/:gid", authMiddleware, async (req, res) => {
  const gid = req.params.gid;
  try {
    const [rows, fields] = await pool.execute("CALL Goal_tasks(?)", [gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Goal_subtasks
router.get("/goal/get-goal-subtasks/:gid", authMiddleware, async (req, res) => {
  const gid = req.params.gid;
  try {
    const [rows, fields] = await pool.execute("CALL Goal_subtasks(?)", [gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// //Goalprogress_done
// router.get("/goal/get-goal-task-progress-done/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute("CALL Goalprogress_done(?)", [
//       gid,
//     ]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//Goalprogress_total
// router.get("/goal/get-goal-task-progress-total/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute("CALL Goalprogress_total(?)", [
//       gid,
//     ]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//Goalsub_progress_done
// router.get("/goal/get-goal-subtask-progress-done/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute("CALL Goalsub_progress_done(?)", [
//       gid,
//     ]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//Goalsub_progress_total
// router.get("/goal/get-goal-subtask-progress-total/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute(
//       "CALL Goalsub_progress_total(?)",
//       [gid]
//     );
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //GoalProgress
// router.get("/goal/get-goal-progress/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [t_progress_done_rows] = await pool.execute(
//       "CALL Goalprogress_done(?)",
//       [gid]
//     );

//     const [t_progress_total_rows] = await pool.execute(
//       "CALL Goalprogress_total(?)",
//       [gid]
//     );

//     const [st_progress_done_rows] = await pool.execute(
//       "CALL Goalsub_progress_done(?)",
//       [gid]
//     );

//     const [st_progress_total_rows] = await pool.execute(
//       "CALL Goalsub_progress_total(?)",
//       [gid]
//     );

//     let progressRes = 0;
//     let progress_done = t_progress_done_rows[0][0]?.count_rows;
//     let progress_total = t_progress_total_rows[0][0]?.count_rows;
//     let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
//     let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

//     if (progress_total || sub_progress_total) {
//       let total_pro_progress_done = progress_done + sub_progress_done;
//       let total_pro_progress = progress_total + sub_progress_total;
//       const progressCal = (total_pro_progress_done / total_pro_progress) * 100;
//       progressRes = Math.round(progressCal);
//     }

//     res.status(200).json({ progress: progressRes });
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//getStrategiesCount
router.get(
  "/goal/get-strategies-count/:user_id/:gid/:portfolio_id",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const gid = req.params.gid;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute(
        "CALL getStrategiesCount(?,?,?)",
        [user_id, gid, portfolio_id]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//InsertGoals
router.post("/goal/insert-goal", authMiddleware, async (req, res) => {
  try {
    let { portfolio_id } = req.body;
    let { gcreated_by } = req.body;
    let { gname } = req.body;
    const { team_member, imemail, ...otherFields } = req.body;

    const formattedDate = dateConversion();
    const additionalFields = {
      gcreated_date: formattedDate,
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

    const callProcedureSQL = `CALL InsertGoals(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);
    const [getGoal] = await pool.execute("CALL GetInsertedGoal(?,?)", [
      gcreated_by,
      portfolio_id,
    ]);
    const gid = getGoal[0][0]?.gid;
    const gmanager = getGoal[0][0]?.gmanager;
    const gdept = getGoal[0][0]?.gdept;
    const get_gdes = getGoal[0][0]?.gdes;

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      gcreated_by,
    ]);
    const powner = check_powner[0][0];

    const data2 = {
      gid: gid,
      portfolio_id: portfolio_id,
      gmember: gcreated_by,
      status: `accepted`,
      gcreated_by: gcreated_by,
      sent_date: formattedDate,
      sent_notify_clear: `yes`,
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
      gid: gid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Goal Created By ${powner.first_name} ${powner.last_name}`,
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

    if (gmanager != 0) {
      if (gmanager != gcreated_by) {
        const data3 = {
          gid: gid,
          portfolio_id: portfolio_id,
          gmember: gmanager,
          status: `send`,
          gcreated_by: gcreated_by,
          sent_date: formattedDate,
          sent_notify_clear: `no`,
        };

        const paramNamesString3 = Object.keys(data3).join(", ");
        const paramValuesString3 = Object.values(data3)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL3 = `CALL InsertGoalsMembers(?, ?)`;
        await pool.execute(callProcedureSQL3, [
          paramNamesString3,
          paramValuesString3,
        ]);

        const [check_user] = await pool.execute("CALL getStudentById(?)", [
          gmanager,
        ]);
        const user = check_user[0][0];

        const [getgmid] = await pool.execute("CALL check_GoalMToClear(?,?)", [
          gid,
          gmanager,
        ]);
        const gmid = getgmid[0][0]?.gmid;

        const hdata4 = {
          gid: gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} sent goal manager request to ${user.first_name} ${user.last_name}`,
          gmember_id: gmid,
        };

        const paramNamesString4 = Object.keys(hdata4).join(", ");
        const paramValuesString4 = Object.values(hdata4)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL4 = `CALL InsertProjectHistory(?, ?)`;
        await pool.execute(callProcedureSQL4, [
          paramNamesString4,
          paramValuesString4,
        ]);

        const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
          portfolio_id,
        ]);
        const PortfolioName = getPortfolio[0][0]?.portfolio_name;
        const userFName = `${user.first_name} ${user.last_name}`;
        const pownerFName = `${powner.first_name} ${powner.last_name}`;
        const short_gdes = get_gdes.substring(0, 100);
        const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
        const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
        const position = "manager";
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: user.email_address,
          subject: "Goal Request | Decision 168",
          html: generateGoalRequestEmailTemplate(
            userFName,
            pownerFName,
            gname,
            PortfolioName,
            short_gdes,
            acceptRequest,
            rejectRequest,
            position
          ),
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(500).json({ error: "Failed to send invitation." });
          } else {
            res.status(201).json({
              message: "Invitation sent successfully.",
            });
          }
        });
      }
    }

    if (team_member && team_member.length > 0) {
      // Use forEach with async/await
      await Promise.all(
        team_member.map(async (t) => {
          const data5 = {
            gid: gid,
            portfolio_id: portfolio_id,
            gmember: t,
            status: `send`,
            gcreated_by: gcreated_by,
            sent_date: formattedDate,
            sent_notify_clear: `no`,
          };

          const paramNamesString5 = Object.keys(data5).join(", ");
          const paramValuesString5 = Object.values(data5)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
          await pool.execute(callProcedureSQL5, [
            paramNamesString5,
            paramValuesString5,
          ]);

          const [check_user] = await pool.execute("CALL getStudentById(?)", [
            t,
          ]);
          const user = check_user[0][0];

          const [getgmid] = await pool.execute("CALL check_GoalMToClear(?,?)", [
            gid,
            t,
          ]);
          const gmid = getgmid[0][0]?.gmid;

          const hdata6 = {
            gid: gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
            gmember_id: gmid,
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

          const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
            portfolio_id,
          ]);
          const PortfolioName = getPortfolio[0][0]?.portfolio_name;
          const userFName = `${user.first_name} ${user.last_name}`;
          const pownerFName = `${powner.first_name} ${powner.last_name}`;
          const short_gdes = get_gdes.substring(0, 100);
          const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
          const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
          const position = "team member";
          const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email_address,
            subject: "Goal Request | Decision 168",
            html: generateGoalRequestEmailTemplate(
              userFName,
              pownerFName,
              gname,
              PortfolioName,
              short_gdes,
              acceptRequest,
              rejectRequest,
              position
            ),
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              res.status(500).json({ error: "Failed to send invitation." });
            } else {
              res.status(201).json({
                message: "Invitation sent successfully.",
              });
            }
          });
        })
      );
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
            const [check_Goal_members] = await pool.execute(
              "CALL check_GoalMToClear(?,?)",
              [gid, rid]
            );
            if (check_Goal_members[0].length == 0) {
              if (gcreated_by != rid) {
                const data7 = {
                  gid: gid,
                  portfolio_id: portfolio_id,
                  gmember: rid,
                  status: `send`,
                  gcreated_by: gcreated_by,
                  sent_date: formattedDate,
                  sent_notify_clear: `no`,
                };

                const paramNamesString7 = Object.keys(data7).join(", ");
                const paramValuesString7 = Object.values(data7)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL7 = `CALL InsertGoalsMembers(?, ?)`;
                await pool.execute(callProcedureSQL7, [
                  paramNamesString7,
                  paramValuesString7,
                ]);

                const [getportfolio] = await pool.execute(
                  "CALL check_PortfolioMember(?,?)",
                  [im, portfolio_id]
                );
                if (getportfolio[0].length == 0) {
                  const dataPort = {
                    portfolio_id: portfolio_id,
                    sent_to: im,
                    sent_from: gcreated_by,
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

                const [check_user] = await pool.execute(
                  "CALL getStudentById(?)",
                  [rid]
                );
                const user = check_user[0][0];

                const [getgmid] = await pool.execute(
                  "CALL check_GoalMToClear(?,?)",
                  [gid, rid]
                );
                const gmid = getgmid[0][0]?.gmid;

                const hdata8 = {
                  gid: gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
                  gmember_id: gmid,
                };

                const paramNamesString8 = Object.keys(hdata8).join(", ");
                const paramValuesString8 = Object.values(hdata8)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL8 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL8, [
                  paramNamesString8,
                  paramValuesString8,
                ]);

                const [getPortfolio] = await pool.execute(
                  "CALL getPortfolio2(?)",
                  [portfolio_id]
                );
                const PortfolioName = getPortfolio[0][0]?.portfolio_name;
                const userFName = `${user.first_name} ${user.last_name}`;
                const pownerFName = `${powner.first_name} ${powner.last_name}`;
                const short_gdes = get_gdes.substring(0, 100);
                const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
                const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
                const position = "team member";
                const mailOptions = {
                  from: process.env.SMTP_USER,
                  to: user.email_address,
                  subject: "Goal Request | Decision 168",
                  html: generateGoalRequestEmailTemplate(
                    userFName,
                    pownerFName,
                    gname,
                    PortfolioName,
                    short_gdes,
                    acceptRequest,
                    rejectRequest,
                    position
                  ),
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    res.status(500).json({
                      error: "Failed to send invitation.",
                    });
                  } else {
                    res.status(201).json({
                      message: "Invitation sent successfully.",
                    });
                  }
                });
              }
            }
          } else {
            const [check_email] = await pool.execute(
              "CALL check_goal_invited_email(?,?,?)",
              [im, gcreated_by, gid]
            );
            if (check_email[0].length == 0) {
              const data9 = {
                gid: gid,
                sent_from: gcreated_by,
                sent_to: im,
                status: `pending`,
                invite_date: formattedDate,
              };

              const paramNamesString9 = Object.keys(data9).join(", ");
              const paramValuesString9 = Object.values(data9)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL9 = `CALL InsertGoalsInvitedMembers(?, ?)`;
              await pool.execute(callProcedureSQL9, [
                paramNamesString9,
                paramValuesString9,
              ]);

              const [getportfolio] = await pool.execute(
                "CALL check_PortfolioMember(?,?)",
                [im, portfolio_id]
              );
              if (getportfolio[0].length == 0) {
                const dataPort = {
                  portfolio_id: portfolio_id,
                  sent_to: im,
                  sent_from: gcreated_by,
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

              const [getigm_id] = await pool.execute(
                "CALL check_goal_invited_email(?,?,?)",
                [im, gcreated_by, gid]
              );

              const igm_id = getigm_id[0][0]?.igm_id;

              const hdata10 = {
                gid: gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent invite to ${im}`,
                ginvited_id: igm_id,
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

              const [getPortfolio] = await pool.execute(
                "CALL getPortfolio2(?)",
                [portfolio_id]
              );
              const PortfolioName = getPortfolio[0][0]?.portfolio_name;
              const pownerFName = `${powner.first_name} ${powner.last_name}`;
              const short_gdes = get_gdes.substring(0, 100);
              const acceptRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/1`;
              const rejectRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/2`;
              const position = "team member";
              const mailOptions = {
                from: process.env.SMTP_USER,
                to: im,
                subject: "Goal Request | Decision 168",
                html: generateGoalInviteRequestEmailTemplate(
                  pownerFName,
                  gname,
                  PortfolioName,
                  short_gdes,
                  acceptRequest,
                  rejectRequest,
                  position
                ),
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send invitation.",
                  });
                } else {
                  res.status(201).json({
                    message: "Invitation sent successfully.",
                  });
                }
              });
            }
          }
        })
      );
    }

    res.status(201).json({
      message: "Goal created successfully.",
      gid: gid,
      gdept: gdept,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//goal-request
router.get(
  "/goal-request/:gid/:gmid/:flag",
  authMiddleware,
  async (req, res) => {
    const { gid, gmid, flag } = req.params;
    try {
      const formattedDate = dateConversion();

      if (flag == 1) {
        const [result] = await pool.execute("CALL check_GoalPMToClear(?)", [
          gmid,
        ]);
        if (result[0].length > 0) {
          const status = result[0][0]?.status;

          const [rows] = await pool.execute("CALL getStudentById(?)", [
            result[0][0]?.gmember,
          ]);

          if (status == "send" || status == "read_more") {
            const dynamicFieldsValues = `status = 'accepted',
                         status_date = '${formattedDate}',
                         status_notify = 'yes',
                         status_notify_clear = 'no'`;
            const id = `gmid  = '${gmid}'`;
            await pool.execute("CALL UpdateGoalsMembers(?, ?)", [
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
              gid: gid,
              h_date: formattedDate,
              h_resource_id: rows[0][0]?.reg_id,
              h_resource: `${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
              h_description: `Team Member Request Accepted By ${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
              gmember_id: gmid,
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
          } else if (status === "accepted") {
            res.status(200).json({ user_status: "already_accepted" });
          } else {
            res.status(200).json({ user_status: status });
          }
        } else {
          res.status(400).json({ user_status: "pages-404" });
        }
      } else if (flag == 2) {
        const [result] = await pool.execute("CALL check_GoalPMToClear(?)", [
          gmid,
        ]);
        if (result[0].length > 0) {
          const status = result[0][0]?.status;

          const [rows] = await pool.execute("CALL getStudentById(?)", [
            result[0][0]?.gmember,
          ]);

          if (status == "send") {
            const dynamicFieldsValues = `status = 'read_more',
                         status_date = '${formattedDate}'`;
            const id = `gmid  = '${gmid}'`;
            await pool.execute("CALL UpdateGoalsMembers(?, ?)", [
              dynamicFieldsValues,
              id,
            ]);

            const hdata = {
              gid: gid,
              h_date: formattedDate,
              h_resource_id: rows[0][0]?.reg_id,
              h_resource: `${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
              h_description: `Goal More Request By ${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`,
              gmember_id: gmid,
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
          } else if (status === "read_more") {
            res.status(200).json({ user_status: "already_read_more" });
          } else {
            res.status(200).json({ user_status: status });
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

//goal-invite-reject-request
router.get(
  "/goal-invite-reject-request/:gid/:igm_id/:flag",
  authMiddleware,
  async (req, res) => {
    const { gid, igm_id, flag } = req.params;
    try {
      const formattedDate = dateConversion();
      if (flag == 1) {
        res.status(200).json({ user_status: "registration" });
      }
      if (flag == 2) {
        const [result] = await pool.execute(
          "CALL check_goal_invite_request(?)",
          [igm_id]
        );
        if (result[0].length > 0) {
          const status = result[0][0]?.status;

          if (status == "pending") {
            const dynamicFieldsValues = `status = 'rejected',
                         accept_date = '${formattedDate}'`;
            const id = `igm_id  = '${igm_id}'`;
            await pool.execute("CALL UpdateGoalsInvitedMembers(?, ?)", [
              dynamicFieldsValues,
              id,
            ]);

            const hdata = {
              gid: gid,
              h_date: formattedDate,
              h_resource: `${result[0][0]?.sent_to}`,
              h_description: `Invite Rejected By ${result[0][0]?.sent_to}`,
              ginvited_id: igm_id,
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
          } else if (status === "rejected") {
            res.status(200).json({ user_status: "already_rejected" });
          } else {
            res.status(200).json({ user_status: status });
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

//InsertStrategies
router.post("/goal/insert-strategies", authMiddleware, async (req, res) => {
  try {
    const formattedDate = dateConversion();
    const screated_by = req.body.screated_by;
    const portfolio_id = req.body.portfolio_id;
    const gid = req.body.gid;
    const gdept_id = req.body.gdept_id;
    const { kpiArray } = req.body;

    for (const kpi of kpiArray) {
      const sname = kpi.sname;
      const sdes = kpi.sdes;

      const additionalFields = {
        screated_date: formattedDate,
        sprogress: "to_do",
      };

      const requestBodyWithAdditionalFields = {
        sname,
        sdes,
        screated_by,
        portfolio_id,
        gid,
        gdept_id,
        ...additionalFields,
      };

      const paramNamesString = Object.keys(
        requestBodyWithAdditionalFields
      ).join(", ");
      const paramValuesString = Object.values(requestBodyWithAdditionalFields)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL = `CALL InsertStrategies(?, ?)`;
      await pool.execute(callProcedureSQL, [
        paramNamesString,
        paramValuesString,
      ]);

      const [getKPI] = await pool.execute("CALL GetInsertedKPI(?,?)", [
        gid,
        screated_by,
      ]);
      const sid = getKPI[0][0]?.sid;

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        screated_by,
      ]);
      const powner = check_powner[0][0];
      const hdata = {
        sid: sid,
        gid: gid,
        h_date: formattedDate,
        h_resource_id: powner.reg_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `KPI Created By ${powner.first_name} ${powner.last_name}`,
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

    res.status(201).json({
      message: "KPI created successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//goal-overview-request
router.get(
  "/goal/goal-overview-request/:user_id/:gid",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute("CALL GoalDetailRequest(?,?)", [
        user_id,
        gid,
      ]);
      const [getDeptName] = await pool.execute("CALL get_PDepartment(?)", [
        rows[0][0].gdept,
      ]);
      const get_dept_name = getDeptName[0][0].department;

      const [getCreatedByName] = await pool.execute("CALL getStudentById(?)", [
        rows[0][0].gcreated_by,
      ]);
      const get_created_by_name =
        getCreatedByName[0][0].first_name +
        " " +
        getCreatedByName[0][0].last_name;

      let get_gmanager_name = "";
      if (rows[0][0].gmanager != 0) {
        const [getManagerName] = await pool.execute("CALL getStudentById(?)", [
          rows[0][0].gmanager,
        ]);
        get_gmanager_name =
          getManagerName[0][0].first_name +
          " " +
          getManagerName[0][0].last_name;
      }

      const results = {
        ...rows[0][0],
        get_dept_name,
        get_created_by_name,
        get_gmanager_name,
      };

      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getGoalMemberDetailbyGID
router.get(
  "/goal/goal-member-detail/:user_id/:gid",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL getGoalMemberDetailbyGID(?,?)",
        [user_id, gid]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//get_PDepartment
router.get(
  "/goal/get-department-name/:dept_id",
  authMiddleware,
  async (req, res) => {
    const dept_id = req.params.dept_id;
    try {
      const [rows, fields] = await pool.execute("CALL get_PDepartment(?)", [
        dept_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// GoalTeamMember
// router.get("/goal/goal-team-member/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute("CALL GoalTeamMember(?)", [gid]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //InvitedGoalMember
// router.get("/goal/goal-invited-member/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute("CALL InvitedGoalMember(?)", [
//       gid,
//     ]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//GoalsAllStrategiesList
router.get(
  "/goal/goal-all-strategies-list/:gid",
  authMiddleware,
  async (req, res) => {
    const gid = req.params.gid;
    try {
      const [GoalRows] = await pool.execute("CALL GoalDetail(?)", [gid]);
      const [rows] = await pool.execute("CALL GoalsAllStrategiesList(?)", [
        gid,
      ]);
      const promises = rows[0].map(async (item) => {
        const { sid } = item;

        const [kpi_t_progress_done_rows] = await pool.execute(
          "CALL Strategyprogress_done(?)",
          [sid]
        );

        const [kpi_t_progress_total_rows] = await pool.execute(
          "CALL Strategyprogress_total(?)",
          [sid]
        );

        const [kpi_st_progress_done_rows] = await pool.execute(
          "CALL Strategysub_progress_done(?)",
          [sid]
        );

        const [kpi_st_progress_total_rows] = await pool.execute(
          "CALL Strategysub_progress_total(?)",
          [sid]
        );

        let kpi_progress = 0;
        let kpi_progress_done = kpi_t_progress_done_rows[0][0]?.count_rows;
        let kpi_progress_total = kpi_t_progress_total_rows[0][0]?.count_rows;
        let kpi_sub_progress_done = kpi_st_progress_done_rows[0][0]?.count_rows;
        let kpi_sub_progress_total =
          kpi_st_progress_total_rows[0][0]?.count_rows;

        if (kpi_progress_total || kpi_sub_progress_total) {
          let kpi_total_pro_progress_done =
            kpi_progress_done + kpi_sub_progress_done;
          let kpi_total_pro_progress =
            kpi_progress_total + kpi_sub_progress_total;
          const kpi_progressCal =
            (kpi_total_pro_progress_done / kpi_total_pro_progress) * 100;
          kpi_progress = Math.round(kpi_progressCal);
        }

        const data = {
          ...item,
          kpi_progress,
        };
        return data;
      });
      const results = await Promise.all(promises);
      res.status(200).json({ goalRes: GoalRows[0][0], listResults: results });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//GoalDetail
router.get("/goal/goal-detail/:gid", authMiddleware, async (req, res) => {
  const gid = req.params.gid;
  try {
    const [rows] = await pool.execute("CALL GoalDetail(?)", [gid]); //yeh wali

    const [getDeptName] = await pool.execute("CALL get_PDepartment(?)", [
      rows[0][0].gdept,
    ]);
    const get_dept_name = getDeptName[0][0].department;

    const [getCreatedByName] = await pool.execute("CALL getStudentById(?)", [
      rows[0][0].gcreated_by,
    ]);
    const get_created_by_name =
      getCreatedByName[0][0].first_name +
      " " +
      getCreatedByName[0][0].last_name;

    let get_gmanager_name = "";
    if (rows[0][0].gmanager != 0) {
      const [getManagerName] = await pool.execute("CALL getStudentById(?)", [
        rows[0][0].gmanager,
      ]);
      get_gmanager_name =
        getManagerName[0][0].first_name + " " + getManagerName[0][0].last_name;
    }

    const [t_progress_done_rows] = await pool.execute(
      "CALL Goalprogress_done(?)",
      [gid]
    );

    const [t_progress_total_rows] = await pool.execute(
      "CALL Goalprogress_total(?)",
      [gid]
    );

    const [st_progress_done_rows] = await pool.execute(
      "CALL Goalsub_progress_done(?)",
      [gid]
    );

    const [st_progress_total_rows] = await pool.execute(
      "CALL Goalsub_progress_total(?)",
      [gid]
    );

    let progress = 0;
    let progress_done = t_progress_done_rows[0][0]?.count_rows;
    let progress_total = t_progress_total_rows[0][0]?.count_rows;
    let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
    let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

    if (progress_total || sub_progress_total) {
      let total_pro_progress_done = progress_done + sub_progress_done;
      let total_pro_progress = progress_total + sub_progress_total;
      const progressCal = (total_pro_progress_done / total_pro_progress) * 100;
      progress = Math.round(progressCal);
    }

    const [get_portfolio] = await pool.execute("CALL getPortfolio2(?)", [
      rows[0][0].portfolio_id,
    ]);
    const get_portfolio_createdby_id = get_portfolio[0][0]?.portfolio_createdby;

    const results = {
      ...rows[0][0],
      get_dept_name,
      get_created_by_name,
      get_gmanager_name,
      get_portfolio_createdby_id,
      progress,
    };

    const [GoalTeamMember] = await pool.execute("CALL GoalTeamMember(?)", [
      gid,
    ]);
    const [InvitedGoalMember] = await pool.execute(
      "CALL InvitedGoalMember(?)",
      [gid]
    );
    const [SuggestedGoalMember] = await pool.execute(
      "CALL SuggestedGoalMember(?)",
      [gid]
    );

    const [SuggestedInviteGoalMember] = await pool.execute(
      "CALL SuggestedInviteGoalMember(?)",
      [gid]
    );

    const [GoalsAllStrategiesList] = await pool.execute(
      "CALL GoalsAllStrategiesList(?)",
      [gid]
    );

    const promises = GoalsAllStrategiesList[0].map(async (item) => {
      const { sid } = item;

      const [kpi_t_progress_done_rows] = await pool.execute(
        "CALL Strategyprogress_done(?)",
        [sid]
      );

      const [kpi_t_progress_total_rows] = await pool.execute(
        "CALL Strategyprogress_total(?)",
        [sid]
      );

      const [kpi_st_progress_done_rows] = await pool.execute(
        "CALL Strategysub_progress_done(?)",
        [sid]
      );

      const [kpi_st_progress_total_rows] = await pool.execute(
        "CALL Strategysub_progress_total(?)",
        [sid]
      );

      let kpi_progress = 0;
      let kpi_progress_done = kpi_t_progress_done_rows[0][0]?.count_rows;
      let kpi_progress_total = kpi_t_progress_total_rows[0][0]?.count_rows;
      let kpi_sub_progress_done = kpi_st_progress_done_rows[0][0]?.count_rows;
      let kpi_sub_progress_total = kpi_st_progress_total_rows[0][0]?.count_rows;

      if (kpi_progress_total || kpi_sub_progress_total) {
        let kpi_total_pro_progress_done =
          kpi_progress_done + kpi_sub_progress_done;
        let kpi_total_pro_progress =
          kpi_progress_total + kpi_sub_progress_total;
        const kpi_progressCal =
          (kpi_total_pro_progress_done / kpi_total_pro_progress) * 100;
        kpi_progress = Math.round(kpi_progressCal);
      }

      const data = {
        ...item,
        kpi_progress,
      };
      return data;
    });
    const GoalsAllStrategiesListDetails = await Promise.all(promises);

    res.status(200).json({
      goalRes: results,
      GoalTeamMemberRes: GoalTeamMember[0],
      InvitedGoalMemberRes: InvitedGoalMember[0],
      SuggestedGoalMemberRes: SuggestedGoalMember[0],
      SuggestedInviteGoalMemberRes: SuggestedInviteGoalMember[0],
      GoalsAllStrategiesListRes: GoalsAllStrategiesListDetails,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//view_history_date_goal
router.get(
  "/goal/view-history-date-goal/:gid",
  authMiddleware,
  async (req, res) => {
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_history_date_goal(?)",
        [gid]
      );
      const [GoalDetail] = await pool.execute("CALL GoalDetail(?)", [gid]);
      const [get_portfolio] = await pool.execute("CALL getPortfolio2(?)", [
        GoalDetail[0][0].portfolio_id,
      ]);

      const get_portfolio_createdby_id =
        get_portfolio[0][0]?.portfolio_createdby;

      const results = {
        ...GoalDetail[0][0],
        get_portfolio_createdby_id,
      };

      res.status(200).json({ history_dates: rows[0], goal_detail: results });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//GoalDetailAccepted
router.get(
  "/goal/goal-detail-accepted/:user_id/:gid",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL GoalDetailAccepted(?,?)",
        [user_id, gid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getStrategiesCount
// router.get(
//   "/goal/get-strategies-count/:user_id/:gid/:portfolio_id",
//   authMiddleware , async (req, res) => {
//     const user_id = req.params.user_id;
//     const gid = req.params.gid;
//     const portfolio_id = req.params.portfolio_id;
//     try {
//       const [rows, fields] = await pool.execute(
//         "CALL getStrategiesCount(?,?,?)",
//         [user_id, gid, portfolio_id]
//       );
//       res.status(200).json(rows[0][0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

//file_itStrategy_tasks
router.get(
  "/goal/file-it-strategy-tasks/:sid",
  authMiddleware,
  async (req, res) => {
    const sid = req.params.sid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL file_itStrategy_tasks(?)",
        [sid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//file_itStrategy_subtasks
router.get(
  "/goal/file-it-strategy-subtasks/:sid",
  authMiddleware,
  async (req, res) => {
    const sid = req.params.sid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL file_itStrategy_subtasks(?)",
        [sid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// //Strategyprogress_done
// router.get("/goal/get-strategy-task-progress-done/:sid", authMiddleware , async (req, res) => {
//   const sid = req.params.sid;
//   try {
//     const [rows, fields] = await pool.execute("CALL Strategyprogress_done(?)", [
//       sid,
//     ]);
//     res.status(200).json(rows[0][0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //Strategyprogress_total
// router.get("/goal/get-strategy-task-progress-total/:sid", authMiddleware , async (req, res) => {
//   const sid = req.params.sid;
//   try {
//     const [rows, fields] = await pool.execute(
//       "CALL Strategyprogress_total(?)",
//       [sid]
//     );
//     res.status(200).json(rows[0][0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //Strategysub_progress_done
// router.get(
//   "/goal/get-strategy-subtask-progress-done/:sid",
//   authMiddleware , async (req, res) => {
//     const sid = req.params.sid;
//     try {
//       const [rows, fields] = await pool.execute(
//         "CALL Strategysub_progress_done(?)",
//         [sid]
//       );
//       res.status(200).json(rows[0][0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// //Strategysub_progress_total
// router.get(
//   "/goal/get-strategy-subtask-progress-total/:sid",
//   authMiddleware , async (req, res) => {
//     const sid = req.params.sid;
//     try {
//       const [rows, fields] = await pool.execute(
//         "CALL Strategysub_progress_total(?)",
//         [sid]
//       );
//       res.status(200).json(rows[0][0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// //StrategyProgress
// router.get("/goal/get-strategy-progress/:sid", authMiddleware , async (req, res) => {
//   const sid = req.params.sid;
//   try {
//     const [t_progress_done_rows] = await pool.execute(
//       "CALL Strategyprogress_done(?)",
//       [sid]
//     );

//     const [t_progress_total_rows] = await pool.execute(
//       "CALL Strategyprogress_total(?)",
//       [sid]
//     );

//     const [st_progress_done_rows] = await pool.execute(
//       "CALL Strategysub_progress_done(?)",
//       [sid]
//     );

//     const [st_progress_total_rows] = await pool.execute(
//       "CALL Strategysub_progress_total(?)",
//       [sid]
//     );

//     let progressRes = 0;
//     let progress_done = t_progress_done_rows[0][0]?.count_rows;
//     let progress_total = t_progress_total_rows[0][0]?.count_rows;
//     let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
//     let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

//     if (progress_total || sub_progress_total) {
//       let total_pro_progress_done = progress_done + sub_progress_done;
//       let total_pro_progress = progress_total + sub_progress_total;
//       const progressCal = (total_pro_progress_done / total_pro_progress) * 100;
//       progressRes = Math.round(progressCal);
//     }

//     res.status(200).json({ progress: progressRes });
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//StrategyAllProjectsList
router.get(
  "/goal/get-strategy-all-projects-list/:sid",
  authMiddleware,
  async (req, res) => {
    const sid = req.params.sid;
    try {
      const [rows] = await pool.execute("CALL StrategyAllProjectsList(?)", [
        sid,
      ]);

      const promises = rows[0].map(async (item) => {
        const { pid } = item;

        const [t_progress_done_rows] = await pool.execute(
          "CALL progress_done(?)",
          [pid]
        );

        const [t_progress_total_rows] = await pool.execute(
          "CALL progress_total(?)",
          [pid]
        );

        const [st_progress_done_rows] = await pool.execute(
          "CALL sub_progress_done(?)",
          [pid]
        );

        const [st_progress_total_rows] = await pool.execute(
          "CALL sub_progress_total(?)",
          [pid]
        );

        let progressRes = 0;
        let progress_done = t_progress_done_rows[0][0]?.count_rows;
        let progress_total = t_progress_total_rows[0][0]?.count_rows;
        let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
        let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

        if (progress_total || sub_progress_total) {
          let total_pro_progress_done = progress_done + sub_progress_done;
          let total_pro_progress = progress_total + sub_progress_total;
          const progressCal =
            (total_pro_progress_done / total_pro_progress) * 100;
          progressRes = Math.round(progressCal);
        }

        const data = {
          ...item,
          progressRes,
        };
        return data;
      });
      const results = await Promise.all(promises);
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//p_tasks
router.get("/goal/get-project-tasks/:pid", authMiddleware, async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows, fields] = await pool.execute("CALL p_tasks(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//p_subtasks
router.get(
  "/goal/get-project-subtasks/:pid",
  authMiddleware,
  async (req, res) => {
    const pid = req.params.pid;
    try {
      const [rows, fields] = await pool.execute("CALL p_subtasks(?)", [pid]);
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// //progress_done
// router.get("/goal/get-project-task-progress-done/:pid", authMiddleware , async (req, res) => {
//   const pid = req.params.pid;
//   try {
//     const [rows, fields] = await pool.execute("CALL progress_done(?)", [pid]);
//     res.status(200).json(rows[0][0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //progress_total
// router.get("/goal/get-project-task-progress-total/:pid", authMiddleware , async (req, res) => {
//   const pid = req.params.pid;
//   try {
//     const [rows, fields] = await pool.execute("CALL progress_total(?)", [pid]);
//     res.status(200).json(rows[0][0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //sub_progress_done
// router.get("/goal/get-project-subtask-progress-done/:pid", authMiddleware , async (req, res) => {
//   const pid = req.params.pid;
//   try {
//     const [rows, fields] = await pool.execute("CALL sub_progress_done(?)", [
//       pid,
//     ]);
//     res.status(200).json(rows[0][0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //sub_progress_total
// router.get(
//   "/goal/get-project-subtask-progress-total/:pid",
//   authMiddleware , async (req, res) => {
//     const pid = req.params.pid;
//     try {
//       const [rows, fields] = await pool.execute("CALL sub_progress_total(?)", [
//         pid,
//       ]);
//       res.status(200).json(rows[0][0]);
//     } catch (error) {
//
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// //ProjectProgress
// router.get("/goal/get-project-progress/:pid", authMiddleware , async (req, res) => {
//   const pid = req.params.pid;
//   try {
//     const [t_progress_done_rows] = await pool.execute("CALL progress_done(?)", [
//       pid,
//     ]);

//     const [t_progress_total_rows] = await pool.execute(
//       "CALL progress_total(?)",
//       [pid]
//     );

//     const [st_progress_done_rows] = await pool.execute(
//       "CALL sub_progress_done(?)",
//       [pid]
//     );

//     const [st_progress_total_rows] = await pool.execute(
//       "CALL sub_progress_total(?)",
//       [pid]
//     );

//     let progressRes = 0;
//     let progress_done = t_progress_done_rows[0][0]?.count_rows;
//     let progress_total = t_progress_total_rows[0][0]?.count_rows;
//     let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
//     let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

//     if (progress_total || sub_progress_total) {
//       let total_pro_progress_done = progress_done + sub_progress_done;
//       let total_pro_progress = progress_total + sub_progress_total;
//       const progressCal = (total_pro_progress_done / total_pro_progress) * 100;
//       progressRes = Math.round(progressCal);
//     }

//     res.status(200).json({ progress: progressRes });
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//CheckProjectTeamMember
router.get(
  "/goal/check-project-team-member/:user_id/:pid",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const pid = req.params.pid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL CheckProjectTeamMember(?,?)",
        [user_id, pid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getProjectCount
router.get(
  "/goal/get-project-count/:user_id/:portfolio_id",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute("CALL getProjectCount(?,?)", [
        user_id,
        portfolio_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//check_notify_goal_suggested
router.get(
  "/goal/check-notify-goal-suggested/:gid",
  authMiddleware,
  async (req, res) => {
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL check_notify_goal_suggested(?)",
        [gid]
      );
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// //SuggestedGoalMember
// router.get("/goal/goal-suggested-member/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute("CALL SuggestedGoalMember(?)", [
//       gid,
//     ]);
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //SuggestedInviteGoalMember
// router.get("/goal/goal-suggested-invite-member/:gid", authMiddleware , async (req, res) => {
//   const gid = req.params.gid;
//   try {
//     const [rows, fields] = await pool.execute(
//       "CALL SuggestedInviteGoalMember(?)",
//       [gid]
//     );
//     res.status(200).json(rows[0]);
//   } catch (error) {
//
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//getAccepted_PortTM_GoalList
router.get(
  "/goal/get-all-accepted-portfolio-team-member-goal-list/:portfolio_id/:gid",
  authMiddleware,
  async (req, res) => {
    const { portfolio_id, gid } = req.params;
    try {
      const [rows] = await pool.execute("CALL getAccepted_PortTM(?)", [
        portfolio_id,
      ]);
      const promises = rows[0].map(async (item) => {
        const { sent_to } = item;

        const [getName] = await pool.execute("CALL selectLogin(?)", [sent_to]);
        let data;
        if (getName && getName[0] && getName[0][0]) {
          let check_gmem = "";
          const [check_gmRes] = await pool.execute("CALL check_gm(?,?,?)", [
            getName[0][0].reg_id,
            gid,
            portfolio_id,
          ]);
          if (check_gmRes.length > 0 && check_gmRes[0] && check_gmRes[0][0]) {
            check_gmem = check_gmRes[0][0].gmember;
          }
          if (getName[0][0].reg_id != check_gmem) {
            const name =
              getName[0][0].first_name + " " + getName[0][0].last_name;
            const id = getName[0][0].reg_id;
            data = {
              sent_to,
              name,
              id,
            };
          }
        }
        return data;
      });

      const results = await Promise.all(promises);
      return res.status(200).json(results.filter(Boolean));
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//check_gm
router.get(
  "/goal/check-gm/:user_id/:gid/:portfolio_id",
  authMiddleware,
  async (req, res) => {
    const user_id = req.params.user_id;
    const gid = req.params.gid;
    const portfolio_id = req.params.portfolio_id;
    try {
      const [rows, fields] = await pool.execute("CALL check_gm(?,?,?)", [
        user_id,
        gid,
        portfolio_id,
      ]);
      res.status(200).json(rows[0][0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//getProjectById
router.get("/goal/get-project-by-id/:pid", authMiddleware, async (req, res) => {
  const pid = req.params.pid;
  try {
    const [rows, fields] = await pool.execute("CALL getProjectById(?)", [pid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//UpdateGoals
router.patch("/goal/update-goal", authMiddleware, async (req, res) => {
  try {
    let { gname } = req.body;
    let { gid } = req.body;
    let { gdept } = req.body;
    let { gcreated_by } = req.body;
    const { team_member, imemail, ...otherFields } = req.body;

    const formattedDate = dateConversion();

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL UpdateGoals('${formattedParams}', 'gid = ${gid}')`;

    await pool.execute(storedProcedure);

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      gcreated_by,
    ]);
    const powner = check_powner[0][0];

    const hdata = {
      gid: gid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Goal Edited By ${powner.first_name} ${powner.last_name}`,
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

    //all strategies to update
    const [g_strategiesRes] = await pool.execute(
      "CALL GoalsAllStrategiesList_to_delete(?)",
      [gid]
    );
    const g_strategies = g_strategiesRes[0];

    if (g_strategies && g_strategies.length > 0) {
      for (const gs of g_strategies) {
        const updateFieldsValues1 = `gdept_id = '${gdept}'`;
        const upid = `sid  = '${gs.sid}'`;
        await pool.execute("CALL UpdateStrategies(?, ?)", [
          updateFieldsValues1,
          upid,
        ]);

        //all projects to update
        const [s_projectsRes] = await pool.execute(
          "CALL StrategyAllProjectsList_to_delete(?)",
          [gs.sid]
        );
        const s_projects = s_projectsRes[0];

        if (s_projects && s_projects.length > 0) {
          for (const sp of s_projects) {
            //project
            const updateFieldsValues2 = `dept_id = '${gdept}'`;
            const upid2 = `pid  = '${sp.pid}'`;
            await pool.execute("CALL UpdateProject(?, ?)", [
              updateFieldsValues2,
              upid2,
            ]);

            //project tasks
            const updateFieldsValues3 = `dept_id = '${gdept}'`;
            const upid3 = `tproject_assign  = '${sp.pid}'`;
            await pool.execute("CALL UpdateTask(?, ?)", [
              updateFieldsValues3,
              upid3,
            ]);

            //project subtasks
            const updateFieldsValues4 = `dept_id = '${gdept}'`;
            const upid4 = `stproject_assign  = '${sp.pid}'`;
            await pool.execute("CALL UpdateSubtask(?, ?)", [
              updateFieldsValues4,
              upid4,
            ]);
          }
        }
      }
    }

    const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
    const gdetail = gdetailRes[0][0];

    const [ptmRes] = await pool.execute("CALL GoalTeamMember(?)", [gid]);
    const ptm = ptmRes[0];

    const [check_Portfolio_owner_id] = await pool.execute(
      "CALL getPortfolio2(?)",
      [gdetail.portfolio_id]
    );
    const PortfolioName = check_Portfolio_owner_id[0][0]?.portfolio_name;

    let portfolio_owner_id = "";
    if (check_Portfolio_owner_id && check_Portfolio_owner_id.length > 0) {
      portfolio_owner_id = check_Portfolio_owner_id[0][0]?.portfolio_createdby;
    }

    if (team_member && team_member.length > 0) {
      const all_ptm = [];

      if (ptm) {
        ptm.forEach((all_tm) => {
          if (all_tm.gmember !== gdetail.gcreated_by) {
            all_ptm.push(all_tm.gmember);
          }
        });
      }

      const no_more_mem = all_ptm.filter(
        (member) => !team_member.includes(member)
      );

      for (const no_mem of no_more_mem) {
        if (
          gdetail.gcreated_by == gcreated_by ||
          portfolio_owner_id == gcreated_by
        ) {
          if (gdetail.gmanager == no_mem) {
            const updateFieldsValues2 = `gmanager = ''`;
            const upid = `gid  = '${gid}'`;
            await pool.execute("CALL UpdateGoals(?, ?)", [
              updateFieldsValues2,
              upid,
            ]);

            const del1 = `gmember = '${no_mem}' AND gid = '${gid}'`;
            await pool.execute("CALL DeleteGoalsMembers(?)", [del1]);
          } else {
            if (gdetail.gmanager != no_mem) {
              if (gdetail.portfolio_owner_id != no_mem) {
                if (gdetail.gcreated_by != no_mem) {
                  const del2 = `gmember = '${no_mem}' AND gid = '${gid}'`;
                  await pool.execute("CALL DeleteGoalsMembers(?)", [del2]);
                }
              }
            }
          }
        }
      }

      await Promise.all(
        team_member.map(async (t) => {
          const [check_Goal_members] = await pool.execute(
            "CALL check_GoalMToClear(?,?)",
            [gid, t]
          );
          if (check_Goal_members[0].length == 0) {
            const data5 = {
              gid: gid,
              portfolio_id: gdetail.portfolio_id,
              gmember: t,
              status: `send`,
              gcreated_by: gcreated_by,
              sent_date: formattedDate,
              sent_notify_clear: `no`,
            };

            const paramNamesString5 = Object.keys(data5).join(", ");
            const paramValuesString5 = Object.values(data5)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
            await pool.execute(callProcedureSQL5, [
              paramNamesString5,
              paramValuesString5,
            ]);

            const [check_user] = await pool.execute("CALL getStudentById(?)", [
              t,
            ]);
            const user = check_user[0][0];

            const [getgmid] = await pool.execute(
              "CALL check_GoalMToClear(?,?)",
              [gid, t]
            );
            const gmid = getgmid[0][0]?.gmid;

            const hdata6 = {
              gid: gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
              gmember_id: gmid,
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
            const userFName = `${user.first_name} ${user.last_name}`;
            const pownerFName = `${powner.first_name} ${powner.last_name}`;
            const get_gdes = gdetail.gdes;
            const short_gdes = get_gdes.substring(0, 100);
            const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
            const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
            const position = "team member";
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: user.email_address,
              subject: "Goal Request | Decision 168",
              html: generateGoalRequestEmailTemplate(
                userFName,
                pownerFName,
                gname,
                PortfolioName,
                short_gdes,
                acceptRequest,
                rejectRequest,
                position
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send invitation.",
                });
              } else {
                res.status(201).json({
                  message: "Invitation sent successfully.",
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
          if (all_tm.gmember !== gdetail.gcreated_by) {
            all_ptm.push(all_tm.gmember);
          }
        });
      }

      const no_more_mem = all_ptm.filter(
        (member) => !team_member.includes(member)
      );

      for (const no_mem of no_more_mem) {
        if (
          gdetail.gcreated_by == gcreated_by ||
          portfolio_owner_id == gcreated_by
        ) {
          if (gdetail.gmanager == no_mem) {
            const updateFieldsValues2 = `gmanager = ''`;
            const upid = `gid  = '${gid}'`;
            await pool.execute("CALL UpdateGoals(?, ?)", [
              updateFieldsValues2,
              upid,
            ]);

            const del1 = `gmember = '${no_mem}' AND gid = '${gid}'`;
            await pool.execute("CALL DeleteGoalsMembers(?)", [del1]);
          } else {
            if (gdetail.gmanager != no_mem) {
              if (gdetail.portfolio_owner_id != no_mem) {
                if (gdetail.gcreated_by != no_mem) {
                  const del2 = `gmember = '${no_mem}' AND gid = '${gid}'`;
                  await pool.execute("CALL DeleteGoalsMembers(?)", [del2]);
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
            const [check_Goal_members] = await pool.execute(
              "CALL check_GoalMToClear(?,?)",
              [gid, rid]
            );
            if (check_Goal_members[0].length == 0) {
              if (gcreated_by != rid) {
                const data7 = {
                  gid: gid,
                  portfolio_id: gdetail.portfolio_id,
                  gmember: rid,
                  status: `send`,
                  gcreated_by: gcreated_by,
                  sent_date: formattedDate,
                  sent_notify_clear: `no`,
                };

                const paramNamesString7 = Object.keys(data7).join(", ");
                const paramValuesString7 = Object.values(data7)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL7 = `CALL InsertGoalsMembers(?, ?)`;
                await pool.execute(callProcedureSQL7, [
                  paramNamesString7,
                  paramValuesString7,
                ]);

                const [getportfolio] = await pool.execute(
                  "CALL check_PortfolioMember(?,?)",
                  [im, gdetail.portfolio_id]
                );
                if (getportfolio[0].length == 0) {
                  const dataPort = {
                    portfolio_id: gdetail.portfolio_id,
                    sent_to: im,
                    sent_from: gcreated_by,
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

                const [check_user] = await pool.execute(
                  "CALL getStudentById(?)",
                  [rid]
                );
                const user = check_user[0][0];

                const [getgmid] = await pool.execute(
                  "CALL check_GoalMToClear(?,?)",
                  [gid, rid]
                );
                const gmid = getgmid[0][0]?.gmid;

                const hdata8 = {
                  gid: gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
                  gmember_id: gmid,
                };

                const paramNamesString8 = Object.keys(hdata8).join(", ");
                const paramValuesString8 = Object.values(hdata8)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL8 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL8, [
                  paramNamesString8,
                  paramValuesString8,
                ]);
                const userFName = `${user.first_name} ${user.last_name}`;
                const pownerFName = `${powner.first_name} ${powner.last_name}`;
                const get_gdes = gdetail.gdes;
                const short_gdes = get_gdes.substring(0, 100);
                const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
                const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
                const position = "team member";
                const mailOptions = {
                  from: process.env.SMTP_USER,
                  to: user.email_address,
                  subject: "Goal Request | Decision 168",
                  html: generateGoalRequestEmailTemplate(
                    userFName,
                    pownerFName,
                    gname,
                    PortfolioName,
                    short_gdes,
                    acceptRequest,
                    rejectRequest,
                    position
                  ),
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    res.status(500).json({
                      error: "Failed to send invitation.",
                    });
                  } else {
                    res.status(201).json({
                      message: "Invitation sent successfully.",
                    });
                  }
                });
              }
            }
          } else {
            const [check_email] = await pool.execute(
              "CALL check_goal_invited_email(?,?,?)",
              [im, gcreated_by, gid]
            );
            if (check_email[0].length == 0) {
              const data9 = {
                gid: gid,
                sent_from: gcreated_by,
                sent_to: im,
                status: `pending`,
                invite_date: formattedDate,
              };

              const paramNamesString9 = Object.keys(data9).join(", ");
              const paramValuesString9 = Object.values(data9)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL9 = `CALL InsertGoalsInvitedMembers(?, ?)`;
              await pool.execute(callProcedureSQL9, [
                paramNamesString9,
                paramValuesString9,
              ]);

              const [getportfolio] = await pool.execute(
                "CALL check_PortfolioMember(?,?)",
                [im, gdetail.portfolio_id]
              );
              if (getportfolio[0].length == 0) {
                const dataPort = {
                  portfolio_id: gdetail.portfolio_id,
                  sent_to: im,
                  sent_from: gcreated_by,
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

              const [getigm_id] = await pool.execute(
                "CALL check_goal_invited_email(?,?,?)",
                [im, gcreated_by, gid]
              );

              const igm_id = getigm_id[0][0]?.igm_id;

              const hdata10 = {
                gid: gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent invite to ${im}`,
                ginvited_id: igm_id,
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
              const pownerFName = `${powner.first_name} ${powner.last_name}`;
              const get_gdes = gdetail.gdes;
              const short_gdes = get_gdes.substring(0, 100);
              const acceptRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/1`;
              const rejectRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/2`;
              const position = "team member";
              const mailOptions = {
                from: process.env.SMTP_USER,
                to: im,
                subject: "Goal Request | Decision 168",
                html: generateGoalInviteRequestEmailTemplate(
                  pownerFName,
                  gdetail.gname,
                  PortfolioName,
                  short_gdes,
                  acceptRequest,
                  rejectRequest,
                  position
                ),
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send invitation.",
                  });
                } else {
                  res.status(201).json({
                    message: "Invitation sent successfully.",
                  });
                }
              });
            }
          }
        })
      );
    }

    res.status(201).json({
      message: "Goal updated successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//DuplicateGoal
router.post("/goal/duplicate-goal", authMiddleware, async (req, res) => {
  try {
    let { gcreated_by } = req.body;
    let { gname } = req.body;
    const { gid, copy_detail, cust_goal, ...otherFields } = req.body;

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      gcreated_by,
    ]);
    const powner = check_powner[0][0];

    const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
    const gdetail = gdetailRes[0][0];

    let gmanager = "";
    if (copy_detail == "everything") {
      gmanager = gdetail.gmanager;
    }

    const formattedDate = dateConversion();
    const additionalFields = {
      gdept: gdetail.gdept,
      gdes: gdetail.gdes,
      gmanager: gmanager,
      portfolio_id: gdetail.portfolio_id,
      gcreated_date: formattedDate,
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

    const callProcedureSQL = `CALL InsertGoals(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [getdupGoal] = await pool.execute("CALL GetInsertedGoal(?,?)", [
      gcreated_by,
      gdetail.portfolio_id,
    ]);

    const getGoal = getdupGoal[0][0];

    const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
      getGoal.portfolio_id,
    ]);
    const PortfolioName = getPortfolio[0][0]?.portfolio_name;

    const hdata = {
      gid: getGoal.gid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `Goal Created By ${powner.first_name} ${powner.last_name}`,
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

    const data5 = {
      gid: getGoal.gid,
      portfolio_id: getGoal.portfolio_id,
      gmember: gcreated_by,
      status: "accepted",
      gcreated_by: gcreated_by,
      sent_date: formattedDate,
      sent_notify_clear: `yes`,
    };

    const paramNamesString5 = Object.keys(data5).join(", ");
    const paramValuesString5 = Object.values(data5)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
    await pool.execute(callProcedureSQL5, [
      paramNamesString5,
      paramValuesString5,
    ]);

    if (copy_detail == "everything") {
      //Check Project Members
      const [getMemberGoalRes] = await pool.execute("CALL getMemberGoal(?)", [
        gid,
      ]);
      const getMemberGoal = getMemberGoalRes[0];

      if (getMemberGoal && getMemberGoal.length > 0) {
        await Promise.all(
          getMemberGoal.map(async (t) => {
            if (gcreated_by != t.gmember) {
              const data5 = {
                gid: getGoal.gid,
                portfolio_id: getGoal.portfolio_id,
                gmember: t.gmember,
                status: `send`,
                gcreated_by: gcreated_by,
                sent_date: formattedDate,
                sent_notify_clear: `no`,
              };

              const paramNamesString5 = Object.keys(data5).join(", ");
              const paramValuesString5 = Object.values(data5)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
              await pool.execute(callProcedureSQL5, [
                paramNamesString5,
                paramValuesString5,
              ]);

              const [check_user] = await pool.execute(
                "CALL getStudentById(?)",
                [t.gmember]
              );
              const user = check_user[0][0];

              const [getgmid] = await pool.execute(
                "CALL check_GoalMToClear(?,?)",
                [getGoal.gid, t.gmember]
              );
              const gmid = getgmid[0][0]?.gmid;

              const hdata6 = {
                gid: getGoal.gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
                gmember_id: gmid,
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
              const userFName = `${user.first_name} ${user.last_name}`;
              const pownerFName = `${powner.first_name} ${powner.last_name}`;
              const get_gdes = getGoal.gdes;
              const short_gdes = get_gdes.substring(0, 100);
              const acceptRequest = `${config.verificationLink}goal-request/${getGoal.gid}/${gmid}/1`;
              const rejectRequest = `${config.verificationLink}goal-request/${getGoal.gid}/${gmid}/2`;
              const position = "team member";
              const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.email_address,
                subject: "Goal Request | Decision 168",
                html: generateGoalRequestEmailTemplate(
                  userFName,
                  pownerFName,
                  gname,
                  PortfolioName,
                  short_gdes,
                  acceptRequest,
                  rejectRequest,
                  position
                ),
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send invitation.",
                  });
                } else {
                  res.status(201).json({
                    message: "Invitation sent successfully.",
                  });
                }
              });
            }
          })
        );
      }

      //strategies
      const [g_strategiesRes] = await pool.execute(
        "CALL GoalsAllStrategiesListASC(?)",
        [gid]
      );
      const g_strategies = g_strategiesRes[0];
      if (g_strategies && g_strategies.length > 0) {
        for (const gs of g_strategies) {
          const insertStrategiesFields = {
            sname: gs.sname,
            sdes: gs.sdes,
            screated_by: gcreated_by,
            screated_date: formattedDate,
            sprogress: "to_do",
            portfolio_id: getGoal.portfolio_id,
            gid: getGoal.gid,
            gdept_id: getGoal.gdept,
          };

          const paramNamesString = Object.keys(insertStrategiesFields).join(
            ", "
          );
          const paramValuesString = Object.values(insertStrategiesFields)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL = `CALL InsertStrategies(?, ?)`;
          await pool.execute(callProcedureSQL, [
            paramNamesString,
            paramValuesString,
          ]);

          const [getKPIRes] = await pool.execute("CALL GetInsertedKPI(?,?)", [
            getGoal.gid,
            gcreated_by,
          ]);
          const getKPI = getKPIRes[0][0];

          const hdata = {
            sid: getKPI.sid,
            gid: getGoal.gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `KPI Created By ${powner.first_name} ${powner.last_name}`,
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

          //projects
          const [s_projectsRes] = await pool.execute(
            "CALL StrategyAllProjectsListASC(?)",
            [gs.sid]
          );
          const s_projects = s_projectsRes[0];

          if (s_projects && s_projects.length > 0) {
            for (const sp of s_projects) {
              const insertProjectFields = {
                gid: getGoal.gid,
                sid: getKPI.sid,
                ptype: sp.ptype,
                p_publish: sp.p_publish,
                pname: sp.pname,
                pdes: sp.pdes,
                plink: sp.plink,
                plink_comment: sp.plink_comment,
                pmanager: sp.pmanager,
                pcreated_by: gcreated_by,
                pcreated_date: formattedDate,
                portfolio_id: getGoal.portfolio_id,
                dept_id: getGoal.gdept,
              };

              const paramNamesString =
                Object.keys(insertProjectFields).join(", ");
              const paramValuesString = Object.values(insertProjectFields)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL = `CALL InsertProject(?, ?)`;
              await pool.execute(callProcedureSQL, [
                paramNamesString,
                paramValuesString,
              ]);

              const [getProjectRes] = await pool.execute(
                "CALL GetInsertedProject(?)",
                [gcreated_by]
              );
              const getProject = getProjectRes[0][0];

              const hdata = {
                pid: getProject.pid,
                sid: getKPI.sid,
                gid: getGoal.gid,
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

              //Check Project Members
              const [getMemberProjectRes] = await pool.execute(
                "CALL getMemberProject(?)",
                [sp.pid]
              );
              const getMemberProject = getMemberProjectRes[0];
              if (getMemberProject && getMemberProject.length > 0) {
                for (const pm of getMemberProject) {
                  const data7 = {
                    pid: getProject.pid,
                    portfolio_id: getGoal.portfolio_id,
                    pmember: pm.pmember,
                    status: "send",
                    pcreated_by: gcreated_by,
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

                  const [check_user] = await pool.execute(
                    "CALL getStudentById(?)",
                    [pm.pmember]
                  );
                  const user = check_user[0][0];

                  const [getpm_id] = await pool.execute(
                    "CALL check_ProjectMToClear(?,?)",
                    [pm.pmember, getProject.pid]
                  );
                  const pm_id = getpm_id[0][0]?.pm_id;

                  const hdata6 = {
                    pid: getProject.pid,
                    sid: getKPI.sid,
                    gid: getGoal.gid,
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

                  const userFName = `${user.first_name} ${user.last_name}`;
                  const pownerFName = `${powner.first_name} ${powner.last_name}`;
                  const get_pdes = getProject.pdes;
                  const short_pdes = get_pdes.substring(0, 100);
                  const acceptRequest = `${config.verificationLink}project-request/${getProject.pid}/${pm_id}/1`;
                  const rejectRequest = `${config.verificationLink}project-request/${getProject.pid}/${pm_id}/2`;

                  if (pm.pmember == sp.pmanager) {
                    const position = "manager";
                    const mailOptions2 = {
                      from: process.env.SMTP_USER,
                      to: user.email_address,
                      subject: "Project Request | Decision 168",
                      html: generateProjectRequestEmailTemplate(
                        userFName,
                        pownerFName,
                        sp.pname,
                        PortfolioName,
                        short_pdes,
                        acceptRequest,
                        rejectRequest,
                        position
                      ),
                    };

                    transporter.sendMail(mailOptions2, (error, info) => {
                      if (error) {
                        res.status(500).json({
                          error: "Failed to send invitation.",
                        });
                      } else {
                        res.status(201).json({
                          message: "Project invitation sent to your email.",
                        });
                      }
                    });
                  } else {
                    const position = "team member";
                    const mailOptions2 = {
                      from: process.env.SMTP_USER,
                      to: user.email_address,
                      subject: "Project Request | Decision 168",
                      html: generateProjectRequestEmailTemplate(
                        userFName,
                        pownerFName,
                        sp.pname,
                        PortfolioName,
                        short_pdes,
                        acceptRequest,
                        rejectRequest,
                        position
                      ),
                    };

                    transporter.sendMail(mailOptions2, (error, info) => {
                      if (error) {
                        res.status(500).json({
                          error: "Failed to send invitation.",
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
              const [p_tasksRes] = await pool.execute("CALL pro_all_tasks(?)", [
                sp.pid,
              ]);
              const p_tasks = p_tasksRes[0];
              if (p_tasks && p_tasks.length > 0) {
                for (const pt of p_tasks) {
                  const project_name = sp.pname;
                  const letter = project_name
                    .trim()
                    .substring(0, 2)
                    .toUpperCase();
                  const random_num = Math.floor(Math.random() * 10000) + 1;
                  const get_tcode = `${letter}-${random_num}`;
                  const data8 = {
                    gid: getGoal.gid,
                    sid: getKPI.sid,
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
                    portfolio_id: getGoal.portfolio_id,
                    tassignee: pt.tassignee,
                    tcreated_by: gcreated_by,
                    tcreated_date: formattedDate,
                    tnotify: "yes",
                    tnotify_clear: "no",
                    tnotify_date: formattedDate,
                    tdue_date: pt.tdue_date,
                    tdue_date_clear: "no",
                    dept_id: getGoal.gdept,
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
                  const [getTaskRes] = await pool.execute(
                    "CALL GetInsertedTask(?)",
                    [gcreated_by]
                  );
                  const getTask = getTaskRes[0][0];

                  const hdata9 = {
                    pid: getProject.pid,
                    sid: getKPI.sid,
                    gid: getGoal.gid,
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
                      const project_name = sp.pname;
                      const letter = project_name
                        .trim()
                        .substring(0, 2)
                        .toUpperCase();
                      const random_num = Math.floor(Math.random() * 10000) + 1;
                      const get_stcode = `${letter}-${random_num}`;

                      const data9 = {
                        tid: getTask.tid,
                        gid: getGoal.gid,
                        sid: getKPI.sid,
                        stproject_assign: getProject.pid,
                        portfolio_id: getGoal.portfolio_id,
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
                        stcreated_by: gcreated_by,
                        stcreated_date: formattedDate,
                        stnotify: "yes",
                        stnotify_clear: "no",
                        stnotify_date: formattedDate,
                        stdue_date: ts.stdue_date,
                        stdue_date_clear: "no",
                        dept_id: getGoal.gdept,
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
                        [gcreated_by]
                      );
                      const getSubtask = getSubtaskRes[0][0];

                      const hdata10 = {
                        pid: getProject.pid,
                        sid: getKPI.sid,
                        gid: getGoal.gid,
                        h_date: formattedDate,
                        h_resource_id: powner.reg_id,
                        h_resource: `${powner.first_name} ${powner.last_name}`,
                        h_description: `Subtask Code: ${get_stcode} , Subtask Name: ${ts.stname}, Created by ${powner.first_name} ${powner.last_name}`,
                        subtask_id: getSubtask.stid,
                      };

                      const paramNamesString10 =
                        Object.keys(hdata10).join(", ");
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
        }
      }
    }

    if (copy_detail == "custom") {
      if (cust_goal == "1") {
        //Import Only Strategies
        //strategies
        const [g_strategiesRes] = await pool.execute(
          "CALL GoalsAllStrategiesListASC(?)",
          [gid]
        );
        const g_strategies = g_strategiesRes[0];
        if (g_strategies && g_strategies.length > 0) {
          for (const gs of g_strategies) {
            const insertStrategiesFields = {
              sname: gs.sname,
              sdes: gs.sdes,
              screated_by: gcreated_by,
              screated_date: formattedDate,
              sprogress: "to_do",
              portfolio_id: getGoal.portfolio_id,
              gid: getGoal.gid,
              gdept_id: getGoal.gdept,
            };

            const paramNamesString = Object.keys(insertStrategiesFields).join(
              ", "
            );
            const paramValuesString = Object.values(insertStrategiesFields)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL = `CALL InsertStrategies(?, ?)`;
            await pool.execute(callProcedureSQL, [
              paramNamesString,
              paramValuesString,
            ]);

            const [getKPIRes] = await pool.execute("CALL GetInsertedKPI(?,?)", [
              getGoal.gid,
              gcreated_by,
            ]);
            const getKPI = getKPIRes[0][0];

            const hdata = {
              sid: getKPI.sid,
              gid: getGoal.gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `KPI Created By ${powner.first_name} ${powner.last_name}`,
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
      }

      if (cust_goal == "2") {
        //Import Strategies with Projects Only
        //strategies
        const [g_strategiesRes] = await pool.execute(
          "CALL GoalsAllStrategiesListASC(?)",
          [gid]
        );
        const g_strategies = g_strategiesRes[0];
        if (g_strategies && g_strategies.length > 0) {
          for (const gs of g_strategies) {
            const insertStrategiesFields = {
              sname: gs.sname,
              sdes: gs.sdes,
              screated_by: gcreated_by,
              screated_date: formattedDate,
              sprogress: "to_do",
              portfolio_id: getGoal.portfolio_id,
              gid: getGoal.gid,
              gdept_id: getGoal.gdept,
            };

            const paramNamesString = Object.keys(insertStrategiesFields).join(
              ", "
            );
            const paramValuesString = Object.values(insertStrategiesFields)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL = `CALL InsertStrategies(?, ?)`;
            await pool.execute(callProcedureSQL, [
              paramNamesString,
              paramValuesString,
            ]);

            const [getKPIRes] = await pool.execute("CALL GetInsertedKPI(?,?)", [
              getGoal.gid,
              gcreated_by,
            ]);
            const getKPI = getKPIRes[0][0];

            const hdata = {
              sid: getKPI.sid,
              gid: getGoal.gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `KPI Created By ${powner.first_name} ${powner.last_name}`,
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

            //projects
            const [s_projectsRes] = await pool.execute(
              "CALL StrategyAllProjectsListASC(?)",
              [gs.sid]
            );
            const s_projects = s_projectsRes[0];

            if (s_projects && s_projects.length > 0) {
              for (const sp of s_projects) {
                const insertProjectFields = {
                  gid: getGoal.gid,
                  sid: getKPI.sid,
                  ptype: sp.ptype,
                  p_publish: sp.p_publish,
                  pname: sp.pname,
                  pdes: sp.pdes,
                  plink: sp.plink,
                  plink_comment: sp.plink_comment,
                  pmanager: sp.pmanager,
                  pcreated_by: gcreated_by,
                  pcreated_date: formattedDate,
                  portfolio_id: getGoal.portfolio_id,
                  dept_id: getGoal.gdept,
                };

                const paramNamesString =
                  Object.keys(insertProjectFields).join(", ");
                const paramValuesString = Object.values(insertProjectFields)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL = `CALL InsertProject(?, ?)`;
                await pool.execute(callProcedureSQL, [
                  paramNamesString,
                  paramValuesString,
                ]);

                const [getProjectRes] = await pool.execute(
                  "CALL GetInsertedProject(?)",
                  [gcreated_by]
                );
                const getProject = getProjectRes[0][0];

                const hdata = {
                  pid: getProject.pid,
                  sid: getKPI.sid,
                  gid: getGoal.gid,
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
              }
            }
          }
        }
      }

      if (cust_goal == "3") {
        //Import Strategies with Projects, Task & Its Subtask without assignee

        //strategies
        const [g_strategiesRes] = await pool.execute(
          "CALL GoalsAllStrategiesListASC(?)",
          [gid]
        );
        const g_strategies = g_strategiesRes[0];
        if (g_strategies && g_strategies.length > 0) {
          for (const gs of g_strategies) {
            const insertStrategiesFields = {
              sname: gs.sname,
              sdes: gs.sdes,
              screated_by: gcreated_by,
              screated_date: formattedDate,
              sprogress: "to_do",
              portfolio_id: getGoal.portfolio_id,
              gid: getGoal.gid,
              gdept_id: getGoal.gdept,
            };

            const paramNamesString = Object.keys(insertStrategiesFields).join(
              ", "
            );
            const paramValuesString = Object.values(insertStrategiesFields)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL = `CALL InsertStrategies(?, ?)`;
            await pool.execute(callProcedureSQL, [
              paramNamesString,
              paramValuesString,
            ]);

            const [getKPIRes] = await pool.execute("CALL GetInsertedKPI(?,?)", [
              getGoal.gid,
              gcreated_by,
            ]);
            const getKPI = getKPIRes[0][0];

            const hdata = {
              sid: getKPI.sid,
              gid: getGoal.gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `KPI Created By ${powner.first_name} ${powner.last_name}`,
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

            //projects
            const [s_projectsRes] = await pool.execute(
              "CALL StrategyAllProjectsListASC(?)",
              [gs.sid]
            );
            const s_projects = s_projectsRes[0];

            if (s_projects && s_projects.length > 0) {
              for (const sp of s_projects) {
                const insertProjectFields = {
                  gid: getGoal.gid,
                  sid: getKPI.sid,
                  ptype: sp.ptype,
                  p_publish: sp.p_publish,
                  pname: sp.pname,
                  pdes: sp.pdes,
                  plink: sp.plink,
                  plink_comment: sp.plink_comment,
                  pmanager: sp.pmanager,
                  pcreated_by: gcreated_by,
                  pcreated_date: formattedDate,
                  portfolio_id: getGoal.portfolio_id,
                  dept_id: getGoal.gdept,
                };

                const paramNamesString =
                  Object.keys(insertProjectFields).join(", ");
                const paramValuesString = Object.values(insertProjectFields)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL = `CALL InsertProject(?, ?)`;
                await pool.execute(callProcedureSQL, [
                  paramNamesString,
                  paramValuesString,
                ]);

                const [getProjectRes] = await pool.execute(
                  "CALL GetInsertedProject(?)",
                  [gcreated_by]
                );
                const getProject = getProjectRes[0][0];

                const hdata = {
                  pid: getProject.pid,
                  sid: getKPI.sid,
                  gid: getGoal.gid,
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

                //Check Project Tasks
                const [p_tasksRes] = await pool.execute(
                  "CALL pro_all_tasks(?)",
                  [sp.pid]
                );
                const p_tasks = p_tasksRes[0];
                if (p_tasks && p_tasks.length > 0) {
                  for (const pt of p_tasks) {
                    const project_name = sp.pname;
                    const letter = project_name
                      .trim()
                      .substring(0, 2)
                      .toUpperCase();
                    const random_num = Math.floor(Math.random() * 10000) + 1;
                    const get_tcode = `${letter}-${random_num}`;
                    const data8 = {
                      gid: getGoal.gid,
                      sid: getKPI.sid,
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
                      portfolio_id: getGoal.portfolio_id,
                      tassignee: gcreated_by,
                      tcreated_by: gcreated_by,
                      tcreated_date: formattedDate,
                      tnotify: "yes",
                      tnotify_clear: "no",
                      tnotify_date: formattedDate,
                      tdue_date: pt.tdue_date,
                      tdue_date_clear: "no",
                      dept_id: getGoal.gdept,
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
                    const [getTaskRes] = await pool.execute(
                      "CALL GetInsertedTask(?)",
                      [gcreated_by]
                    );
                    const getTask = getTaskRes[0][0];

                    const hdata9 = {
                      pid: getProject.pid,
                      sid: getKPI.sid,
                      gid: getGoal.gid,
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
                        const project_name = sp.pname;
                        const letter = project_name
                          .trim()
                          .substring(0, 2)
                          .toUpperCase();
                        const random_num =
                          Math.floor(Math.random() * 10000) + 1;
                        const get_stcode = `${letter}-${random_num}`;

                        const data9 = {
                          tid: getTask.tid,
                          gid: getGoal.gid,
                          sid: getKPI.sid,
                          stproject_assign: getProject.pid,
                          portfolio_id: getGoal.portfolio_id,
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
                          stassignee: gcreated_by,
                          stcreated_by: gcreated_by,
                          stcreated_date: formattedDate,
                          stnotify: "yes",
                          stnotify_clear: "no",
                          stnotify_date: formattedDate,
                          stdue_date: ts.stdue_date,
                          stdue_date_clear: "no",
                          dept_id: getGoal.gdept,
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
                          [gcreated_by]
                        );
                        const getSubtask = getSubtaskRes[0][0];

                        const hdata10 = {
                          pid: getProject.pid,
                          sid: getKPI.sid,
                          gid: getGoal.gid,
                          h_date: formattedDate,
                          h_resource_id: powner.reg_id,
                          h_resource: `${powner.first_name} ${powner.last_name}`,
                          h_description: `Subtask Code: ${get_stcode} , Subtask Name: ${ts.stname}, Created by ${powner.first_name} ${powner.last_name}`,
                          subtask_id: getSubtask.stid,
                        };

                        const paramNamesString10 =
                          Object.keys(hdata10).join(", ");
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
          }
        }
      }
    }

    res.status(201).json({
      message: "Goal Copied successfully.",
      gid: getGoal.gid,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//view_history_date_wise_goal
router.get(
  "/goal/view-history-date-wise-goal/:gid/:hdate",
  authMiddleware,
  async (req, res) => {
    const { gid, hdate } = req.params;
    try {
      const [rows, fields] = await pool.execute("CALL view_history_goal(?,?)", [
        gid,
        hdate,
      ]);
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//view_history_date_range_goal
router.get(
  "/goal/view-history-date-range-goal/:gid",
  authMiddleware,
  async (req, res) => {
    const gid = req.params.gid;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_history_date_range_goal(?,?,?)",
        [gid, start_date, end_date]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//view_all_history_goal
router.get(
  "/goal/view-all-history-goal/:gid",
  authMiddleware,
  async (req, res) => {
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_all_history_goal(?)",
        [gid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//gdetail_AddMember
router.post("/goal/insert-goal-member", authMiddleware, async (req, res) => {
  try {
    const { gid, gcreated_by, team_member, imemail } = req.body;

    const formattedDate = dateConversion();

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      gcreated_by,
    ]);
    const powner = check_powner[0][0];

    const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
    const gdetail = gdetailRes[0][0];

    if (team_member && team_member.length > 0) {
      // Use forEach with async/await
      await Promise.all(
        team_member.map(async (t) => {
          const [check_Goal_members] = await pool.execute(
            "CALL check_GoalMToClear(?,?)",
            [gid, t]
          );
          if (check_Goal_members[0].length == 0) {
            const data5 = {
              gid: gid,
              portfolio_id: gdetail.portfolio_id,
              gmember: t,
              status: `send`,
              gcreated_by: gcreated_by,
              sent_date: formattedDate,
              sent_notify_clear: `no`,
            };

            const paramNamesString5 = Object.keys(data5).join(", ");
            const paramValuesString5 = Object.values(data5)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
            await pool.execute(callProcedureSQL5, [
              paramNamesString5,
              paramValuesString5,
            ]);

            const [check_user] = await pool.execute("CALL getStudentById(?)", [
              t,
            ]);
            const user = check_user[0][0];

            const [getgmid] = await pool.execute(
              "CALL check_GoalMToClear(?,?)",
              [gid, t]
            );
            const gmid = getgmid[0][0]?.gmid;

            const hdata6 = {
              gid: gid,
              h_date: formattedDate,
              h_resource_id: powner.reg_id,
              h_resource: `${powner.first_name} ${powner.last_name}`,
              h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
              gmember_id: gmid,
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

            const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
              gdetail.portfolio_id,
            ]);
            const PortfolioName = getPortfolio[0][0]?.portfolio_name;
            const userFName = `${user.first_name} ${user.last_name}`;
            const pownerFName = `${powner.first_name} ${powner.last_name}`;
            const get_gdes = gdetail.gdes;
            const short_gdes = get_gdes.substring(0, 100);
            const position = "team member";
            const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
            const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: user.email_address,
              subject: "Goal Request | Decision 168",
              html: generateGoalRequestEmailTemplate(
                userFName,
                pownerFName,
                gdetail.gname,
                PortfolioName,
                short_gdes,
                acceptRequest,
                rejectRequest,
                position
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send invitation.",
                });
              } else {
                res.status(201).json({
                  message: "Invitation sent successfully.",
                });
              }
            });
          }
        })
      );
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
            const [check_Goal_members] = await pool.execute(
              "CALL check_GoalMToClear(?,?)",
              [gid, rid]
            );
            if (check_Goal_members[0].length == 0) {
              if (gcreated_by != rid) {
                const data7 = {
                  gid: gid,
                  portfolio_id: gdetail.portfolio_id,
                  gmember: rid,
                  status: `send`,
                  gcreated_by: gcreated_by,
                  sent_date: formattedDate,
                  sent_notify_clear: `no`,
                };

                const paramNamesString7 = Object.keys(data7).join(", ");
                const paramValuesString7 = Object.values(data7)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL7 = `CALL InsertGoalsMembers(?, ?)`;
                await pool.execute(callProcedureSQL7, [
                  paramNamesString7,
                  paramValuesString7,
                ]);

                const [check_portfolio] = await pool.execute(
                  "CALL check_PortfolioMember(?,?)",
                  [im, gdetail.portfolio_id]
                );
                if (check_portfolio[0].length == 0) {
                  const dataPort = {
                    portfolio_id: gdetail.portfolio_id,
                    sent_to: im,
                    sent_from: gcreated_by,
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

                const [check_user] = await pool.execute(
                  "CALL getStudentById(?)",
                  [rid]
                );
                const user = check_user[0][0];

                const [getgmid] = await pool.execute(
                  "CALL check_GoalMToClear(?,?)",
                  [gid, rid]
                );
                const gmid = getgmid[0][0]?.gmid;

                const hdata8 = {
                  gid: gid,
                  h_date: formattedDate,
                  h_resource_id: powner.reg_id,
                  h_resource: `${powner.first_name} ${powner.last_name}`,
                  h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
                  gmember_id: gmid,
                };

                const paramNamesString8 = Object.keys(hdata8).join(", ");
                const paramValuesString8 = Object.values(hdata8)
                  .map((value) => `'${value}'`)
                  .join(", ");

                const callProcedureSQL8 = `CALL InsertProjectHistory(?, ?)`;
                await pool.execute(callProcedureSQL8, [
                  paramNamesString8,
                  paramValuesString8,
                ]);

                const [getPortfolio] = await pool.execute(
                  "CALL getPortfolio2(?)",
                  [gdetail.portfolio_id]
                );
                const PortfolioName = getPortfolio[0][0]?.portfolio_name;
                const userFName = `${user.first_name} ${user.last_name}`;
                const pownerFName = `${powner.first_name} ${powner.last_name}`;
                const get_gdes = gdetail.gdes;
                const short_gdes = get_gdes.substring(0, 100);
                const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
                const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
                const position = "team member";
                const mailOptions = {
                  from: process.env.SMTP_USER,
                  to: user.email_address,
                  subject: "Goal Request | Decision 168",
                  html: generateGoalRequestEmailTemplate(
                    userFName,
                    pownerFName,
                    gdetail.gname,
                    PortfolioName,
                    short_gdes,
                    acceptRequest,
                    rejectRequest,
                    position
                  ),
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    res.status(500).json({
                      error: "Failed to send invitation.",
                    });
                  } else {
                    res.status(201).json({
                      message: "Invitation sent successfully.",
                    });
                  }
                });
              }
            }
          } else {
            const [check_email] = await pool.execute(
              "CALL check_goal_invited_email(?,?,?)",
              [im, gcreated_by, gid]
            );
            if (check_email[0].length == 0) {
              const data9 = {
                gid: gid,
                sent_from: gcreated_by,
                sent_to: im,
                status: `pending`,
                invite_date: formattedDate,
              };

              const paramNamesString9 = Object.keys(data9).join(", ");
              const paramValuesString9 = Object.values(data9)
                .map((value) => `'${value}'`)
                .join(", ");

              const callProcedureSQL9 = `CALL InsertGoalsInvitedMembers(?, ?)`;
              await pool.execute(callProcedureSQL9, [
                paramNamesString9,
                paramValuesString9,
              ]);

              const [check_portfolio] = await pool.execute(
                "CALL check_PortfolioMember(?,?)",
                [im, gdetail.portfolio_id]
              );
              if (check_portfolio[0].length == 0) {
                const dataPort = {
                  portfolio_id: gdetail.portfolio_id,
                  sent_to: im,
                  sent_from: gcreated_by,
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

              const [getigm_id] = await pool.execute(
                "CALL check_goal_invited_email(?,?,?)",
                [im, gcreated_by, gid]
              );

              const igm_id = getigm_id[0][0]?.igm_id;

              const hdata10 = {
                gid: gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${powner.first_name} ${powner.last_name} sent invite to ${im}`,
                ginvited_id: igm_id,
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

              const [getPortfolio] = await pool.execute(
                "CALL getPortfolio2(?)",
                [gdetail.portfolio_id]
              );
              const PortfolioName = getPortfolio[0][0]?.portfolio_name;
              const pownerFName = `${powner.first_name} ${powner.last_name}`;
              const get_gdes = gdetail.gdes;
              const short_gdes = get_gdes.substring(0, 100);
              const acceptRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/1`;
              const rejectRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/2`;
              const position = "team member";
              const mailOptions = {
                from: process.env.SMTP_USER,
                to: im,
                subject: "Goal Request | Decision 168",
                html: generateGoalInviteRequestEmailTemplate(
                  pownerFName,
                  gdetail.gname,
                  PortfolioName,
                  short_gdes,
                  acceptRequest,
                  rejectRequest,
                  position
                ),
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  res.status(500).json({
                    error: "Failed to send invitation.",
                  });
                } else {
                  res.status(201).json({
                    message: "Invitation sent successfully.",
                  });
                }
              });
            }
          }
        })
      );
    }

    res.status(201).json({
      message: "Goal Member Added successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//direct_remove_goalmanager
router.patch(
  "/goal/direct-remove-goal-manager/:gid/:gmember_id",
  authMiddleware,
  async (req, res) => {
    try {
      const gid = req.params.gid;
      const gmember_id = req.params.gmember_id;
      const formattedDate = dateConversion();

      const updateFieldsValues2 = `gmanager = ''`;
      const upid = `gid  = '${gid}'`;
      await pool.execute("CALL UpdateGoals(?, ?)", [updateFieldsValues2, upid]);

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        gmember_id,
      ]);
      const powner = check_powner[0][0];
      const hdata = {
        gid: gid,
        h_date: formattedDate,
        h_resource_id: powner.gmember_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${powner.first_name} ${powner.last_name} Removed as a Goal Manager`,
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

//delete_gMember
router.patch(
  "/goal/remove-goal-member/:gmid",
  authMiddleware,
  async (req, res) => {
    try {
      const gmid = req.params.gmid;

      const [check_mem_idRes] = await pool.execute(
        "CALL check_GoalPMToClear(?)",
        [gmid]
      );

      const check_mem_id = check_mem_idRes[0];

      if (check_mem_id && check_mem_id.length > 0) {
        const formattedDate = dateConversion();
        let reg_id = check_mem_id[0].gmember;
        let gid = check_mem_id[0].gid;
        let portfolio_id = check_mem_id[0].portfolio_id;

        const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
        const gmanager = gdetailRes[0][0]?.gmanager;

        const [check_powner] = await pool.execute("CALL getStudentById(?)", [
          reg_id,
        ]);
        const powner = check_powner[0][0];

        const [getStrategies] = await pool.execute(
          "CALL GoalTMOpenStrategies(?,?,?)",
          [reg_id, gid, portfolio_id]
        );
        let strategies_count = 0;
        if (getStrategies[0]) {
          strategies_count = getStrategies[0].length;
        }

        const [getProjects] = await pool.execute(
          "CALL GoalTMOpenProjects(?,?,?)",
          [reg_id, gid, portfolio_id]
        );
        let pro_count = 0;
        let only_pro_count = 0;
        if (getProjects[0]) {
          pro_count = getProjects[0].length;
          getProjects[0].forEach((gp) => {
            if (gp.pmanager !== reg_id && gp.pcreated_by === reg_id) {
              only_pro_count++;
            } else if (gp.pmanager === reg_id && gp.pcreated_by === reg_id) {
              only_pro_count++;
            }
          });
        }

        const [getTasks] = await pool.execute("CALL GoalTMOpenTasks(?,?,?)", [
          reg_id,
          gid,
          portfolio_id,
        ]);
        let task_count = 0;
        if (getTasks[0]) {
          task_count = getTasks[0].length;
        }

        const [getSubtasks] = await pool.execute(
          "CALL GoalTMOpenSubtasks(?,?,?)",
          [reg_id, gid, portfolio_id]
        );
        let subtask_count = 0;
        if (getSubtasks[0]) {
          subtask_count = getSubtasks[0].length;
        }

        const [getProjectTM] = await pool.execute(
          "CALL GoalgetProjectOpenTM(?,?,?)",
          [reg_id, gid, portfolio_id]
        );
        let pro_tm_count = 0;
        if (getProjectTM[0]) {
          pro_tm_count = getProjectTM[0].length;
        }

        if (
          strategies_count === 0 &&
          pro_count === 0 &&
          task_count === 0 &&
          subtask_count === 0 &&
          pro_tm_count === 0
        ) {
          if (gmanager == reg_id) {
            const updateFieldsValues2 = `gmanager = ''`;
            const upid = `gid  = '${gid}'`;
            await pool.execute("CALL UpdateGoals(?, ?)", [
              updateFieldsValues2,
              upid,
            ]);
          }

          const hdata = {
            gid: gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} Removed from goal`,
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

          const del1 = `gmid = '${gmid}'`;
          await pool.execute("CALL DeleteGoalsMembers(?)", [del1]);

          res.status(200).json({ message: "Removed successfully" });
        } else {
          res.status(200).json({
            strategies_countResult: strategies_count,
            only_pro_countResult: only_pro_count,
            task_countResult: task_count,
            subtask_countResult: subtask_count,
            pro_tm_countResult: pro_tm_count,
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

//GoalTeamMemberAccepted
router.get(
  "/goal/get-goal-team-member-accepted/:gid",
  authMiddleware,
  async (req, res) => {
    const gid = req.params.gid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL GoalTeamMemberAccepted(?)",
        [gid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//goal_open_work_new_assignee
router.patch(
  "/goal/goal-open-work-new-assignee",
  authMiddleware,
  async (req, res) => {
    const reg_id = req.body.reg_id;
    const new_reg_id = req.body.new_reg_id;
    const old_reg_id = req.body.old_reg_id;
    const gmid_id = req.body.gmid_id;
    const portfolio_id = req.body.portfolio_id;
    try {
      const [check_gm] = await pool.execute("CALL check_GoalPMToClear(?)", [
        gmid_id,
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
        const formattedDate = dateConversion();

        const gid = check.gid;

        const [getStrategiesRes] = await pool.execute(
          "CALL GoalTMOpenStrategies(?,?,?)",
          [old_reg_id, gid, portfolio_id]
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
          "CALL GoalTMOpenProjects(?,?,?)",
          [old_reg_id, gid, portfolio_id]
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
          "CALL GoalgetProjectOpenTM(?,?,?)",
          [old_reg_id, gid, portfolio_id]
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

        const [getTasksRes] = await pool.execute(
          "CALL GoalTMOpenTasks(?,?,?)",
          [old_reg_id, gid, portfolio_id]
        );

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
          "CALL GoalTMOpenSubtasks(?,?,?)",
          [old_reg_id, gid, portfolio_id]
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

        const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
        const gmanager = gdetailRes[0][0]?.gmanager;

        if (gmanager == old_reg_id) {
          const updateFieldsValues2 = `gmanager = ''`;
          const upid = `gid  = '${gid}'`;
          await pool.execute("CALL UpdateGoals(?, ?)", [
            updateFieldsValues2,
            upid,
          ]);
        }

        const hdata = {
          gid: gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} Removed from goal`,
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

        const del1 = `gmid = '${gmid_id}'`;
        await pool.execute("CALL DeleteGoalsMembers(?)", [del1]);

        res.status(200).json({ message: "Member Removed successfully" });
      } else {
        res.status(200).json({ message: "member not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//assign_goalmanager
router.patch(
  "/goal/assign-goal-manager/:gid/:gmember_id",
  authMiddleware,
  async (req, res) => {
    try {
      const gid = req.params.gid;
      const gmember_id = req.params.gmember_id;
      const formattedDate = dateConversion();

      const updateFieldsValues2 = `gmanager = '${gmember_id}'`;
      const upid = `gid  = '${gid}'`;
      await pool.execute("CALL UpdateGoals(?, ?)", [updateFieldsValues2, upid]);

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        gmember_id,
      ]);
      const powner = check_powner[0][0];
      const hdata = {
        gid: gid,
        h_date: formattedDate,
        h_resource_id: powner.gmember_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${powner.first_name} ${powner.last_name} assigned as a goal manager`,
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

//delete_iGMember
router.patch(
  "/goal/remove-goal-invited-member",
  authMiddleware,
  async (req, res) => {
    try {
      const user_id = req.body.user_id;
      const igm_id = req.body.igm_id;
      const gid = req.body.gid;
      const sent_to = req.body.sent_to;

      const formattedDate = dateConversion();

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const hdata = {
        gid: gid,
        h_date: formattedDate,
        h_resource_id: powner.reg_id,
        h_resource: `${powner.first_name} ${powner.last_name}`,
        h_description: `${sent_to} Removed from goal`,
        ginvited_id: igm_id,
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

      const del1 = `igm_id = '${igm_id}'`;
      await pool.execute("CALL DeleteGoalsInvitedMembers(?)", [del1]);

      res.status(201).json({
        message: "Removed successfully.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

//add_SuggestedGMember
router.patch(
  "/goal/add-suggested-goal-member/:user_id/:gid/:suggest_id",
  authMiddleware,
  async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const gid = req.params.gid;
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

      const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
      const gdetail = gdetailRes[0][0];

      const [check_Goal_members] = await pool.execute(
        "CALL check_GoalMToClear(?,?)",
        [gid, suggest_id]
      );
      if (check_Goal_members[0].length == 0) {
        const otherFields = {
          status: "approved",
          approve_date: "${formattedDate}",
        };
        const updateFieldsValues1 = convertObjectToProcedureParams(otherFields);
        const upid = `suggest_id  = '${suggest_id}' AND gid  = '${gid}'`;
        await pool.execute("CALL UpdateGoalsSuggestedMembers(?, ?)", [
          updateFieldsValues1,
          upid,
        ]);

        const hdata = {
          gid: gid,
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

        const data5 = {
          gid: gid,
          portfolio_id: gdetail.portfolio_id,
          gmember: suggest_id,
          status: `send`,
          gcreated_by: user_id,
          sent_date: formattedDate,
          sent_notify_clear: `no`,
        };

        const paramNamesString5 = Object.keys(data5).join(", ");
        const paramValuesString5 = Object.values(data5)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
        await pool.execute(callProcedureSQL5, [
          paramNamesString5,
          paramValuesString5,
        ]);

        const [getgmid] = await pool.execute("CALL check_GoalMToClear(?,?)", [
          gid,
          suggest_id,
        ]);
        const gmid = getgmid[0][0]?.gmid;

        const hdata6 = {
          gid: gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
          gmember_id: gmid,
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

        const [check_Portfolio_owner_id] = await pool.execute(
          "CALL getPortfolio2(?)",
          [gdetail.portfolio_id]
        );
        const PortfolioName = check_Portfolio_owner_id[0][0]?.portfolio_name;
        const userFName = `${user.first_name} ${user.last_name}`;
        const pownerFName = `${powner.first_name} ${powner.last_name}`;
        const get_gdes = gdetail.gdes;
        const short_gdes = get_gdes.substring(0, 100);
        const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
        const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
        const position = "team member";
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: user.email_address,
          subject: "Goal Request | Decision 168",
          html: generateGoalRequestEmailTemplate(
            userFName,
            pownerFName,
            gdetail.gname,
            PortfolioName,
            short_gdes,
            acceptRequest,
            rejectRequest,
            position
          ),
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(500).json({
              error: "Failed to send invitation.",
            });
          } else {
            res.status(201).json({
              message: "Added successfully.",
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

//add_Suggested_IGmember
router.patch(
  "/goal/add-invited-suggested-goal-member/:user_id/:gid/:suggest_id",
  authMiddleware,
  async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const gid = req.params.gid;
      const suggest_id = req.params.suggest_id;

      const formattedDate = dateConversion();

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const [gdetailRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
      const gdetail = gdetailRes[0][0];

      const [check_if_registered] = await pool.execute("CALL selectLogin(?)", [
        suggest_id,
      ]);
      if (check_if_registered[0].length > 0) {
        const [check_user] = await pool.execute("CALL getStudentById(?)", [
          suggest_id,
        ]);
        const user = check_user[0][0];
        const otherFields = {
          status: "approved",
          approve_date: "${formattedDate}",
        };
        const updateFieldsValues1 = convertObjectToProcedureParams(otherFields);

        const upid = `suggest_id  = '${suggest_id}' AND gid  = '${gid}'`;
        await pool.execute("CALL UpdateGoalsSuggestedMembers(?, ?)", [
          updateFieldsValues1,
          upid,
        ]);

        const hdata = {
          gid: gid,
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

        const data5 = {
          gid: gid,
          portfolio_id: gdetail.portfolio_id,
          gmember: suggest_id,
          status: `send`,
          gcreated_by: user_id,
          sent_date: formattedDate,
          sent_notify_clear: `no`,
        };

        const paramNamesString5 = Object.keys(data5).join(", ");
        const paramValuesString5 = Object.values(data5)
          .map((value) => `'${value}'`)
          .join(", ");

        const callProcedureSQL5 = `CALL InsertGoalsMembers(?, ?)`;
        await pool.execute(callProcedureSQL5, [
          paramNamesString5,
          paramValuesString5,
        ]);

        const [getgmid] = await pool.execute("CALL check_GoalMToClear(?,?)", [
          gid,
          suggest_id,
        ]);
        const gmid = getgmid[0][0]?.gmid;

        const hdata6 = {
          gid: gid,
          h_date: formattedDate,
          h_resource_id: powner.reg_id,
          h_resource: `${powner.first_name} ${powner.last_name}`,
          h_description: `${powner.first_name} ${powner.last_name} sent goal team member request to ${user.first_name} ${user.last_name}`,
          gmember_id: gmid,
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

        const [getportfolio] = await pool.execute(
          "CALL check_PortfolioMember(?,?)",
          [suggest_id, gdetail.portfolio_id]
        );
        if (getportfolio[0].length == 0) {
          const dataPort = {
            portfolio_id: gdetail.portfolio_id,
            sent_to: suggest_id,
            sent_from: user_id,
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

        const [check_Portfolio_owner_id] = await pool.execute(
          "CALL getPortfolio2(?)",
          [gdetail.portfolio_id]
        );
        const PortfolioName = check_Portfolio_owner_id[0][0]?.portfolio_name;
        const userFName = `${user.first_name} ${user.last_name}`;
        const pownerFName = `${powner.first_name} ${powner.last_name}`;
        const get_gdes = gdetail.gdes;
        const short_gdes = get_gdes.substring(0, 100);
        const acceptRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/1`;
        const rejectRequest = `${config.verificationLink}goal-request/${gid}/${gmid}/2`;
        const position = "team member";
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: user.email_address,
          subject: "Goal Request | Decision 168",
          html: generateGoalRequestEmailTemplate(
            userFName,
            pownerFName,
            gdetail.gname,
            PortfolioName,
            short_gdes,
            acceptRequest,
            rejectRequest,
            position
          ),
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(500).json({
              error: "Failed to send invitation.",
            });
          } else {
            res.status(201).json({
              message: "Added successfully.",
            });
          }
        });
      } else {
        const [check_email] = await pool.execute(
          "CALL check_goal_invited_email2(?,?)",
          [suggest_id, gid]
        );
        if (check_email[0].length == 0) {
          const otherFields = {
            status: "approved",
            approve_date: "${formattedDate}",
          };
          const updateFieldsValues1 =
            convertObjectToProcedureParams(otherFields);
          const upid = `suggest_id  = '${suggest_id}' AND gid  = '${gid}'`;
          await pool.execute("CALL UpdateGoalsSuggestedMembers(?, ?)", [
            updateFieldsValues1,
            upid,
          ]);

          const hdata = {
            gid: gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${suggest_id} is approved by ${powner.first_name} ${powner.last_name}`,
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

          const data9 = {
            gid: gid,
            sent_from: user_id,
            sent_to: suggest_id,
            status: `pending`,
            invite_date: formattedDate,
          };

          const paramNamesString9 = Object.keys(data9).join(", ");
          const paramValuesString9 = Object.values(data9)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL9 = `CALL InsertGoalsInvitedMembers(?, ?)`;
          await pool.execute(callProcedureSQL9, [
            paramNamesString9,
            paramValuesString9,
          ]);

          const [getportfolio] = await pool.execute(
            "CALL check_PortfolioMember(?,?)",
            [suggest_id, gdetail.portfolio_id]
          );
          if (getportfolio[0].length == 0) {
            const dataPort = {
              portfolio_id: gdetail.portfolio_id,
              sent_to: suggest_id,
              sent_from: user_id,
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

          const [getigm_id] = await pool.execute(
            "CALL check_goal_invited_email2(?,?)",
            [suggest_id, gid]
          );

          const igm_id = getigm_id[0][0]?.igm_id;

          const hdata10 = {
            gid: gid,
            h_date: formattedDate,
            h_resource_id: powner.reg_id,
            h_resource: `${powner.first_name} ${powner.last_name}`,
            h_description: `${powner.first_name} ${powner.last_name} sent invite to ${suggest_id}`,
            ginvited_id: igm_id,
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

          const [check_Portfolio_owner_id] = await pool.execute(
            "CALL getPortfolio2(?)",
            [gdetail.portfolio_id]
          );
          const PortfolioName = check_Portfolio_owner_id[0][0]?.portfolio_name;
          const pownerFName = `${powner.first_name} ${powner.last_name}`;
          const get_gdes = gdetail.gdes;
          const short_gdes = get_gdes.substring(0, 100);
          const acceptRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/1`;
          const rejectRequest = `${config.verificationLink}goal-invite-reject-request/${gid}/${igm_id}/2`;
          const position = "team member";
          const mailOptions = {
            from: process.env.SMTP_USER,
            to: suggest_id,
            subject: "Goal Request | Decision 168",
            html: generateGoalInviteRequestEmailTemplate(
              pownerFName,
              gdetail.gname,
              PortfolioName,
              short_gdes,
              acceptRequest,
              rejectRequest,
              position
            ),
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              res.status(500).json({
                error: "Failed to send invitation.",
              });
            } else {
              res.status(201).json({
                message: "Goal invitation sent.",
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

//Strategy_tasks
router.get("/goal/strategy-tasks/:sid", authMiddleware, async (req, res) => {
  const sid = req.params.sid;
  try {
    const [rows, fields] = await pool.execute("CALL Strategy_tasks(?)", [sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Strategy_subtasks
router.get("/goal/strategy-subtasks/:sid", authMiddleware, async (req, res) => {
  const sid = req.params.sid;
  try {
    const [rows, fields] = await pool.execute("CALL Strategy_subtasks(?)", [
      sid,
    ]);
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//StrategyDetail
router.get("/goal/strategy-detail/:sid", authMiddleware, async (req, res) => {
  const sid = req.params.sid;
  try {
    const [rows] = await pool.execute("CALL StrategyDetail(?)", [sid]);

    const [getGoalRes] = await pool.execute("CALL GoalDetail(?)", [
      rows[0][0].gid,
    ]);
    const get_goal_name = getGoalRes[0][0].gname;
    const get_goal_manager = getGoalRes[0][0].gmanager;
    const get_goal_owner = getGoalRes[0][0].gcreated_by;

    const [getDeptName] = await pool.execute("CALL get_PDepartment(?)", [
      rows[0][0].gdept_id,
    ]);
    const get_dept_name = getDeptName[0][0].department;

    const [getCreatedByName] = await pool.execute("CALL getStudentById(?)", [
      rows[0][0].screated_by,
    ]);
    const get_created_by_name =
      getCreatedByName[0][0].first_name +
      " " +
      getCreatedByName[0][0].last_name;

    const [kpi_t_progress_done_rows] = await pool.execute(
      "CALL Strategyprogress_done(?)",
      [sid]
    );

    const [kpi_t_progress_total_rows] = await pool.execute(
      "CALL Strategyprogress_total(?)",
      [sid]
    );

    const [kpi_st_progress_done_rows] = await pool.execute(
      "CALL Strategysub_progress_done(?)",
      [sid]
    );

    const [kpi_st_progress_total_rows] = await pool.execute(
      "CALL Strategysub_progress_total(?)",
      [sid]
    );

    let kpi_progress = 0;
    let kpi_total_pro_progress = 0;
    let kpi_total_pro_progress_done = 0;
    let kpi_progress_done = kpi_t_progress_done_rows[0][0]?.count_rows;
    let kpi_progress_total = kpi_t_progress_total_rows[0][0]?.count_rows;
    let kpi_sub_progress_done = kpi_st_progress_done_rows[0][0]?.count_rows;
    let kpi_sub_progress_total = kpi_st_progress_total_rows[0][0]?.count_rows;

    if (kpi_progress_total || kpi_sub_progress_total) {
      kpi_total_pro_progress_done = kpi_progress_done + kpi_sub_progress_done;
      kpi_total_pro_progress = kpi_progress_total + kpi_sub_progress_total;
      const kpi_progressCal =
        (kpi_total_pro_progress_done / kpi_total_pro_progress) * 100;
      kpi_progress = Math.round(kpi_progressCal);
    }

    const [get_portfolio] = await pool.execute("CALL getPortfolio2(?)", [
      rows[0][0].portfolio_id,
    ]);
    const get_portfolio_createdby_id = get_portfolio[0][0]?.portfolio_createdby;

    const results = {
      ...rows[0][0],
      get_goal_name,
      get_goal_manager,
      get_goal_owner,
      get_dept_name,
      get_created_by_name,
      get_portfolio_createdby_id,
      kpi_progress,
      kpi_total_pro_progress,
      kpi_total_pro_progress_done,
    };

    const [prorows] = await pool.execute("CALL StrategyAllProjectsList(?)", [
      sid,
    ]);

    const promises = prorows[0].map(async (item) => {
      const { pid } = item;

      const [t_progress_done_rows] = await pool.execute(
        "CALL progress_done(?)",
        [pid]
      );

      const [t_progress_total_rows] = await pool.execute(
        "CALL progress_total(?)",
        [pid]
      );

      const [st_progress_done_rows] = await pool.execute(
        "CALL sub_progress_done(?)",
        [pid]
      );

      const [st_progress_total_rows] = await pool.execute(
        "CALL sub_progress_total(?)",
        [pid]
      );

      let progressRes = 0;
      let total_pro_progress = 0;
      let total_pro_progress_done = 0;
      let progress_done = t_progress_done_rows[0][0]?.count_rows;
      let progress_total = t_progress_total_rows[0][0]?.count_rows;
      let sub_progress_done = st_progress_done_rows[0][0]?.count_rows;
      let sub_progress_total = st_progress_total_rows[0][0]?.count_rows;

      if (progress_total || sub_progress_total) {
        total_pro_progress_done = progress_done + sub_progress_done;
        total_pro_progress = progress_total + sub_progress_total;
        const progressCal =
          (total_pro_progress_done / total_pro_progress) * 100;
        progressRes = Math.round(progressCal);
      }

      const data = {
        ...item,
        progressRes,
        total_pro_progress,
        total_pro_progress_done,
      };
      return data;
    });
    const projectResults = await Promise.all(promises);

    res.status(200).json({
      kpiRes: results,
      projectRes: projectResults,
      goalId: rows[0][0].gid,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//view_history_date_strategy
router.get(
  "/goal/view-history-date-strategy/:sid",
  authMiddleware,
  async (req, res) => {
    const sid = req.params.sid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_history_date_strategy(?)",
        [sid]
      );

      const [KpiDetail] = await pool.execute("CALL StrategyDetail(?)", [sid]);

      res
        .status(200)
        .json({ history_dates: rows[0], KpiDetail: KpiDetail[0][0] });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//UpdateStrategies
router.patch("/goal/update-strategies", authMiddleware, async (req, res) => {
  try {
    let { sname } = req.body;
    let { sid } = req.body;
    const { user_id, ...otherFields } = req.body;

    const formattedDate = dateConversion();

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL UpdateStrategies('${formattedParams}', 'sid = ${sid}')`;

    await pool.execute(storedProcedure);

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const powner = check_powner[0][0];

    const hdata = {
      sid: sid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `KPI Edited By ${powner.first_name} ${powner.last_name}`,
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
      message: "KPI updated successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//view_history_date_wise_strategy
router.get(
  "/goal/view-history-date-wise-strategy/:sid/:hdate",
  authMiddleware,
  async (req, res) => {
    const { sid, hdate } = req.params;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_history_strategy(?,?)",
        [sid, hdate]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//view_history_date_range_strategy
router.get(
  "/goal/view-history-date-range-strategy/:sid",
  authMiddleware,
  async (req, res) => {
    const sid = req.params.sid;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_history_date_range_strategy(?,?,?)",
        [sid, start_date, end_date]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//view_all_history_strategy
router.get(
  "/goal/view-all-history-strategy/:sid",
  authMiddleware,
  async (req, res) => {
    const sid = req.params.sid;
    try {
      const [rows, fields] = await pool.execute(
        "CALL view_all_history_strategy(?)",
        [sid]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//DuplicateStrategy
router.post("/goal/duplicate-strategy", authMiddleware, async (req, res) => {
  try {
    let { screated_by } = req.body;
    let { sname } = req.body;
    const { sid, copy_detail, cust_strategy, ...otherFields } = req.body;

    const [check_powner] = await pool.execute("CALL getStudentById(?)", [
      screated_by,
    ]);
    const powner = check_powner[0][0];

    const [sdetailRes] = await pool.execute("CALL StrategyDetail(?)", [sid]);
    const sdetail = sdetailRes[0][0];

    const formattedDate = dateConversion();

    const additionalFields = {
      sdes: sdetail.sdes,
      screated_by: screated_by,
      screated_date: formattedDate,
      sprogress: "to_do",
      portfolio_id: sdetail.portfolio_id,
      gid: sdetail.gid,
      gdept_id: sdetail.gdept_id,
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

    const callProcedureSQL = `CALL InsertStrategies(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [getKPIRes] = await pool.execute("CALL GetInsertedKPI(?,?)", [
      sdetail.gid,
      screated_by,
    ]);
    const getKPI = getKPIRes[0][0];

    const [getPortfolio] = await pool.execute("CALL getPortfolio2(?)", [
      getKPI.portfolio_id,
    ]);
    const PortfolioName = getPortfolio[0][0]?.portfolio_name;

    const hdata = {
      sid: getKPI.sid,
      gid: getKPI.gid,
      h_date: formattedDate,
      h_resource_id: powner.reg_id,
      h_resource: `${powner.first_name} ${powner.last_name}`,
      h_description: `KPI Created By ${powner.first_name} ${powner.last_name}`,
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
      //projects
      const [s_projectsRes] = await pool.execute(
        "CALL StrategyAllProjectsListASC(?)",
        [sid]
      );
      const s_projects = s_projectsRes[0];

      if (s_projects && s_projects.length > 0) {
        for (const sp of s_projects) {
          const insertProjectFields = {
            gid: getKPI.gid,
            sid: getKPI.sid,
            ptype: sp.ptype,
            p_publish: sp.p_publish,
            pname: sp.pname,
            pdes: sp.pdes,
            plink: sp.plink,
            plink_comment: sp.plink_comment,
            pmanager: sp.pmanager,
            pcreated_by: screated_by,
            pcreated_date: formattedDate,
            portfolio_id: getKPI.portfolio_id,
            dept_id: getKPI.gdept_id,
          };

          const paramNamesString = Object.keys(insertProjectFields).join(", ");
          const paramValuesString = Object.values(insertProjectFields)
            .map((value) => `'${value}'`)
            .join(", ");

          const callProcedureSQL = `CALL InsertProject(?, ?)`;
          await pool.execute(callProcedureSQL, [
            paramNamesString,
            paramValuesString,
          ]);

          const [getProjectRes] = await pool.execute(
            "CALL GetInsertedProject(?)",
            [screated_by]
          );
          const getProject = getProjectRes[0][0];

          const hdata = {
            pid: getProject.pid,
            sid: getKPI.sid,
            gid: getKPI.gid,
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

          //Check Project Members
          const [getMemberProjectRes] = await pool.execute(
            "CALL getMemberProject(?)",
            [sp.pid]
          );
          const getMemberProject = getMemberProjectRes[0];

          if (getMemberProject && getMemberProject.length > 0) {
            for (const pm of getMemberProject) {
              const data7 = {
                pid: getProject.pid,
                portfolio_id: getKPI.portfolio_id,
                pmember: pm.pmember,
                status: "send",
                pcreated_by: screated_by,
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

              const [check_user] = await pool.execute(
                "CALL getStudentById(?)",
                [pm.pmember]
              );
              const user = check_user[0][0];

              const [getpm_id] = await pool.execute(
                "CALL check_ProjectMToClear(?,?)",
                [pm.pmember, getProject.pid]
              );
              const pm_id = getpm_id[0][0]?.pm_id;

              const hdata6 = {
                pid: getProject.pid,
                sid: getKPI.sid,
                gid: getKPI.gid,
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
              const userFName = `${user.first_name} ${user.last_name}`;
              const pownerFName = `${powner.first_name} ${powner.last_name}`;
              const get_pdes = getProject.pdes;
              const short_pdes = get_pdes.substring(0, 100);
              const acceptRequest = `${config.verificationLink}project-request/${getProject.pid}/${pm_id}/1`;
              const rejectRequest = `${config.verificationLink}project-request/${getProject.pid}/${pm_id}/2`;

              if (pm.pmember == sp.pmanager) {
                const position = "manager";
                const mailOptions2 = {
                  from: process.env.SMTP_USER,
                  to: user.email_address,
                  subject: "Project Request | Decision 168",
                  html: generateProjectRequestEmailTemplate(
                    userFName,
                    pownerFName,
                    sp.pname,
                    PortfolioName,
                    short_pdes,
                    acceptRequest,
                    rejectRequest,
                    position
                  ),
                };

                transporter.sendMail(mailOptions2, (error, info) => {
                  if (error) {
                    res.status(500).json({
                      error: "Failed to send invitation.",
                    });
                  } else {
                    res.status(201).json({
                      message: "Project invitation sent to your email.",
                    });
                  }
                });
              } else {
                const position = "team member";
                const mailOptions2 = {
                  from: process.env.SMTP_USER,
                  to: user.email_address,
                  subject: "Project Request | Decision 168",
                  html: generateProjectRequestEmailTemplate(
                    userFName,
                    pownerFName,
                    sp.pname,
                    PortfolioName,
                    short_pdes,
                    acceptRequest,
                    rejectRequest,
                    position
                  ),
                };

                transporter.sendMail(mailOptions2, (error, info) => {
                  if (error) {
                    res.status(500).json({
                      error: "Failed to send invitation.",
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
          const [p_tasksRes] = await pool.execute("CALL pro_all_tasks(?)", [
            sp.pid,
          ]);
          const p_tasks = p_tasksRes[0];
          if (p_tasks && p_tasks.length > 0) {
            for (const pt of p_tasks) {
              const project_name = sp.pname;
              const letter = project_name.trim().substring(0, 2).toUpperCase();
              const random_num = Math.floor(Math.random() * 10000) + 1;
              const get_tcode = `${letter}-${random_num}`;
              const data8 = {
                gid: getKPI.gid,
                sid: getKPI.sid,
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
                portfolio_id: getKPI.portfolio_id,
                tassignee: pt.tassignee,
                tcreated_by: screated_by,
                tcreated_date: formattedDate,
                tnotify: "yes",
                tnotify_clear: "no",
                tnotify_date: formattedDate,
                tdue_date: pt.tdue_date,
                tdue_date_clear: "no",
                dept_id: getKPI.gdept_id,
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
              const [getTaskRes] = await pool.execute(
                "CALL GetInsertedTask(?)",
                [screated_by]
              );
              const getTask = getTaskRes[0][0];

              const hdata9 = {
                pid: getProject.pid,
                sid: getKPI.sid,
                gid: getKPI.gid,
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
                  const project_name = sp.pname;
                  const letter = project_name
                    .trim()
                    .substring(0, 2)
                    .toUpperCase();
                  const random_num = Math.floor(Math.random() * 10000) + 1;
                  const get_stcode = `${letter}-${random_num}`;

                  const data9 = {
                    tid: getTask.tid,
                    gid: getKPI.gid,
                    sid: getKPI.sid,
                    stproject_assign: getProject.pid,
                    portfolio_id: getKPI.portfolio_id,
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
                    stcreated_by: screated_by,
                    stcreated_date: formattedDate,
                    stnotify: "yes",
                    stnotify_clear: "no",
                    stnotify_date: formattedDate,
                    stdue_date: ts.stdue_date,
                    stdue_date_clear: "no",
                    dept_id: getKPI.gdept_id,
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
                    [screated_by]
                  );
                  const getSubtask = getSubtaskRes[0][0];

                  const hdata10 = {
                    pid: getProject.pid,
                    sid: getKPI.sid,
                    gid: getKPI.gid,
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
    }

    if (copy_detail == "custom") {
      if (cust_strategy == "1") {
        //Import Strategies with Projects Only
        //projects
        const [s_projectsRes] = await pool.execute(
          "CALL StrategyAllProjectsListASC(?)",
          [sid]
        );
        const s_projects = s_projectsRes[0];

        if (s_projects && s_projects.length > 0) {
          for (const sp of s_projects) {
            const insertProjectFields = {
              gid: getKPI.gid,
              sid: getKPI.sid,
              ptype: sp.ptype,
              p_publish: sp.p_publish,
              pname: sp.pname,
              pdes: sp.pdes,
              plink: sp.plink,
              plink_comment: sp.plink_comment,
              pmanager: sp.pmanager,
              pcreated_by: screated_by,
              pcreated_date: formattedDate,
              portfolio_id: getKPI.portfolio_id,
              dept_id: getKPI.gdept_id,
            };

            const paramNamesString =
              Object.keys(insertProjectFields).join(", ");
            const paramValuesString = Object.values(insertProjectFields)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL = `CALL InsertProject(?, ?)`;
            await pool.execute(callProcedureSQL, [
              paramNamesString,
              paramValuesString,
            ]);

            const [getProjectRes] = await pool.execute(
              "CALL GetInsertedProject(?)",
              [screated_by]
            );
            const getProject = getProjectRes[0][0];

            const hdata = {
              pid: getProject.pid,
              sid: getKPI.sid,
              gid: getKPI.gid,
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
          }
        }
      }

      if (cust_strategy == "2") {
        //Import Strategies with Projects, Task & Its Subtask without assignee
        //projects
        const [s_projectsRes] = await pool.execute(
          "CALL StrategyAllProjectsListASC(?)",
          [sid]
        );
        const s_projects = s_projectsRes[0];

        if (s_projects && s_projects.length > 0) {
          for (const sp of s_projects) {
            const insertProjectFields = {
              gid: getKPI.gid,
              sid: getKPI.sid,
              ptype: sp.ptype,
              p_publish: sp.p_publish,
              pname: sp.pname,
              pdes: sp.pdes,
              plink: sp.plink,
              plink_comment: sp.plink_comment,
              pmanager: sp.pmanager,
              pcreated_by: screated_by,
              pcreated_date: formattedDate,
              portfolio_id: getKPI.portfolio_id,
              dept_id: getKPI.gdept_id,
            };

            const paramNamesString =
              Object.keys(insertProjectFields).join(", ");
            const paramValuesString = Object.values(insertProjectFields)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL = `CALL InsertProject(?, ?)`;
            await pool.execute(callProcedureSQL, [
              paramNamesString,
              paramValuesString,
            ]);

            const [getProjectRes] = await pool.execute(
              "CALL GetInsertedProject(?)",
              [screated_by]
            );
            const getProject = getProjectRes[0][0];

            const hdata = {
              pid: getProject.pid,
              sid: getKPI.sid,
              gid: getKPI.gid,
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

            //Check Project Tasks
            const [p_tasksRes] = await pool.execute("CALL pro_all_tasks(?)", [
              sp.pid,
            ]);
            const p_tasks = p_tasksRes[0];
            if (p_tasks && p_tasks.length > 0) {
              for (const pt of p_tasks) {
                const project_name = sp.pname;
                const letter = project_name
                  .trim()
                  .substring(0, 2)
                  .toUpperCase();
                const random_num = Math.floor(Math.random() * 10000) + 1;
                const get_tcode = `${letter}-${random_num}`;
                const data8 = {
                  gid: getKPI.gid,
                  sid: getKPI.sid,
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
                  portfolio_id: getKPI.portfolio_id,
                  tassignee: screated_by,
                  tcreated_by: screated_by,
                  tcreated_date: formattedDate,
                  tnotify: "yes",
                  tnotify_clear: "no",
                  tnotify_date: formattedDate,
                  tdue_date: pt.tdue_date,
                  tdue_date_clear: "no",
                  dept_id: getKPI.gdept_id,
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
                const [getTaskRes] = await pool.execute(
                  "CALL GetInsertedTask(?)",
                  [screated_by]
                );
                const getTask = getTaskRes[0][0];

                const hdata9 = {
                  pid: getProject.pid,
                  sid: getKPI.sid,
                  gid: getKPI.gid,
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
                    const project_name = sp.pname;
                    const letter = project_name
                      .trim()
                      .substring(0, 2)
                      .toUpperCase();
                    const random_num = Math.floor(Math.random() * 10000) + 1;
                    const get_stcode = `${letter}-${random_num}`;

                    const data9 = {
                      tid: getTask.tid,
                      gid: getKPI.gid,
                      sid: getKPI.sid,
                      stproject_assign: getProject.pid,
                      portfolio_id: getKPI.portfolio_id,
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
                      stassignee: screated_by,
                      stcreated_by: screated_by,
                      stcreated_date: formattedDate,
                      stnotify: "yes",
                      stnotify_clear: "no",
                      stnotify_date: formattedDate,
                      stdue_date: ts.stdue_date,
                      stdue_date_clear: "no",
                      dept_id: getKPI.gdept_id,
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
                      [screated_by]
                    );
                    const getSubtask = getSubtaskRes[0][0];

                    const hdata10 = {
                      pid: getProject.pid,
                      sid: getKPI.sid,
                      gid: getKPI.gid,
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
      }
    }

    res.status(201).json({
      message: "KPI Copied successfully.",
      sid: getKPI.sid,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//gdetail_SuggestTMember
router.post(
  "/goal/insert-goal-suggest-team-member",
  authMiddleware,
  async (req, res) => {
    try {
      let { gid } = req.body;
      let { user_id } = req.body;
      const { team_member, imemail } = req.body;

      const formattedDate = dateConversion();

      const [check_powner] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const powner = check_powner[0][0];

      const [getGoalRes] = await pool.execute("CALL GoalDetail(?)", [gid]);
      const getGoal = getGoalRes[0][0];

      //insert suggest team member
      if (team_member && team_member.length > 0) {
        // Use forEach with async/await
        await Promise.all(
          team_member.map(async (t) => {
            const [checkgs_idRes] = await pool.execute(
              "CALL check_g_suggested(?,?)",
              [gid, t]
            );
            if (!checkgs_idRes[0] || checkgs_idRes[0].length === 0) {
              const data6 = {
                gid: gid,
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

              const callProcedureSQL6 = `CALL InsertGoalsSuggestedMembers(?, ?)`;
              await pool.execute(callProcedureSQL6, [
                paramNamesString6,
                paramValuesString6,
              ]);

              const [check_user] = await pool.execute(
                "CALL getStudentById(?)",
                [t]
              );
              const user = check_user[0][0];

              const [getgs_id] = await pool.execute(
                "CALL check_g_suggested(?,?)",
                [gid, t]
              );
              const gs_id = getgs_id[0][0]?.gs_id;

              const hdata7 = {
                gid: gid,
                h_date: formattedDate,
                h_resource_id: powner.reg_id,
                h_resource: `${powner.first_name} ${powner.last_name}`,
                h_description: `${user.first_name} ${user.last_name} is suggested by ${powner.first_name} ${powner.last_name}`,
                gmsuggested_id: gs_id,
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
              if (getGoal.pcreated_by != rid) {
                const [checkgs_idRes] = await pool.execute(
                  "CALL check_g_suggested(?,?)",
                  [gid, t]
                );

                if (!checkgs_idRes[0] || checkgs_idRes[0].length === 0) {
                  const data6 = {
                    gid: gid,
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

                  const callProcedureSQL6 = `CALL InsertGoalsSuggestedMembers(?, ?)`;
                  await pool.execute(callProcedureSQL6, [
                    paramNamesString6,
                    paramValuesString6,
                  ]);

                  const [check_user] = await pool.execute(
                    "CALL getStudentById(?)",
                    [t]
                  );
                  const user = check_user[0][0];

                  const [getgs_id] = await pool.execute(
                    "CALL check_g_suggested(?,?)",
                    [gid, t]
                  );
                  const gs_id = getgs_id[0][0]?.gs_id;

                  const hdata7 = {
                    gid: gid,
                    h_date: formattedDate,
                    h_resource_id: powner.reg_id,
                    h_resource: `${powner.first_name} ${powner.last_name}`,
                    h_description: `${user.first_name} ${user.last_name} is suggested by ${powner.first_name} ${powner.last_name}`,
                    gmsuggested_id: gs_id,
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
                [im, gid]
              );
              if (check_email[0].length == 0) {
                const [checkgs_idRes] = await pool.execute(
                  "CALL check_g_suggested(?,?)",
                  [gid, im]
                );

                if (!checkgs_idRes[0] || checkgs_idRes[0].length === 0) {
                  const data10 = {
                    gid: gid,
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

                  const callProcedureSQL10 = `CALL InsertGoalsSuggestedMembers(?, ?)`;
                  await pool.execute(callProcedureSQL10, [
                    paramNamesString10,
                    paramValuesString10,
                  ]);

                  const [getgs_id] = await pool.execute(
                    "CALL check_g_suggested(?,?)",
                    [gid, im]
                  );
                  const gs_id = getgs_id[0][0]?.gs_id;

                  const hdata11 = {
                    gid: gid,
                    h_date: formattedDate,
                    h_resource_id: powner.reg_id,
                    h_resource: `${powner.first_name} ${powner.last_name}`,
                    h_description: `${im} is suggested by ${powner.first_name} ${powner.last_name}`,
                    gmsuggested_id: gs_id,
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
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

//getGoalCreateDD
router.get(
  "/goal/get-goal-create-dd/:portfolio_id/:user_id",
  authMiddleware,
  async (req, res) => {
    const { portfolio_id, user_id } = req.params;
    try {
      const [PortfolioDepartment] = await pool.execute(
        "CALL get_PortfolioDepartment(?)",
        [portfolio_id]
      );
      const Deptpromises = PortfolioDepartment[0].map(async (item) => {
        const { department } = item;
        const label = department;
        const data = {
          ...item,
          label,
        };

        return data;
      });

      const PortfolioDepartmentResults = await Promise.all(Deptpromises);

      const [AssignList] = await pool.execute("CALL getAccepted_PortTM(?)", [
        portfolio_id,
      ]);
      const promises = AssignList[0].map(async (item) => {
        const { sent_to } = item;

        const [getName] = await pool.execute("CALL selectLogin(?)", [sent_to]);
        let data;
        let label = "";
        if (getName && getName[0] && getName[0][0]) {
          if (user_id == getName[0][0].reg_id) {
            label = "Assign To Me";
          } else {
            label = getName[0][0].first_name + " " + getName[0][0].last_name;
          }

          const member_reg_id = getName[0][0].reg_id;
          data = {
            sent_to,
            label,
            member_reg_id,
          };
        }
        return data;
      });

      const AssignManagerListResults = await Promise.all(promises);
      const AssignManagerListRes = AssignManagerListResults.filter(Boolean);

      const mempromises = AssignList[0].map(async (item) => {
        const { sent_to } = item;

        const [getName] = await pool.execute("CALL selectLogin(?)", [sent_to]);
        let data2;
        let name = "";
        if (getName && getName[0] && getName[0][0]) {
          if (user_id != getName[0][0].reg_id) {
            name = getName[0][0].first_name + " " + getName[0][0].last_name;
            const id = getName[0][0].reg_id;
            data2 = {
              sent_to,
              name,
              id,
            };
          }
        }
        return data2;
      });

      const AssignMemberListResults = await Promise.all(mempromises);
      const AssignMemberListRes = AssignMemberListResults.filter(Boolean);

      return res.status(200).json({
        PortfolioDepartmentRes: PortfolioDepartmentResults,
        AssignManagerListRes: AssignManagerListRes,
        AssignMemberListRes: AssignMemberListRes,
      });
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//(only for asignee dropdown ) goal team members without read_more status
router.get("/goal/goal-team-member/:gid", authMiddleware, async (req, res) => {
  const { gid } = req.params;
  try {
    const [rows, fields] = await pool.execute("CALL GoalTeamMember(?)", [gid]);

    // Filter out objects with "status": "read_more"
    const filteredRows = rows[0].filter((row) => row.status !== "read_more");

    // Create a new array with modified structure
    const modifiedRows = filteredRows.map((row) => ({
      reg_id: row?.reg_id,
      name: `${row?.first_name} ${row?.last_name}`,
      photo: row?.photo,
      gmid: row?.gmid,
      status: row?.status,
      gmember: row?.gmember,
    }));

    res.status(200).json(modifiedRows);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get Goal details

router.get("/goal/goal-details/:gid", authMiddleware, async (req, res) => {
  const { gid } = req.params;
  try {
    const [rows] = await pool.execute("CALL GoalDetail(?)", [gid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
