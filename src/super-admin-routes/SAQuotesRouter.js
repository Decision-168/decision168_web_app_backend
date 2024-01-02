const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const { dateConversion, convertObjectToProcedureParams } = require("../utils/common-functions");

// get all quotes
router.get("/quotes/get-all-quotes", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAquotes_list()");
    const allQuotes = rows[0];
    res.status(200).json(allQuotes);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// insert quote
router.post("/quotes/insert-quote", async (req, res) => {
  try {
    let { writer, quote } = req.body;

    const formattedDate = dateConversion();

    const additionalFields = {
      qcreated_date: formattedDate,
      status: "approved",
      status_date: formattedDate,
      qnotify: "seen",
      qnotify_clear: "yes",
    };

    const requestBodyWithAdditionalFields = {
      writer,
      quote,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(", ");
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL SAInsertQuote(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(201).json({
      message: "Quote added successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// get quote detail by id
router.get("/quotes/get-quote-detail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute("CALL SAquote_detail(?)", [id]);
    const quoteDetail = rows[0][0];
    res.status(200).json(quoteDetail);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// edit specific quote
router.patch("/quotes/edit-quote/:id", async (req, res) => {
  const { id } = req.params;
  const { writer, quote } = req.body;
  try {
    const otherFields = {
      writer: writer,
      quote: quote,
    };
    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAEditQuote('${formattedParams}', 'id  = ${id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete quote
router.delete("/quotes/delete-quote/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const del1 = `id = '${id}'`;
    await pool.execute("CALL SADeleteQuote(?)", [del1]);

    return res.status(200).json({ message: "Quote deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
