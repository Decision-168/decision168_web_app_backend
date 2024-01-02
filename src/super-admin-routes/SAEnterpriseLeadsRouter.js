const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams } = require("../utils/common-functions");

// get contacted sales list
router.get("/super-admin/get-contacted-sales-list", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAcontacted_sales_list()");
    const contactedSalesList = rows[0];
    res.status(200).json(contactedSalesList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get contacted company and it's package detail
router.get("/enterprise-leads/get-contacted-company-and-package-detail/:cid", async (req, res) => {
  const { cid } = req.params;
  try {
    const [rows1] = await pool.execute("CALL SAget_contacted_company_cid(?)", [cid]);
    const contactedCompanyDetail = rows1[0][0];

    const [rows2] = await pool.execute("CALL SApackage_detail(?)", [contactedCompanyDetail?.package_id]);
    const companyPackageDetail = rows2[0][0];

    res.status(200).json({
      contactedCompanyDetailResult: contactedCompanyDetail,
      companyPackageDetailResult: companyPackageDetail,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// // get company package detail
// router.get("/enterprise-leads/get-company-package-detail/:pack_id", async (req, res) => {
//   const { pack_id } = req.params;
//   try {
//     const [rows] = await pool.execute("CALL SApackage_detail(?)", [pack_id]);
//     const companyPackageDetail = rows[0];
//     res.status(200).json(companyPackageDetail);
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// update status of specific contacted company (active/inactive)
router.patch("/enterprise-leads/update-contacted-company-status", async (req, res) => {
  try {
    const { pack_id, status } = req.body;

    const [rows] = await pool.execute("CALL SApackage_detail(?)", [pack_id]);
    const packageDetail = rows[0][0];

    if (packageDetail) {
      if (packageDetail?.custom_pack == "yes") {
        const ccData = {
          cc_status: status,
        };
        const formattedParams = convertObjectToProcedureParams(ccData);

        const storedProcedure = "CALL SAUpdateContactedCompany(?, ?)";
        await pool.execute(storedProcedure, [formattedParams, `contacted_sales_id = ${packageDetail?.custom_cid}`]);
      }

      const otherFields = {
        pack_status: status,
      };
      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAEditPackage('${formattedParams}', 'pack_id  = ${pack_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Status updated successfully!" });
    } else {
      res.status(404).json({ status: false, error: "Package not found" });
    }
  } catch (error) {
    console.error("Error updating contacted company status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete contact sales request
router.delete("/enterprise-leads/delete-contact-sales-request/:cid", async (req, res) => {
  const { cid } = req.params;
  try {
    const del1 = `cid = '${cid}'`;
    await pool.execute("CALL SADeleteContactsalesReq(?)", [del1]);

    return res.status(200).json({ message: "Contact sales request deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
