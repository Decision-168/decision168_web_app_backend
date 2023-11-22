require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const Dummy = require("./routes/dummyRouter")
const FileCabinet = require("./routes/FileCabinetRouter")

const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");

require("./database/connection");

app.use(express.json());
app.use(cors());

app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(Dummy);
app.use(FileCabinet);
app.listen(PORT);
