const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

// get bell icon alert notifications
router.get("/super-admin/get-alert-notifications", async (req, res) => {
  try {
    // Admin approval notification
    const [rows1] = await pool.execute("CALL SAgetAdminApprovalNotify_clear()");
    const approvalNotification = rows1[0];

    // Notify Ticket Count
    const [rows2] = await pool.execute("CALL SAgetNotifyTicketCount()");
    const notifyTicketCount = rows2[0];

    // My Notified Tickets
    const [rows4] = await pool.execute("CALL SAgetMyNotifiedTickets()");
    const myNotifiedTickets = rows4[0];

    res.status(200).json({
      approvalNotificationResult: approvalNotification,
      notifyTicketCountResult: notifyTicketCount,
      myNotifiedTicketsResult: myNotifiedTickets,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get bell icon alert notifications by reg_id
router.get("/super-admin/get-alert-notifications/:reg_id", async (req, res) => {
  try {
    const { reg_id } = req.params;

    // Student By Id
    const [rows3] = await pool.execute("CALL SAgetStudentById(?)", [reg_id]);
    const studentById = rows3[0];

    res.status(200).json({
      studentByIdResult: studentById,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
