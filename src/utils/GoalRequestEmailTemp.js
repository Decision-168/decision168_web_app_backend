require("dotenv").config();
const front_url = process.env.FRONTEND_URL;
const DarkD168Logo = "../assets/images/dark-logo-main.png";
const D168Logo = "../assets/images/Decision-168.png";
const currentYear = new Date().getFullYear();

const generateGoalRequestEmailTemplate = (
  userFName,
  pownerFName,
  gname,
  PortfolioName,
  short_gdes,
  acceptRequest,
  rejectRequest,
  position
) => {
  return `
    <!doctype html>
    <html lang="en-US">

    <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>Goal Request</title>
      <meta name="description" content="Goal Request">
      <style type="text/css">
          a:hover {text-decoration: underline !important;pointer:cursor !important;}
      </style>
    </head>

    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
      <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
          style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: Open Sans, sans-serif;">
          <tr>
              <td>
                  <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                      <tr>
                          <td style="height:80px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                            <a href=${front_url} title="Decision 168" target="_blank">
                              <img width="50%" src=${DarkD168Logo} title="Decision 168" alt="Decision 168">
                            </a>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td>
                              <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                  style="max-width:670px;background:#383838;border:4px solid #dfdddd;text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                  <tr>
                                      <td style="height:40px;">&nbsp;</td>
                                  </tr>
                                  <tr>
                                      <td style="padding:0 35px;">
                                          <h1 style="color:#c7df19; font-weight:600; margin:0;font-size:33px;font-family:Rubik,sans-serif;">You\'re invited to a Goal...</h1>
                                          <span
                                              style="display:inline-block; vertical-align:middle; margin:29px 0 29px; border-bottom:2px solid #cecece; width:270px;"></span>
                                          <p style="color:#fff; font-size:15px;line-height:24px;text-align:left; margin:0;">
                                          Hello ${userFName},<br><br>
                                             ${pownerFName} has requested you to join Goal ${gname} as a ${position}. Just click the appropriate button below to join the Goal or request more information.
                                              <br><br>
                                              Portfolio: ${PortfolioName}
                                              <br><br>
                                              Goal Short Description: ${short_gdes}...
                                              <br><br>
                                          </p>
                                          <a href=${acceptRequest} style="background:#c7df19;text-decoration:none !important; font-weight:600; margin:20px; color:#fff;border:4px solid #c7df19;text-transform:uppercase; font-size:15px;padding:10px 30px;display:inline-block;border-radius:10px;">Join Goal</a>
                                          <a href=${rejectRequest} style="text-decoration:none !important; font-weight:600; margin:20px; color:#c7df19;border:4px solid #c7df19;text-transform:uppercase; font-size:15px;padding:10px 30px;display:inline-block;border-radius:10px;">Need More Info</a> 
                                              <br><br>
                                              <p style="color:#fff; font-size:15px;line-height:24px;text-align:left; margin:0;">
                                              Note: If you do not have an account, you will need to register for one and create profile (don\'t worry it only takes a couple of minutes).
                                              <br><br>
                                              Thanks,
                                              <br>
                                              The <span style="color:#c7df19;font-weight: 600;">Decision 168</span> Team
                                              </p>
                                              <p style="color:#fff; font-size:15px;line-height:24px;text-align:right; margin:0;">
                                              <br>
                                              <img width="20%" src=${D168Logo} title="Decision 168" alt="Decision 168">
                                              </p>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:40px;">&nbsp;</td>
                                  </tr>
                              </table>
                          </td>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                          <p style="color:rgba(69, 80, 86, 0.7411764705882353);font-size:11px;line-height:15px;margin:0;">Please note: This e-mail was sent from an auto-notification system that cannot accept incoming e-mail. Do not reply to this message.</p>
                          <p style="color:rgba(69, 80, 86, 0.7411764705882353);font-size:11px;line-height:15px;margin:0;">You can’t unsubscribe from important emails about your account like this one.</p>
                          <br>
                              <p style="font-size:14px; color:#6b6e70; line-height:18px; margin:0 0 0;">&copy; <strong>Copyright 2013 – ${currentYear}  |  Decision 168, Inc  |  All Rights Reserved </strong></p>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:80px;">&nbsp;</td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
    </body>

    </html>
    `;
};

module.exports = generateGoalRequestEmailTemplate;
