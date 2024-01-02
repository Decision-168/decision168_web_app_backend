const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams } = require("../utils/common-functions");

// get coupon list
router.get("/super-admin/get-coupon-list", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAcoupon_list()");
    const couponList = rows[0];
    res.status(200).json(couponList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get coupon and package details
router.get("/coupon-setting/get-coupon-and-package-detail/:co_id", async (req, res) => {
  try {
    const { co_id } = req.params;

    const [rows1] = await pool.execute("Call SAcoupon_detail(?)", [co_id]);
    const couponDetail = rows1[0];

    const [rows2] = await pool.execute("Call SApackage_detail(?)", [couponDetail[0]?.pack_id]);
    const packageDetail = rows2[0];

    res.status(200).json({
      couponDetailResult: couponDetail,
      packageDetailResult: packageDetail,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update status of specific coupon (active/inactive)
router.patch("/coupon-setting/update-coupon-status", async (req, res) => {
  try {
    const { id, status } = req.body;

    const dataSpecific = {
      co_status: status,
    };
    const formattedParams = convertObjectToProcedureParams(dataSpecific);

    const storedProcedure = `CALL SAEditCoupon('${formattedParams}', 'co_id  = ${id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "Coupon Status updated successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
