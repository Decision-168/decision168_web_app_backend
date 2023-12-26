require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const User = require("./routes/UserRouter");
const Dashboard = require("./routes/Dashboard");
const Portfolio = require("./routes/PortfolioRouter");
const FileCabinet = require("./routes/FileCabinetRouter");
const Archive = require("./routes/ArchiveRouter");
const Trash = require("./routes/TrashRouter");
const Goal = require("./routes/Goal");
const Tasks = require("./routes/TasksRouter");
const Project = require("./routes/ProjectRouter");
const UpgradePlan = require("./routes/UpgradePlanRouter");
const PORT = process.env.PORT || 3000;
// console.log(process.env.PORT);

require("./database/connection");

app.use("/d168-app-webhooks", express.raw({ type: "*/*" }));
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(cors());
app.use(User);
app.use(Dashboard);
app.use(Portfolio);
app.use(FileCabinet);
app.use(Archive);
app.use(Trash);
app.use(Goal);
app.use(Tasks);
app.use(Project);
app.use(UpgradePlan);

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
