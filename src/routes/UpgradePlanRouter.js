const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion, transporter } = require("../utils/common-functions");
const moment = require("moment");
const generateEmailTemplate = require("../utils/emailTemplate");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const front_url = process.env.FRONTEND_URL;
const authMiddleware = require("../middlewares/auth");

//getAllPack
router.get("/upgrade-plan/get-all-pack/:user_id", authMiddleware , async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.execute("CALL getAllPack(?)", [user_id]);

    let result = rows[0];

    const [getMyDetailRes] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const getMyDetail = getMyDetailRes[0][0];

    if (getMyDetail && getMyDetail?.package_coupon_id != 0) {
      const [rows2] = await pool.execute("CALL getPackDetail(?)", [
        getMyDetail?.package_id,
      ]);
      const rows2Res = rows2[0][0];
      const [rows3] = await pool.execute("CALL pricing_labels(?)", [
        rows2Res?.pack_id,
      ]);
      const rows3Res = rows3[0][0];

      const rows4 = { ...rows2Res, ...rows3Res };

      const filteredRows = rows[0].filter((pack) => pack.pack_id != "1");

      const mergedResult = [rows4, ...filteredRows];

      result = mergedResult;
    }
    const promises = result.map(async (item) => {
      const {
        pack_portfolio,
        portfolio,
        pack_goals,
        goals,
        pack_goals_strategies,
        goals_strategies,
        pack_projects,
        projects,
        pack_team_members,
        team_members,
        pack_tasks,
        task,
        pack_storage,
        storage,
        accountability_tracking,
        document_collaboration,
        kanban_boards,
        motivator,
        internal_chat,
        pack_content_planner,
        content_planner,
        data_recovery,
        email_support,
        pack_validity,
        ...rest
      } = item;

      let validity;
      if (!isNaN(pack_validity)) {
        if (pack_validity == "30") {
          validity = "billed monthly";
        } else if (pack_validity == "90") {
          validity = "3 Months";
        } else if (pack_validity == "180") {
          validity = "6 Months";
        } else if (pack_validity == "270") {
          validity = "9 Months";
        } else if (pack_validity == "365") {
          validity = "billed annually";
        } else {
          validity = `${pack_validity} Days`;
        }
      } else {
        validity = pack_validity;
      }

      const features = [
        `${pack_portfolio} ${portfolio}`,
        `${pack_goals} ${goals}`,
        `${pack_goals_strategies} ${goals_strategies}`,
        `${pack_projects} ${projects}`,
        `${pack_team_members} ${team_members}`,
        `${pack_tasks} ${task}`,
        `${pack_storage} ${storage}`,
        `${accountability_tracking}`,
        `${document_collaboration}`,
        `${kanban_boards}`,
        `${motivator}`,
        `${internal_chat}`,
        `${pack_content_planner} ${content_planner}`,
        `${data_recovery}`,
        `${email_support}`,
      ];

      const data = {
        ...rest,
        validity,
        features,
      };
      return data;
    });
    const finalResults = await Promise.all(promises);

    res.status(200).json(finalResults);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get_active_coupons
router.get("/upgrade-plan/get-active-coupons", authMiddleware , async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL get_active_coupons()");
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//free_trial_account_access
router.post("/upgrade-plan/free-trial-account-access", authMiddleware , async (req, res) => {
  const { code, user_id } = req.body;
  try {
    const [check_codeRes] = await pool.execute("CALL check_code(?)", [code]);
    const check_code = check_codeRes[0][0];

    if (check_code) {
      const [getMyDetailRes] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const getMyDetail = getMyDetailRes[0][0];

      if (getMyDetail) {
        const co_id = check_code.co_id.toString();
        const myUsedCoId = getMyDetail.used_package_coupon_id.split(",");
        const index = myUsedCoId.includes(co_id);
        if (!index) {
          const co_limit = check_code.co_limit;

          const formattedDate = dateConversion();

          if (!isNaN(co_limit)) {
            const [all_users_couponRes] = await pool.execute(
              "CALL all_users_coupon()"
            );
            const all_users_coupon = all_users_couponRes[0];
            let all_userscp = [];
            let total_ucp = 0;
            let total_acp = 0;

            if (all_users_coupon) {
              for (const aucp of all_users_coupon) {
                const usedPackageCouponIds = aucp.used_package_coupon_id
                  .split(",")
                  .map((item) => item.trim());
                all_userscp.push(...usedPackageCouponIds);
              }
            }
            total_ucp = all_userscp.filter(
              (item) => item === co_id.toString()
            ).length;

            const [currently_usedRes] = await pool.execute(
              "CALL users_active_coupon(?)",
              [co_id]
            );
            total_acp = currently_usedRes[0][0].count_rows;

            const total_cp = total_acp + total_ucp;

            if (total_cp < check_code.co_limit) {
              const days = check_code.co_validity;
              const packExpire = moment()
                .add(parseInt(days), "days")
                .format("YYYY-MM-DD HH:mm:ss");
              const dynamicFieldsValues = `package_coupon_id = '${co_id}',
                                          package_id = '${check_code.pack_id}',
                                          package_start = '${formattedDate}',
                                          package_expiry = '${packExpire}'`;
              const id = `reg_id  = '${user_id}'`;
              await pool.execute("CALL UpdateRegistration(?, ?)", [
                dynamicFieldsValues,
                id,
              ]);

              res.status(200).json({
                message: "Enjoy free trial!",
              });
            } else {
              res.status(201).json({
                message: "Invalid Code!",
              });
            }
          } else {
            const days = check_code.co_validity;
            const packExpire = moment()
              .add(parseInt(days), "days")
              .format("YYYY-MM-DD HH:mm:ss");
            const dynamicFieldsValues = `package_coupon_id = '${co_id}',
                                          package_id = '${check_code.pack_id}',
                                          package_start = '${formattedDate}',
                                          package_expiry = '${packExpire}'`;
            const id = `reg_id  = '${user_id}'`;
            await pool.execute("CALL UpdateRegistration(?, ?)", [
              dynamicFieldsValues,
              id,
            ]);

            res.status(200).json({
              message: "Enjoy free trial!",
            });
          }
        } else {
          res.status(201).json({
            message: "Already Used Code!",
          });
        }
      } else {
        res.status(201).json({
          message: "User not found!",
        });
      }
    } else {
      res.status(201).json({
        message: "Invalid Code!",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//insert_ContactSales
router.post("/upgrade-plan/insert-contact-sales", authMiddleware , async (req, res) => {
  const { pass_total_users, user_id } = req.body;
  try {
    const [check_contactedRes] = await pool.execute("CALL check_contacted(?)", [
      user_id,
    ]);
    const check_contacted = check_contactedRes[0][0];

    if (check_contacted) {
      if (check_contacted.response_status == "pending") {
        res.status(200).json({
          message: "Contact Request Already Sent! Please Wait for Response!",
        });
      } else {
        res.status(200).json({
          message: "Only one custom package is applicable to specific user!",
        });
      }
    } else {
      const [regInfoRes] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const regInfo = regInfoRes[0][0];
      let getfname;
      if (regInfo.middle_name) {
        getfname = `${regInfo.first_name} ${regInfo.middle_name} ${regInfo.last_name}`;
      } else {
        getfname = `${regInfo.first_name} ${regInfo.last_name}`;
      }

      const formattedDate = dateConversion();

      const data = {
        reg_id: user_id,
        fname: getfname,
        email: regInfo.email_address,
        phone: regInfo.phone_number,
        total_users: pass_total_users,
        response_status: "pending",
        contacted_date: formattedDate,
      };

      const paramNamesString = Object.keys(data).join(", ");
      const paramValuesString = Object.values(data)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL = `CALL InsertContactSales(?, ?)`;
      await pool.execute(callProcedureSQL, [
        paramNamesString,
        paramValuesString,
      ]);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: "uzmakarjikar@gmail.com",
        subject: "Contacted Sales | Decision 168",
        html: generateEmailTemplate(
          `Hello SuperAdmin, ${getfname} has contacted you regarding the package. Please find information below:`,
          ` Name: ${getfname}
          <br><br>
          Email: ${regInfo.email_address}
          <br><br>
          Phone: ${regInfo.phone_number}`
        ),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.status(500).json({ error: "Failed to send email." });
        } else {
          res.status(201).json({
            message: "Request Sent Successfully! Please wait for response",
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//checkout_payment_session_initialize
router.post("/upgrade-plan/create-checkout-session", authMiddleware , async (req, res) => {
  const { price_id, user_id } = req.body;
  try {
    const [getCusIDRes] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const getCusID = getCusIDRes[0][0];

    let stripe_cusID = "";
    if (getCusID) {
      stripe_cusID = getCusID.stripe_cus_id;
    }

    if (stripe_cusID) {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer: stripe_cusID,
        allow_promotion_codes: true,
        success_url: `${front_url}payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${user_id}`,
        cancel_url: `${front_url}pricing-packages`,
      });
      res
        .status(200)
        .json({ session_id: session.id, session_url: session.url });
    } else {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        allow_promotion_codes: true,
        success_url: `${front_url}payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${user_id}`,
        cancel_url: `${front_url}pricing-packages`,
      });
      res
        .status(200)
        .json({ session_id: session.id, session_url: session.url });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//insert_checkout_payment_data
router.post("/upgrade-plan/insert-checkout-payment-data", authMiddleware , async (req, res) => {
  const { session_id, user_id } = req.body;
  try {
    //Fetch checkout session details
    let checkout_session;
    let subscription;

    try {
      checkout_session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (checkout_sessionErr) {
      res.status(400).json({ error: checkout_sessionErr });
      return;
    }

    if (checkout_session) {
      //Fetch subscription details
      try {
        subscription = await stripe.subscriptions.retrieve(
          checkout_session.subscription
        );
      } catch (subscriptionErr) {
        res.status(400).json({ error: subscriptionErr });
        return;
      }

      if (subscription) {
        if (
          subscription.status == "active" ||
          subscription.status == "succeeded"
        ) {
          const [packRes] = await pool.execute("CALL getPackByPriceID(?)", [
            subscription.plan.id,
          ]);
          const pack = packRes[0][0];

          const [getCusIDRes] = await pool.execute("CALL getStudentById(?)", [
            user_id,
          ]);
          const getCusID = getCusIDRes[0][0];

          const invoice = await stripe.invoices.retrieve(
            subscription.latest_invoice
          );

          // Transaction details
          const transactionID = subscription.id;
          const paidCurrency = subscription.plan.currency;
          const payment_status = subscription.status;
          const customer_id = checkout_session.customer;
          const customer_email = checkout_session.customer_details.email;
          const sub_start = moment
            .unix(subscription.current_period_start)
            .format("YYYY-MM-DD HH:mm:ss");
          const sub_end = moment
            .unix(subscription.current_period_end)
            .format("YYYY-MM-DD HH:mm:ss");

          const getpaidAmount = invoice.amount_paid;
          const paidAmount = getpaidAmount / 100;

          let used_coupons;
          if (getCusID.package_coupon_id != "0") {
            used_coupons = `${getCusID.used_package_coupon_id},${getCusID.package_coupon_id}`;
          } else {
            used_coupons = getCusID.used_package_coupon_id;
          }

          const dynamicFieldsValues = `
                          stripe_cus_id = '${customer_id}',
                          package_id = '${pack.pack_id}',
                          package_start = '${sub_start}',
                          package_expiry = '${sub_end}',
                          card_number = '',
                          card_exp_month = '',
                          card_exp_year = '',
                          card_cvc =  '',
                          balance_amount = '',
                          paid_amount = '${paidAmount}',
                          paid_amount_currency = '${paidCurrency}',
                          txn_id = '${transactionID}',
                          payment_status = '${payment_status}',
                          renew = 'auto',
                          sub_cancel_reason_notify = '',
                          package_coupon_id = '',
                          used_package_coupon_id = '${used_coupons}'`;
          const id = `reg_id  = '${user_id}'`;
          await pool.execute("CALL UpdateRegistration(?, ?)", [
            dynamicFieldsValues,
            id,
          ]);

          const mailOptions = {
            from: process.env.SMTP_USER,
            to: customer_email,
            subject: "Payment Successful | Decision 168",
            html: generateEmailTemplate(
              `Hello ${getCusID.first_name} ${getCusID.last_name}, Your subscription for ${pack.pack_name} package was successful. Please find details below:`,
              `Paid Amount: $  ${paidAmount}
              <br><br>
              Pack Price: $ ${pack.pack_price}
              <br><br>
              Package Start: ${sub_start}
              <br><br>
              Package Expiry: ${sub_end}`
            ),
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              res.status(500).json({ error: "Failed to send email." });
            } else {
              res.status(201).json({
                message: "Payment Successful!",
              });
            }
          });
        } else {
          res.status(201).json({ message: "Invalid Request!" });
        }
      } else {
        res.status(201).json({ message: "Invalid Request!" });
      }
    } else {
      res.status(201).json({ message: "Invalid Request!" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//update_subscription
router.post("/upgrade-plan/update-subscription", authMiddleware , async (req, res) => {
  const { price_id, user_id } = req.body;
  try {
    const [packRes] = await pool.execute("CALL getPackByPriceID(?)", [
      price_id,
    ]);
    const pack = packRes[0][0];

    const [getCusIDRes] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const getCusID = getCusIDRes[0][0];

    let subscription;
    let new_subscription;

    try {
      subscription = await stripe.subscriptions.retrieve(getCusID.txn_id);
    } catch (subscriptionErr) {
      res.status(400).json({ error: subscriptionErr });
      return;
    }

    try {
      new_subscription = await stripe.subscriptions.update(getCusID.txn_id, {
        cancel_at_period_end: false,
        proration_behavior: "always_invoice",
        items: [
          {
            id: subscription.items.data[0].id,
            price: price_id,
          },
        ],
      });
    } catch (new_subscriptionErr) {
      res.status(400).json({ error: new_subscriptionErr });
      return;
    }

    const invoice = await stripe.invoices.retrieve(
      new_subscription.latest_invoice
    );

    if (new_subscription) {
      if (
        new_subscription.status == "active" ||
        new_subscription.status == "succeeded"
      ) {
        // Transaction details
        const transactionID = new_subscription.id;
        const paidCurrency = new_subscription.plan.currency;
        const payment_status = new_subscription.status;
        const customer_id = getCusID.stripe_cus_id;
        const customer_email = getCusID.email_address;
        const sub_start = moment
          .unix(new_subscription.current_period_start)
          .format("YYYY-MM-DD HH:mm:ss");
        const sub_end = moment
          .unix(new_subscription.current_period_end)
          .format("YYYY-MM-DD HH:mm:ss");

        const getpaidAmount = invoice.amount_paid;
        const paidAmount = getpaidAmount / 100;

        const dynamicFieldsValues = `
                          stripe_cus_id = '${customer_id}',
                          package_id = '${pack.pack_id}',
                          package_start = '${sub_start}',
                          package_expiry = '${sub_end}',
                          paid_amount = '${paidAmount}',
                          paid_amount_currency = '${paidCurrency}',
                          txn_id = '${transactionID}',
                          payment_status = '${payment_status}',
                          renew = 'auto'`;
        const id = `reg_id  = '${user_id}'`;
        await pool.execute("CALL UpdateRegistration(?, ?)", [
          dynamicFieldsValues,
          id,
        ]);

        const mailOptions = {
          from: process.env.SMTP_USER,
          to: customer_email,
          subject: "Upgrade Successful | Decision 168",
          html: generateEmailTemplate(
            `Hello ${getCusID.first_name} ${getCusID.last_name}, Your subscription for ${pack.pack_name} package was successful. Please find details below:`,
            `Paid Amount: $ ${paidAmount}
              <br><br>
              Pack Price: $ ${pack.pack_price}
              <br><br>
              Package Start: ${sub_start}
              <br><br>
              Package Expiry: ${sub_end}`
          ),
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(500).json({ error: "Failed to send email." });
          } else {
            res.status(201).json({
              message: "Upgrade Successful!",
            });
          }
        });
      } else {
        res.status(201).json({ message: "Invalid Request!" });
      }
    } else {
      res.status(201).json({ message: "Invalid Request!" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//downgrade_plan
router.post("/upgrade-plan/downgrade-plan", authMiddleware , async (req, res) => {
  const { user_id } = req.body;
  try {
    const [getCusIDRes] = await pool.execute("CALL getStudentById(?)", [
      user_id,
    ]);
    const getCusID = getCusIDRes[0][0];

    if (getCusID) {
      const [packRes] = await pool.execute("CALL getPackDetail(?)", [
        getCusID.package_id,
      ]);
      const pack = packRes[0][0];
      if (pack) {
        const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");
        const dateString = getCusID.package_start;
        const expectedFormat = "YYYY-MM-DD HH:mm:ss";

        const isValidFormat = moment(
          dateString,
          expectedFormat,
          true
        ).isValid();

        if (isValidFormat) {
          let subscription;
          let pack_duration;
          let refund = "no";
          if (pack.pack_validity == "30") {
            pack_duration = moment(dateString, expectedFormat)
              .add(7, "days")
              .format("YYYY-MM-DD HH:mm:ss");
          } else {
            pack_duration = moment(dateString, expectedFormat)
              .add(30, "days")
              .format("YYYY-MM-DD HH:mm:ss");
          }

          const diffInMilliseconds = moment(pack_duration, expectedFormat).diff(
            currentDate
          );

          if (diffInMilliseconds >= 0) {
            refund = "yes";
          } else {
            refund = "no";
          }

          try {
            subscription = await stripe.subscriptions.cancel(getCusID.txn_id);
          } catch (subscriptionErr) {
            res.status(400).json({ error: subscriptionErr });
            return;
          }

          if (subscription) {
            if (subscription.status == "canceled") {
              const invoice = await stripe.invoices.retrieve(
                subscription.latest_invoice
              );

              let refund_status = "no_refund";
              let refund_main_txn_id = "";
              let refund_txn_id = "";
              let old_package = getCusID.package_id;
              let refund_amount = "";

              if (refund == "yes") {
                refund_status = "refund";
                refund_main_txn_id = getCusID.txn_id;
                refund_txn_id = subscription.latest_invoice;
                old_package = getCusID.package_id;
                const getpaidAmount = invoice.amount_paid;
                refund_amount = getpaidAmount / 100;
              }

              const dynamicFieldsValues = `
              package_id = '1',
              package_start = '${currentDate}',
              package_expiry = 'free_forever',
              balance_amount = '',
              paid_amount = '',
              card_number = '0',
              card_exp_month = '',
              card_exp_year = '',
              card_cvc = '',
              paid_amount_currency = '',
              txn_id = '',
              payment_status = '',
              renew = '',
              refund_status = '${refund_status}',
              refund_main_txn_id = '${refund_main_txn_id}',
              refund_txn_id = '${refund_txn_id}',
              old_package = '${old_package}',
              refund_amount = '${refund_amount}'`;
              const id = `reg_id  = '${user_id}'`;
              await pool.execute("CALL UpdateRegistration(?, ?)", [
                dynamicFieldsValues,
                id,
              ]);

              if (refund == "yes") {
                const mailOptions = {
                  from: process.env.SMTP_USER,
                  to: "uzmakarjikar@gmail.com",
                  subject: "Refund Request | Decision 168",
                  html: generateEmailTemplate(
                    `Hello SuperAdmin, ${getCusID.first_name} ${getCusID.last_name} has downgraded the package and requested you a Refund. Please go to Stripe and Refund by using Invoice ID.`,
                    `Invoice ID:  ${refund_txn_id}
                    <br><br>
                    Refund Amount: $  ${refund_amount}`
                  ),
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    res.status(500).json({ error: "Failed to send email." });
                  } else {
                    res.status(201).json({
                      message: "Refund Request Sent Successful!",
                    });
                  }
                });

                const mailOptions2 = {
                  from: process.env.SMTP_USER,
                  to: getCusID.email_address,
                  subject:
                    "Downgrade Successful & Refund Initiated | Decision 168",
                  html: generateEmailTemplate(
                    `Hello ${getCusID.first_name} ${getCusID.last_name},  You have successfully downgraded the ${pack.pack_name} package ! Refund initiated and will credit in your account within 5 Working Days!`,
                    `Refund Amount: $  ${refund_amount}`
                  ),
                };

                transporter.sendMail(mailOptions2, (error, info) => {
                  if (error) {
                    res.status(500).json({ error: "Failed to send email." });
                  } else {
                    res.status(201).json({
                      message: "Downgrade Successful",
                    });
                  }
                });
                res.status(200).json({
                  message:
                    "Downgrade Successful ! Refund initiated and will credit in your account within 5 Working Days!",
                });
              } else {
                const mailOptions3 = {
                  from: process.env.SMTP_USER,
                  to: getCusID.email_address,
                  subject: "Downgrade Successful| Decision 168",
                  html: generateEmailTemplate(
                    `Hello ${getCusID.first_name} ${getCusID.last_name},  You have successfully downgraded the ${pack.pack_name} package`,
                    `No Refund!`
                  ),
                };

                transporter.sendMail(mailOptions3, (error, info) => {
                  if (error) {
                    res.status(500).json({ error: "Failed to send email." });
                  } else {
                    res.status(201).json({
                      message: "Downgrade Successful",
                    });
                  }
                });
                res.status(200).json({
                  message: "Downgrade Successful ! No Refund!",
                });
              }
            } else {
              res.status(201).json({ message: "Invalid Request!" });
            }
          } else {
            res.status(201).json({ message: "Invalid Request!" });
          }
        } else {
          res.status(201).json({ message: "Invalid date format!" });
        }
      } else {
        res.status(201).json({ message: "Package Not Found!" });
      }
    } else {
      res.status(201).json({ message: "User Not Found!" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//UpdateAllUsersPackageDetails
router.post(
  "/upgrade-plan/updtae-all-users-package-details", async (req, res) => {
    try {
      const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");
      const [getUsersRes] = await pool.execute("CALL GetAllUsersPackage()");
      const getUsers = getUsersRes[0];

      if (getUsers) {
        for (const user of getUsers) {
          //user's free trail expired
          if (user.package_coupon_id != 0) {
            const diffInMilliseconds = moment(user.package_expiry).diff(
              currentDate
            );

            if (diffInMilliseconds <= 0) {
              let used_coupons;
              if (user.package_coupon_id != "0") {
                used_coupons = `${user.used_package_coupon_id},${user.package_coupon_id}`;
              } else {
                used_coupons = user.used_package_coupon_id;
              }

              const dynamicFieldsValues = `
              package_id = '1',
              package_start = '${currentDate}',
              package_expiry = 'free_forever',
              package_coupon_id =  '',
              used_package_coupon_id = '${used_coupons}'`;
              const id = `reg_id  = '${user.reg_id}'`;
              await pool.execute("CALL UpdateRegistration(?, ?)", [
                dynamicFieldsValues,
                id,
              ]);

              const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.email_address,
                subject: "Free Trial Expired | Decision 168",
                html: generateEmailTemplate(
                  `Hello ${user.first_name} ${user.last_name}, Your free trial Expired!`,
                  `Now package switch to Solo !`
                ),
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  res.status(500).json({ error: "Failed to send email." });
                } else {
                  res.status(201).json({
                    message: "Email Sent!",
                  });
                }
              });
            }
          } else if (user.package_coupon_id == 0 && user.txn_id != "") {
            if (!isNaN(user.pack_validity)) {
              try {
                subscription = await stripe.subscriptions.retrieve(user.txn_id);
              } catch (subscriptionErr) {
                res.status(400).json({ error: subscriptionErr });
                return;
              }

              if (subscription) {
                if (
                  subscription.status == "active" ||
                  subscription.status == "succeeded"
                ) {
                  const sub_start = moment
                    .unix(subscription.current_period_start)
                    .format("YYYY-MM-DD HH:mm:ss");
                  const sub_end = moment
                    .unix(subscription.current_period_end)
                    .format("YYYY-MM-DD HH:mm:ss");

                  if (
                    user.package_start != sub_start ||
                    user.package_expiry != sub_end
                  ) {
                    const invoice = await stripe.invoices.retrieve(
                      subscription.latest_invoice
                    );

                    const getpaidAmount = invoice.amount_paid;
                    const paidAmount = getpaidAmount / 100;

                    const dynamicFieldsValues = `
                          package_start = '${sub_start}',
                          package_expiry = '${sub_end}'`;
                    const id = `reg_id  = '${user.reg_id}'`;
                    await pool.execute("CALL UpdateRegistration(?, ?)", [
                      dynamicFieldsValues,
                      id,
                    ]);

                    if (user.package_expiry != sub_end) {
                      const mailOptions = {
                        from: process.env.SMTP_USER,
                        to: user.email_address,
                        subject:
                          "Auto Renew Subscription Successful | Decision 168",
                        html: generateEmailTemplate(
                          `Hello ${user.first_name} ${user.last_name}, Your auto renew subscription for ${user.pack_name} package was successful. Please find details below:`,
                          `Paid Amount: $  ${paidAmount}
                          <br><br>
                          Pack Price: $ ${user.pack_price}
                          <br><br>
                          Package Start: ${sub_start}
                          <br><br>
                          Package Expiry: ${sub_end}`
                        ),
                      };

                      transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                          res
                            .status(500)
                            .json({ error: "Failed to send email." });
                        } else {
                          res.status(201).json({
                            message: "Auto Renew Subscription Successful!",
                          });
                        }
                      });
                    }
                  }
                } else {
                  let cancel_subscription;
                  try {
                    cancel_subscription = await stripe.subscriptions.cancel(
                      user.txn_id
                    );
                  } catch (cancel_subscriptionErr) {
                    res.status(400).json({ error: cancel_subscriptionErr });
                    return;
                  }

                  const cancel_sub_end = moment
                    .unix(cancel_subscription.current_period_end)
                    .format("YYYY-MM-DD HH:mm:ss");

                  const dynamicFieldsValues = `
                  package_id = '1',
                  package_start = '${currentDate}',
                  package_expiry = 'free_forever',
                  balance_amount = '',
                  paid_amount = '',
                  card_number = '0',
                  card_exp_month = '',
                  card_exp_year = '',
                  card_cvc = '',
                  paid_amount_currency = '',
                  txn_id = '',
                  payment_status = '',
                  renew = '',
                  old_package = '${user.package_id}',
                  refund_status = 'no_refund',
                  sub_cancel_reason = 'card_expired',
                  sub_cancel_reason_notify = 'yes'`;
                  const id = `reg_id  = '${user.reg_id}'`;
                  await pool.execute("CALL UpdateRegistration(?, ?)", [
                    dynamicFieldsValues,
                    id,
                  ]);

                  const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: user.email_address,
                    subject: "Auto Renew Subscription Failed | Decision 168",
                    html: generateEmailTemplate(
                      `Hello ${user.first_name} ${user.last_name}, Your auto renew subscription for ${user.pack_name} package was failed.`,
                      `Package Expired: ${cancel_sub_end}`
                    ),
                  };

                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      res.status(500).json({ error: "Failed to send email." });
                    } else {
                      res.status(201).json({
                        message: "Auto Renew Subscription Failed!",
                      });
                    }
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
);

module.exports = router;
