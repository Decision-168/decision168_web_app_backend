const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams, dateConversion, transporter } = require("../utils/common-functions");
const generateEmailTemplate = require("../utils/emailTemplate");

// get all tickets
router.get("/super-admin/get-all-tickets", async (req, res) => {
  try {
    const [rows1] = await pool.execute("Call SAgetAllTickets()");
    const allTickets = rows1[0];

    res.status(200).json(allTickets);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get user by reg_id
router.get("/super-admin/get-user/:reg_id", async (req, res) => {
  try {
    const { reg_id } = req.params;

    const [rows1] = await pool.execute("Call SAgetStudentById(?)", [reg_id]);
    const user = rows1[0][0];

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get supporter list
router.get("/super-admin/get-all-supporter", async (req, res) => {
  try {
    const [rows2] = await pool.execute("Call SAgetSupporters()");
    const supportersList = rows2[0];

    res.status(200).json(supportersList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get ticket detail by ticket_id
router.get("/ticket-management/get-ticket-detail/:ticket_id", async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const [rows1] = await pool.execute("Call SAgetTicketById(?)", [ticket_id]);
    const ticketDetail = rows1[0][0];

    res.status(200).json(ticketDetail);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// assign ticket to supporter
router.patch("/ticket-management/assign-ticket", async (req, res) => {
  try {
    const { ticket_id, supporter_id } = req.body;

    const [rows1] = await pool.execute("Call SAgetTicketById(?)", [ticket_id]);
    const ticket_del = rows1[0][0];
    console.log(ticket_del.unique_id);

    const [rows2] = await pool.execute("Call SAgetStudentById(?)", [supporter_id]);
    const stud_del = rows2[0][0];
    console.log(stud_del.first_name);

    const formattedDate = dateConversion();

    let notify = ticket_del.notify || "";
    notify += (notify !== "" ? "," : "") + "ticket_assigned";

    const data = {
      status: "assigned",
      assignee: supporter_id,
      assigned_date: formattedDate,
      assigned_by: 0,
      notify: notify,
      notify_date: formattedDate,
    };

    const formattedParams = convertObjectToProcedureParams(data);
    const storedProcedure = "CALL SAUpdateTicket(?, ?)";
    await pool.execute(storedProcedure, [formattedParams, `ticket_id = ${ticket_id}`]);

    const hdata = {
      ticket_id: ticket_id,
      assignee_id: supporter_id,
      assigned_by: 0,
      h_description: "Assigned the Ticket",
      h_date: formattedDate,
    };

    const paramNamesString1 = Object.keys(hdata).join(", ");
    const paramValuesString1 = Object.values(hdata)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL1 = `CALL SAInsertTicketHistory(?, ?)`;
    await pool.execute(callProcedureSQL1, [paramNamesString1, paramValuesString1]);

    const signIn = `http://localhost:3000/super-admin/login`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: stud_del.email_address,
      subject: "Ticket Assigned By Support Admin| Decision 168",
      html: generateEmailTemplate(
        `Hello ${stud_del.first_name} ${stud_del.last_name}. Support Admin has assigned a new ticket T-${ticket_del.unique_id} for Support.`,
        `Please Sign In to resolve the ticket. <a href="${signIn}">Sign In</a>`
      ),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).json({
          error: "Failed to send email.",
        });
      } else {
        res.status(201).json({
          status: "assigned",
          username: `${stud_del.first_name} ${stud_del.last_name}`,
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete ticket
router.patch("/ticket-management/delete-ticket", async (req, res) => {
  try {
    const { id } = req.body;

    const otherFields = {
      deleted: 1,
    };

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAUpdateTicket('${formattedParams}', 'ticket_id = ${id}')`;
    await pool.execute(storedProcedure);

    return res.status(200).json({ message: "Ticket deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update ticket chat notify
router.patch("/ticket-management/update-ticket-chat-notify", async (req, res) => {
  try {
    const { id } = req.body;

    const formattedDate = dateConversion();

    const otherFields = {
      notify: 1,
      notify_date: formattedDate,
    };

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAUpdateTicketChatNotify('${formattedParams}', 'ticket_id = ${id}')`;
    await pool.execute(storedProcedure);

    return res.status(200).json({ message: "Updated ticket chat notify successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get ticket messages by ticket_id
router.get("/ticket-management/get-ticket-messages", async (req, res) => {
  try {
    const { ticket_id } = req.body;

    const [rows1] = await pool.execute("Call SAgetTicketMessages(?)", [ticket_id]);
    const ticketMessages = rows1[0];

    res.status(200).json(ticketMessages);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// insert ticket chat
router.post("/ticket-management/insert-ticket-chat", async (req, res) => {
  try {
    let { ticket_id, message } = req.body;

    const formattedDate = dateConversion();

    const additionalFields = {
      user_id: 0,
      user_role: "superadmin",
      status: "active",
      message_date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ticket_id,
      message,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(", ");
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL SAInsertTicketChat(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Ticket Chat Added successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
