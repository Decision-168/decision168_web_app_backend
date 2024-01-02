const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams } = require("../utils/common-functions");

//get registered users count
router.get("/super-admin/get-registered-users-count", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAcount_registered_list()");
    const registeredUsersCount = rows[0][0].count_rows;
    res.status(200).json(registeredUsersCount);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get all registered users
router.get("/super-admin/get-all-registered-users", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAregistered_list()");
    const allRegisteredUsers = rows[0];

    res.status(200).json(allRegisteredUsers);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get user detail by reg_id
router.get("/super-admin/get-user-detail/:reg_id", async (req, res) => {
  const { reg_id } = req.params;
  try {
    const [rows] = await pool.execute("CALL SAget_User(?)", [reg_id]);
    const specificUser = rows[0][0];

    const [rows2] = await pool.execute("Call SApackage_detail(?)", [specificUser.package_id]);
    const packageDetail = rows2[0][0];

    res.status(200).json({ specificUser, packageDetail });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get all deactivated users
router.get("/super-admin/get-all-deactivated-users", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAdeactivated_users()");
    const allDeactivatedUsers = rows[0];
    res.status(200).json(allDeactivatedUsers);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get refund list
router.get("/super-admin/get-refund-list", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SArefund_list()");
    const refundList = rows[0];
    res.status(200).json(refundList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update refund status
router.patch("/refund/update-refund-status", async (req, res) => {
  try {
    const { reg_id } = req.body;

    const otherFields = {
      refund_status: "refund_succeeded",
    };
    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id  = ${reg_id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
});

module.exports = router;
