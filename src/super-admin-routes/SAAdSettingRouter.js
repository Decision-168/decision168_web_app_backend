const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { dateConversion, convertObjectToProcedureParams } = require("../utils/common-functions");

// get ad list
router.get("/super-admin/get-ad-list", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAad_list()");
    const adList = rows[0];
    res.status(200).json(adList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// insert ad
router.post("/ad-setting/insert-ad", async (req, res) => {
  try {
    let { ad, pack_id } = req.body;

    const formattedDate = dateConversion();

    const additionalFields = {
      acreated_date: formattedDate,
      astatus: "inactive",
    };

    const requestBodyWithAdditionalFields = {
      ad,
      pack_id,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(", ");
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL SAInsertAd(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Ad uploaded successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// update status of specific ad (active/inactive)
router.patch("/ad-setting/update-ad-status", async (req, res) => {
  try {
    const { id, status } = req.body;

    if (status == "active") {
      const setClause = "astatus = 'inactive'";
      await pool.execute("CALL SAUpdateAllAd(?)", [setClause]);
    }

    const dataSpecific = {
      astatus: status,
    };
    const formattedParams = convertObjectToProcedureParams(dataSpecific);

    const storedProcedure = `CALL SAUpdateAdSpecfic('${formattedParams}', 'aid  = ${id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "Ad status updated successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete ad
router.delete("/ad-setting/delete-ad/:aid", async (req, res) => {
  try {
    const { aid } = req.params;
    const del1 = `aid = '${aid}'`;
    await pool.execute("CALL SADeleteAd(?)", [del1]);

    return res.status(200).json({ message: "Ad deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
