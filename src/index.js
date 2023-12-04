require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const User = require("./routes/UserRouter");
const Dashboard = require("./routes/DashboardRouter");
const Portfolio = require("./routes/PortfolioRouter");
const FileCabinet = require("./routes/FileCabinetRouter");
const Archive = require("./routes/ArchiveRouter");
const Trash = require("./routes/TrashRouter");
const GoalKpi = require("./routes/GoalKPIRouter");
const Tasks = require("./routes/TasksRouter");

const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");

require("./database/connection");

app.use(express.json());
app.use(cors());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(User);
app.use(Dashboard);
app.use(Portfolio);
app.use(FileCabinet);
app.use(Archive);
app.use(Trash);
app.use(GoalKpi);
app.use(Tasks);
app.listen(PORT);
