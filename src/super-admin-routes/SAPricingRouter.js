const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams } = require("../utils/common-functions");

// get pricing list
router.get("/pricing/get-pricing-list", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SApricing_list()");
    const pricingList = rows[0];
    res.status(200).json(pricingList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get package detail
router.get("/pricing/get-package-detail/:pack_id", async (req, res) => {
  try {
    const { pack_id } = req.params;

    const [rows] = await pool.execute("Call SApackage_detail(?)", [pack_id]);
    const packageDetail = rows[0];

    res.status(200).json(packageDetail);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update package status (active/inactive)
router.patch("/pricing/update-package-status", async (req, res) => {
  try {
    const { pack_id, status } = req.body;

    const [rows1] = await pool.execute("Call SApackage_detail(?)", [pack_id]);
    const packageDetail = rows1[0][0];

    if (packageDetail) {
      if (packageDetail.custom_pack == "yes") {
        const ccdata2 = {
          cc_status: status,
        };

        const formattedParams = convertObjectToProcedureParams(ccdata2);
        const storedProcedure = `CALL SAUpdateContactedCompany('${formattedParams}', 'contacted_sales_id = ${packageDetail.custom_cid}')`;
        await pool.execute(storedProcedure);
      }

      const data2 = {
        pack_status: status,
      };

      const formattedParams = convertObjectToProcedureParams(data2);
      const storedProcedure = `CALL SAEditPackage('${formattedParams}', 'pack_id  = ${pack_id}')`;
      await pool.execute(storedProcedure);
    }

    res.status(200).json({ message: "Pack Status updated successfully!" });
  } catch (error) {
    console.error("Error updating pack status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
