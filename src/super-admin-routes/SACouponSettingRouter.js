const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const {
  convertObjectToProcedureParams,
  dateConversion,
} = require("../utils/common-functions");

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
router.get(
  "/coupon-setting/get-coupon-and-package-detail/:co_id",
  async (req, res) => {
    try {
      const { co_id } = req.params;

      const [rows1] = await pool.execute("Call SAcoupon_detail(?)", [co_id]);
      const couponDetail = rows1[0];

      const [rows2] = await pool.execute("Call SApackage_detail(?)", [
        couponDetail[0]?.pack_id,
      ]);
      const packageDetail = rows2[0];

      res.status(200).json({
        couponDetailResult: couponDetail,
        packageDetailResult: packageDetail,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//insert_coupon
router.post("/coupon-setting/insert-coupon", async (req, res) => {
  try {
    const { pack_validity } = req.body;
    const { code, created_by, co_limit, ...otherFields } = req.body;

    const formattedDate = dateConversion();

    const additionalFields = {
      stripe_link: "no",
      pack_price: "0",
      pack_created_date: formattedDate,
      pack_status: "active",
      custom_pack: "no",
      coupon_pack: "yes",
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

    const callProcedureSQL = `CALL SAInsertPackage(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [getPackage] = await pool.execute("CALL SAInsertedPackage()");
    const pack_id = getPackage[0][0]?.pack_id;

    const InsertFields = {
      pack_id: pack_id,
      portfolio: "portfolio",
      goals: "goals",
      goals_strategies: "KPIs per goal",
      goals_strategies_projects: "projects per KPIs",
      projects: "active projects",
      team_members: "team members",
      task: "task",
      storage: "storage",
      accountability_tracking: "accountability tracking",
      document_collaboration: "document collaboration",
      kanban_boards: "kanban boards",
      motivator: "motivator",
      internal_chat: "internal chat",
      content_planner: "posts / mo. content planner",
      data_recovery: "data recovery",
      email_support: "24/7 email support",
    };
    const paramNamesString2 = Object.keys(InsertFields).join(", ");
    const paramValuesString2 = Object.values(InsertFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL2 = `CALL SAInsertPricingLabels(?, ?)`;
    await pool.execute(callProcedureSQL2, [
      paramNamesString2,
      paramValuesString2,
    ]);

    const InsertFields3 = {
      code: code,
      co_validity: pack_validity,
      created_by: created_by,
      created_date: formattedDate,
      co_status: "active",
      co_limit: co_limit,
      pack_id: pack_id,
    };
    const paramNamesString3 = Object.keys(InsertFields3).join(", ");
    const paramValuesString3 = Object.values(InsertFields3)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL3 = `CALL SAInsertCoupon(?, ?)`;
    await pool.execute(callProcedureSQL3, [
      paramNamesString3,
      paramValuesString3,
    ]);

    res.status(200).json({
      message: "Coupon Added Successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//edit_coupon
router.patch("/coupon-setting/edit-coupon", async (req, res) => {
  try {
    const { pack_validity } = req.body;
    const { pack_id, co_id, code, co_limit, ...otherFields } = req.body;

    const additionalFields = {
      pack_price: 0,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };

    const formattedParams = convertObjectToProcedureParams(
      requestBodyWithAdditionalFields
    );

    const storedProcedure = `CALL SAEditPackage('${formattedParams}', 'pack_id = ${pack_id}')`;
    await pool.execute(storedProcedure);

    const dynamicFieldsValues = `code = '${code}',
                                 co_validity = '${pack_validity}',
                                 co_limit = '${co_limit}'`;
    const id = `co_id  = '${co_id}'`;
    await pool.execute("CALL SAEditCoupon(?, ?)", [dynamicFieldsValues, id]);

    res.status(200).json({
      message: "Coupon Updated Successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
