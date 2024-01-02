const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams, transporter, dateConversion } = require("../utils/common-functions");
const generateEmailTemplate = require("../utils/emailTemplate");

// get supporters
router.get("/super-admin/get-supporters", async (req, res) => {
  try {
    const [rows1] = await pool.execute("Call SAgetSupporters()");
    const supporters = rows1[0];

    res.status(200).json(supporters);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add supporter
router.post("/supporters/insert-supporter", async (req, res) => {
  try {
    // supporter_email = invite through email & selected_S_member = select dropdown
    const { supporter_email, selected_S_member } = req.body;
    const formattedDate = dateConversion();

    let supporterEmailArray = "";
    if (supporter_email || selected_S_member) {
      if (supporter_email) {
        supporterEmailArray = supporter_email;

        for (const sea of supporterEmailArray) {
          const [rows1] = await pool.execute("Call SAcheckIfSupporterByEmail(?)", [sea]);
          const supEA = rows1[0][0];
          if (supEA.num_rows) {
            res.json({ status: "already_supporter" });
            return;
          }

          const [rows2] = await pool.execute("Call SAcheckSupporterEmailExists1(?)", [sea]);
          const supEA1 = rows2[0][0];
          if (supEA1.num_rows) {
            res.json({ status: "already_invited" });
            return;
          }

          const [rows3] = await pool.execute("Call SAcheckSupporterEmailExists2(?)", [sea]);
          const supEA2 = rows3[0][0];
          if (supEA2.num_rows) {
            res.json({ status: "already_invited" });
            return;
          }
        }
      }

      if (selected_S_member) {
        const supporterMemberArray = selected_S_member;

        for (const sma of supporterMemberArray) {
          const [rows4] = await pool.execute("Call SAcheckSupporterIDExists(?)", [sma]);
          const supEA3 = rows4[0][0];
          if (supEA3.num_rows) {
            res.json({ status: "already_invited" });
            return;
          }
        }

        for (const sma of supporterMemberArray) {
          const data = {
            supporter_mail: 1,
            supporter_approve: "",
            supporter_status: "active",
            supporter_mail_date: formattedDate,
          };

          const formattedParams = convertObjectToProcedureParams(data);

          const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id = ${sma}')`;
          await pool.execute(storedProcedure);

          const [rows5] = await pool.execute("Call SAgetStudentById(?)", [sma]);
          const stud_del = rows5[0][0];

          const acceptRequest = `http://localhost:3000/supporter-invitation/approve/${sma}`;
          const rejectRequest = `http://localhost:3000/supporter-invitation/deny/${sma}`;
          const mailOptions = {
            from: process.env.SMTP_USER,
            to: "shahanawaz2299@gmail.com", //stud_del.email_address
            subject: "Invitation to be Supporter | Decision 168",
            html: generateEmailTemplate(
              `Hello ${stud_del.first_name} ${stud_del.last_name}. Support Admin has requested you to be a supporter of Decision168 platform. Please click on the appropriate button below to the approve the request.`,
              `<a href="${acceptRequest}">Approve</a> <a href="${rejectRequest}">Deny</a>`
            ),
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              res.status(500).json({
                error: "Failed to send supporter invitation email.",
              });
            } else {
              res.status(201).json({
                message: "Supporter Added successfully!",
              });
            }
          });
        }
      }

      if (supporter_email) {
        supporterEmailArray = supporter_email;

        for (const sea of supporterEmailArray) {
          const [rows5] = await pool.execute("Call SAcheckIfSupporterEmailExists(?)", [sea]);
          const email_exists = rows5[0][0];
          if (email_exists) {
            const reg_id = email_exists.reg_id;
            const data = {
              supporter_mail: 1,
              supporter_approve: "",
              supporter_status: "active",
              supporter_mail_date: formattedDate,
            };

            const formattedParams = convertObjectToProcedureParams(data);

            const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id = ${reg_id}')`;
            await pool.execute(storedProcedure);

            const [rows6] = await pool.execute("Call SAgetStudentById(?)", [reg_id]);
            const stud_del = rows6[0][0];

            const acceptRequest = `http://localhost:3000/supporter-invitation/approve/${reg_id}`;
            const rejectRequest = `http://localhost:3000/supporter-invitation/deny/${reg_id}`;
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: "shahanawaz2299@gmail.com", //stud_del.email_address
              subject: "Invitation to be Supporter | Decision 168",
              html: generateEmailTemplate(
                `Hello ${stud_del.first_name} ${stud_del.last_name}. Support Admin has requested you to be a supporter of Decision168 platform. Please click on the appropriate button below to the approve the request.`,
                `<a href="${acceptRequest}">Approve</a> <a href="${rejectRequest}">Deny</a>`
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send supporter invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "Supporter Added successfully!",
                });
              }
            });
          } else {
            const additionalFields = {
              email_address: sea,
              approve: "",
              sent_on: formattedDate,
            };

            const requestBodyWithAdditionalFields = {
              ...additionalFields,
            };
            const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(", ");
            const paramValuesString = Object.values(requestBodyWithAdditionalFields)
              .map((value) => `'${value}'`)
              .join(", ");

            const callProcedureSQL = `CALL SAInsertInviteSupporter(?, ?)`;
            await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

            const acceptRequest = `http://localhost:3000/supporter-invitation-through-email/approve/${sea}`;
            const rejectRequest = `http://localhost:3000/supporter-invitation-through-email/deny/${sea}`;
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: "shahanawaz2299@gmail.com", //sea
              subject: "Invitation to be Supporter | Decision 168",
              html: generateEmailTemplate(
                `Hello ${sea}. Support Admin has requested you to be a supporter of Decision168 platform. Please click on the appropriate button below to the approve the request.`,
                `<a href="${acceptRequest}">Approve</a> <a href="${rejectRequest}">Deny</a>`
              ),
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({
                  error: "Failed to send supporter invitation email.",
                });
              } else {
                res.status(201).json({
                  message: "Supporter Added successfully!",
                });
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// update supporter invitation status (approve/deny)
router.get("/supporter-invitation/:status/:reg_id", async (req, res) => {
  const { status, reg_id } = req.params;

  const [rows1] = await pool.execute("Call SAcheckIfSupporterApprove(?)", [reg_id]);
  const checkApprove = rows1[0][0];

  const [rows2] = await pool.execute("Call SAcheckIfSupporterDeny(?)", [reg_id]);
  const checkDeny = rows2[0][0];

  if (status == "approve") {
    if (checkApprove.num_rows) {
      res.status(200).json({ invite_status: "already_approved" });
    } else if (checkDeny.num_rows) {
      res.status(200).json({ invite_status: "already_denied" });
    } else {
      const updateData = {
        supporter_approve: "yes",
        role: "supporter",
        supporter_status: "active",
      };

      const formattedParams = convertObjectToProcedureParams(updateData);
      const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id = ${reg_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ invite_status: "approved" });
    }
  } else {
    if (checkApprove.num_rows) {
      res.status(200).json({ invite_status: "already_approved" });
    } else if (checkDeny.num_rows) {
      res.status(200).json({ invite_status: "already_denied" });
    } else {
      const updateData = {
        supporter_approve: "no",
        supporter_status: "",
      };

      const formattedParams = convertObjectToProcedureParams(updateData);
      const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id = ${reg_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ invite_status: "denied" });
    }
  }
});

// update supporter invitation through email status (approve/deny)
router.get("/supporter-invitation-through-email/:status/:email_address", async (req, res) => {
  const { status, email_address } = req.params;

  const [rows1] = await pool.execute("Call SAcheckIfSupporterEmailExists(?)", [email_address]);
  const email_exists = rows1[0][0];

  if (email_exists) {
    const reg_id = email_exists.reg_id;

    if (status == "approve") {
      const [rows2] = await pool.execute("Call SAcheckIfSupporterApprove(?)", [reg_id]);
      const checkApprove = rows2[0][0];

      const [rows3] = await pool.execute("Call SAcheckIfSupporterDeny(?)", [reg_id]);
      const checkDeny = rows3[0][0];

      if (checkApprove.num_rows) {
        res.status(200).json({ invite_status: "already_approved" });
      } else if (checkDeny.num_rows) {
        res.status(200).json({ invite_status: "already_denied" });
      } else {
        const updateData = {
          supporter_mail: "1",
          role: "supporter",
          supporter_approve: "yes",
          supporter_status: "active",
        };

        const formattedParams = convertObjectToProcedureParams(updateData);
        const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id = ${reg_id}')`;
        await pool.execute(storedProcedure);

        const approveData = {
          approve: "yes",
        };

        const formattedParamsInvitedSupporter = convertObjectToProcedureParams(approveData);
        const storedProcedureInvitedSupporter = `CALL SAUpdateInvitedSupporter('${formattedParamsInvitedSupporter}', 'email_address = "${email_address}"')`;
        await pool.execute(storedProcedureInvitedSupporter);

        res.status(200).json({ invite_status: "approved" });
      }
    } else {
      const [rows4] = await pool.execute("Call SAcheckIfSupporterApprove(?)", [reg_id]);
      const checkApprove = rows4[0][0];

      const [rows5] = await pool.execute("Call SAcheckIfSupporterDeny(?)", [reg_id]);
      const checkDeny = rows5[0][0];

      if (checkApprove.num_rows) {
        res.status(200).json({ invite_status: "already_approved" });
      } else if (checkDeny.num_rows) {
        res.status(200).json({ invite_status: "already_denied" });
      } else {
        const updateData = {
          supporter_approve: "no",
          supporter_status: "",
        };

        const formattedParams = convertObjectToProcedureParams(updateData);
        const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id = ${reg_id}')`;
        await pool.execute(storedProcedure);

        res.status(200).json({ invite_status: "denied" });
      }
    }
  } else {
    if (status == "approve") {
      const [rows6] = await pool.execute("Call SAcheckIfSupporterEmailApprove(?)", [email_address]);
      const checkApprove = rows6[0][0];

      const [rows7] = await pool.execute("Call SAcheckIfSupporterEmailDeny(?)", [email_address]);
      const checkDeny = rows7[0][0];

      if (checkApprove.num_rows) {
        res.status(200).json({ invite_status: "already_approved" });
      } else if (checkDeny.num_rows) {
        res.status(200).json({ invite_status: "already_denied" });
      } else {
        const approveData = {
          approve: "yes",
        };

        const formattedParams = convertObjectToProcedureParams(approveData);
        const storedProcedure = `CALL SAUpdateInvitedSupporter('${formattedParams}', 'email_address = "${email_address}"')`;
        await pool.execute(storedProcedure);

        res.status(200).json({ invite_status: "approved" });
      }
    } else {
      const [rows8] = await pool.execute("Call SAcheckIfSupporterEmailApprove(?)", [email_address]);
      const checkApprove = rows8[0][0];

      const [rows9] = await pool.execute("Call SAcheckIfSupporterEmailDeny(?)", [email_address]);
      const checkDeny = rows9[0][0];

      if (checkApprove.num_rows) {
        res.status(200).json({ invite_status: "already_approved" });
      } else if (checkDeny.num_rows) {
        res.status(200).json({ invite_status: "already_denied" });
      } else {
        const denyData = {
          approve: "no",
        };

        const formattedParams = convertObjectToProcedureParams(denyData);
        const storedProcedure = `CALL SAUpdateInvitedSupporter('${formattedParams}', 'email_address = "${email_address}"')`;
        await pool.execute(storedProcedure);

        res.status(200).json({ invite_status: "denied" });
      }
    }
  }
});

// update supporter status (active/inactive)
router.patch("/supporters/update-supporter-status", async (req, res) => {
  try {
    const { reg_id } = req.body;

    const [rows1] = await pool.execute("Call SAgetStudentById(?)", [reg_id]);
    const stud_del = rows1[0][0];

    if (stud_del.supporter_approve == "no") {
      data = {
        supporter_mail: 0,
        supporter_mail_date: "0000-00-00 00:00:00",
        supporter_approve: "",
        supporter_status: "",
      };
    } else {
      if (stud_del.supporter_status == "inactive") {
        data = {
          supporter_status: "active",
        };
      } else {
        data = {
          supporter_status: "inactive",
        };
      }
    }

    const formattedParams = convertObjectToProcedureParams(data);

    const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id  = ${reg_id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "Supporter Status updated successfully!" });
  } catch (error) {
    console.error("Error updating expert status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get supporter detail
router.get("/supporters/get-supporter-detail/:reg_id", async (req, res) => {
  try {
    const { reg_id } = req.params;

    const [rows1] = await pool.execute("Call SAget_User(?)", [reg_id]);
    const supporterDetail = rows1[0][0];

    const [rows2] = await pool.execute("Call SAuser_activity(?)", [reg_id]);
    const lastFiveActivities = rows2[0];

    const [rows3] = await pool.execute("Call SApackage_detail(?)", [supporterDetail?.package_id]);
    const packageDetail = rows3[0][0];

    const [rows4] = await pool.execute("Call SAgetCountryByCode(?)", [supporterDetail?.country]);
    const country = rows4[0][0];

    res.status(200).json({
      supporterDetailResult: supporterDetail,
      lastFiveActivitiesResult: lastFiveActivities,
      packageDetailResult: packageDetail,
      countryResult: country,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get invited email addresses
router.get("/super-admin/get-invited-email-addresses", async (req, res) => {
  try {
    const [rows1] = await pool.execute("Call SAregistered_supporter_emails()");
    const invitedEmailAddresses = rows1[0];

    res.status(200).json(invitedEmailAddresses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete invited supporter (remove button)
router.delete("/supporters/delete-invited-supporter", async (req, res) => {
  try {
    const { id } = req.body;

    const del1 = `invite_id = '${id}'`;
    await pool.execute("CALL SADeleteInvitedSupporter(?)", [del1]);

    return res.status(200).json({ message: "Invited Supporter deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
