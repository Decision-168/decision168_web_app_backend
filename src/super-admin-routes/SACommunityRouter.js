const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { convertObjectToProcedureParams, dateConversion } = require("../utils/common-functions");

// get decision makers
router.get("/super-admin/get-decision-makers", async (req, res) => {
  try {
    const [rows] = await pool.execute("Call SAdecision_maker()");
    const decisionMakersList = rows[0];

    res.status(200).json(decisionMakersList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update expert status (active/inactive)
router.patch("/community/update-expert-status", async (req, res) => {
  try {
    const { reg_id, status } = req.body;

    if (status == "active") {
      const otherFields = {
        expert_status: "inactive",
      };

      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id  = ${reg_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Expert Status updated successfully!" });
    } else {
      const otherFields = {
        expert_status: "active",
      };

      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAUpdateRegistration('${formattedParams}', 'reg_id  = ${reg_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Expert Status updated successfully!" });
    }
  } catch (error) {
    console.error("Error updating expert status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get decision maker detail by reg_id
router.get("/community/get-decision-maker-detail/:reg_id", async (req, res) => {
  try {
    const { reg_id } = req.params;

    const [rows1] = await pool.execute("Call SAget_User(?)", [reg_id]);
    const decisionMakerDetail = rows1[0];

    res.status(200).json(decisionMakerDetail);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get decision maker call rate detail
router.get("/community/get-decision-maker-call-rate-detail", async (req, res) => {
  try {
    const [rows1] = await pool.execute("Call SAcallMinutes()");
    const callRateDetail = rows1[0];

    res.status(200).json(callRateDetail);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get decision maker category
router.get("/super-admin/get-decision-maker-category", async (req, res) => {
  try {
    const [rows] = await pool.execute("Call SAexpertCategory()");
    const expertCategory = rows[0];

    res.status(200).json(expertCategory);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// insert decision maker category
router.post("/decision-maker-category/insert-category", async (req, res) => {
  try {
    let { title, description } = req.body;

    const formattedDate = dateConversion();

    const additionalFields = {
      status: "active",
      date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      title,
      description,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(", ");
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL SAInsertCategory(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Category Added successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// update category status (active/inactive)
router.patch("/decision-maker-category/update-category-status", async (req, res) => {
  try {
    const { cat_id, in_status } = req.body;

    if (in_status == "active") {
      const otherFields = {
        status: "inactive",
      };

      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAUpdateCategory('${formattedParams}', 'cat_id = ${cat_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Category Status updated successfully!" });
    } else {
      const otherFields = {
        status: "active",
      };

      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAUpdateCategory('${formattedParams}', 'cat_id = ${cat_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Category Status updated successfully!" });
    }
  } catch (error) {
    console.error("Error updating expert status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete decision maker category
router.delete("/decision-maker-category/delete-category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const del1 = `cat_id = '${id}'`;
    await pool.execute("CALL SADeleteCategory(?)", [del1]);

    return res.status(200).json({ message: "Category deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get decision maker category detail by cat_id
router.get("/decision-maker-category/get-decision-maker-category-detail/:cat_id", async (req, res) => {
  try {
    const { cat_id } = req.params;

    const [rows] = await pool.execute("Call SAgetCategoryById(?)", [cat_id]);
    const categoryById = rows[0][0];

    res.status(200).json(categoryById);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// edit category
router.patch("/decision-maker-category/edit-category", async (req, res) => {
  try {
    const { cat_id, title, description } = req.body;

    const otherFields = {
      title: title,
      description: description,
    };

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAUpdateCategory('${formattedParams}', 'cat_id = ${cat_id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "Category edited successfully!" });
  } catch (error) {
    console.error("Error editing category", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get decision maker agreement
router.get("/super-admin/get-decision-maker-agreement", async (req, res) => {
  try {
    const [rows] = await pool.execute("Call SAexpertAgreement()");
    const expertAgreement = rows[0];

    res.status(200).json(expertAgreement);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// insert decision maker agreement
router.post("/decision-maker-agreement/insert-agreement", async (req, res) => {
  try {
    let { title, description } = req.body;

    const formattedDate = dateConversion();

    const additionalFields = {
      date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      title,
      description,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(", ");
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL SAInsertAgreement(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Agreement Added successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// update agreement status (1/0)
router.patch("/decision-maker-agreement/update-agreement-status", async (req, res) => {
  try {
    const { agree_id, in_status } = req.body;

    if (in_status === 1) {
      const otherFields = {
        status: 0,
      };

      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAUpdateAgreement('${formattedParams}', 'agree_id = ${agree_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Agreement Status updated successfully!" });
    } else {
      const otherFields = {
        status: 1,
      };

      const formattedParams = convertObjectToProcedureParams(otherFields);

      const storedProcedure = `CALL SAUpdateAgreement('${formattedParams}', 'agree_id = ${agree_id}')`;
      await pool.execute(storedProcedure);

      res.status(200).json({ message: "Agreement Status updated successfully!" });
    }
  } catch (error) {
    console.error("Error updating Agreement status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete decision maker agreement
router.delete("/decision-maker-agreement/delete-agreement/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const del1 = `agree_id = '${id}'`;
    await pool.execute("CALL SADeleteAgreement(?)", [del1]);

    return res.status(200).json({ message: "Agreement deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get decision maker agreement by agree_id
router.get("/super-admin/decision-maker-agreement/:agree_id", async (req, res) => {
  try {
    const { agree_id } = req.params;

    const [rows] = await pool.execute("Call SAgetAgreementById(?)", [agree_id]);
    const agreementById = rows[0];

    res.status(200).json(agreementById);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// edit agreement
router.patch("/decision-maker-agreement/edit-agreement", async (req, res) => {
  try {
    const { agree_id, title, description } = req.body;

    const otherFields = {
      title: title,
      description: description,
    };

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAUpdateAgreement('${formattedParams}', 'agree_id = ${agree_id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "Agreement edited successfully!" });
  } catch (error) {
    console.error("Error editing agreement", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
