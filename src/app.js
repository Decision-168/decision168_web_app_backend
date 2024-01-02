require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

//--------------------------user panel-------------------------------//
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

//-------------------------Admin Panel-----------------------------//
const SuperAdmin = require("./super-admin-routes/SuperAdminRouter");
const SADashboard = require("./super-admin-routes/SADashboardRouter");
const SARegisteredUsers = require("./super-admin-routes/SARegisteredUsersRouter");
const SAQuotes = require("./super-admin-routes/SAQuotesRouter");
const SAPricing = require("./super-admin-routes/SAPricingRouter");
const SAEnterpriseLeads = require("./super-admin-routes/SAEnterpriseLeadsRouter");
const SAAdSetting = require("./super-admin-routes/SAAdSettingRouter");
const SACouponSetting = require("./super-admin-routes/SACouponSettingRouter");
const SAHeader = require("./super-admin-routes/SAHeaderRouter");
const SACommunity = require("./super-admin-routes/SACommunityRouter");
const SATicketManagement = require("./super-admin-routes/SATicketManagementRouter");
const SASupporters = require("./super-admin-routes/SASupportersRouter");

const PORT = process.env.PORT || 3000;
require("./database/connection");
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(cors());

//--------------------------user panel-------------------------------//
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

//-------------------------Admin Panel-----------------------------//

app.use(SuperAdmin);
app.use(SADashboard);
app.use(SARegisteredUsers);
app.use(SAQuotes);
app.use(SAPricing);
app.use(SAEnterpriseLeads);
app.use(SAAdSetting);
app.use(SACouponSetting);
app.use(SAHeader);
app.use(SACommunity);
app.use(SATicketManagement);
app.use(SASupporters);

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
