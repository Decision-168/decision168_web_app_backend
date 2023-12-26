require("dotenv").config();
const front_url = process.env.FRONTEND_URL;
const DarkD168Logo = "../assets/images/dark-logo-main.png";
const D168Logo = "../assets/images/Decision-168.png";
const currentYear = new Date().getFullYear();

const generateForgotPasswordEmailTemplate = (userName, resetPasswordLink) => {
  return `
    <!doctype html>
    <html lang="en-US">

    <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>Reset Password</title>
      <meta name="description" content="Reset Password">
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
                                          <h1 style="color:#c7df19; font-weight:600; margin:0;font-size:33px;font-family:Rubik,sans-serif;">Did you request a password reset?</h1>
                                          <span
                                              style="display:inline-block; vertical-align:middle; margin:29px 0 29px; border-bottom:2px solid #cecece; width:270px;"></span>
                                          <p style="color:#fff; font-size:15px;line-height:24px;text-align:left; margin:0;">
                                          Hello ${userName},<br><br>
                                             We received a request to reset your password for access to the Decision 168 Accountability & Productivity Platform (D168). To reset your password, simply click the unique link below which has been generated for you, and follow the instructions.
                                              <br><br>
                                              For the security of your account, the password reset link will expire in 24 hours from when it was sent.
                                          </p>
                                          <a href=${resetPasswordLink}
                                          style="background:#c7df19;text-decoration:none !important; font-weight:600; margin-top:35px; margin-bottom: 20px; color:#fff;text-transform:uppercase; font-size:15px;padding:10px 30px;display:inline-block;border-radius:10px;">Reset Your Password</a> 
                                              <br><br>
                                              <p style="color:#fff; font-size:15px;line-height:24px;text-align:left; margin:0;">
                                              <strong>Reset link expired?</strong> You can request another password reset <a onMouseOver="this.style.pointer=cursor" href=${front_url}reset-password style="color:#c7df19;">here</a>. <strong>If you didn\'t make this request and prefer not to change your password</strong> , simply disregard this message and it will remain unchanged.

                                              <br><br>
                                              Thanks,
                                              <br>
                                              <span style="color:#c7df19;font-weight: 600;">Decision 168</span>
                                              <br>
                                              Support Team
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

module.exports = generateForgotPasswordEmailTemplate;
