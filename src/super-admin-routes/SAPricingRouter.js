const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../database/connection");
const {
  convertObjectToProcedureParams,
  dateConversion,
  transporter,
} = require("../utils/common-functions");
const generateCompanyLoginCredentialsEmailTemplate = require("../utils/CompanyLoginCredentialsEmailTemp");
const generateCompanyPackageUpgradeEmailTemplate = require("../utils/CompanyPackageUpgradeEmailTemp");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const front_url = process.env.FRONTEND_URL;

// get pricing list
router.get("/pricing/get-pricing-list", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SApricing_list()");
    const pricingList = rows[0];
    res.status(200).json(pricingList);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get package detail
router.get("/pricing/get-package-detail/:pack_id", async (req, res) => {
  try {
    const { pack_id } = req.params;

    const [rows] = await pool.execute("Call SApackage_detail(?)", [pack_id]);
    const packageDetail = rows[0];

    res.status(200).json(packageDetail);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update package status (active/inactive)
router.patch("/pricing/update-package-status", async (req, res) => {
  try {
    const { pack_id, status } = req.body;

    const [rows1] = await pool.execute("Call SApackage_detail(?)", [pack_id]);
    const packageDetail = rows1[0][0];

    if (packageDetail) {
      if (packageDetail.custom_pack == "yes") {
        const ccdata2 = {
          cc_status: status,
        };

        const formattedParams = convertObjectToProcedureParams(ccdata2);
        const storedProcedure = `CALL SAUpdateContactedCompany('${formattedParams}', 'contacted_sales_id = ${packageDetail.custom_cid}')`;
        await pool.execute(storedProcedure);
      }

      const data2 = {
        pack_status: status,
      };

      const formattedParams = convertObjectToProcedureParams(data2);
      const storedProcedure = `CALL SAEditPackage('${formattedParams}', 'pack_id  = ${pack_id}')`;
      await pool.execute(storedProcedure);
    }

    res.status(200).json({ message: "Pack Status updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//insert_package
router.post("/pricing/insert-package", async (req, res) => {
  try {
    const {
      pack_creation_page,
      pack_validity,
      pack_price,
      contacted_id,
      user_id,
      pack_stripe_link,
      validity_period,
      company_name,
      company_users,
      company_username,
      ...otherFields
    } = req.body;

    let custom_pack = "no";
    let custom_cid = "";
    let custom_reg_id = "";
    let setvalidity_period = "";
    let validity = "";
    let stripe_prod = "";
    let stripe_price = "";
    const price = pack_price * 100;

    if (pack_creation_page == "contacted_page") {
      if (!isNaN(pack_validity)) {
        if (pack_validity == "30") {
          validity = { interval: "month" };
        } else if (pack_validity == "90") {
          validity = { interval: "month", interval_count: 3 };
        } else if (pack_validity == "180") {
          validity = { interval: "month", interval_count: 6 };
        } else if (pack_validity == "270") {
          validity = { interval: "month", interval_count: 9 };
        } else if (pack_validity == "365") {
          validity = { interval: "year" };
        } else {
          validity = pack_validity;
        }

        // Create product
        const stripeProduct = await stripe.products.create({
          name: req.body.pack_name,
        });

        // Create price
        const stripePrice = await stripe.prices.create({
          unit_amount: price,
          currency: "usd",
          recurring: validity,
          product: stripeProduct.id,
        });

        stripe_prod = stripeProduct.id;
        stripe_price = stripePrice.id;
      } else {
        // Create product
        const stripeProduct = await stripe.products.create({
          name: req.body.pack_name,
        });

        // Create price
        const stripePrice = await stripe.prices.create({
          unit_amount: price,
          currency: "usd",
          product: stripeProduct.id,
        });

        stripe_prod = stripeProduct.id;
        stripe_price = stripePrice.id;
      }

      custom_pack = "yes";
      custom_cid = contacted_id;
      custom_reg_id = user_id;
      setvalidity_period = validity_period;
    } else {
      if (pack_stripe_link === "yes") {
        if (!isNaN(pack_validity)) {
          if (pack_validity == "30") {
            validity = { interval: "month" };
          } else if (pack_validity == "90") {
            validity = { interval: "month", interval_count: 3 };
          } else if (pack_validity == "180") {
            validity = { interval: "month", interval_count: 6 };
          } else if (pack_validity == "270") {
            validity = { interval: "month", interval_count: 9 };
          } else if (pack_validity == "365") {
            validity = { interval: "year" };
          } else {
            validity = pack_validity;
          }

          // Create product
          const stripeProduct = await stripe.products.create({
            name: req.body.pack_name,
          });

          // Create price
          const stripePrice = await stripe.prices.create({
            unit_amount: price,
            currency: "usd",
            recurring: validity,
            product: stripeProduct.id,
          });

          stripe_prod = stripeProduct.id;
          stripe_price = stripePrice.id;
        } else {
          // Create product
          const stripeProduct = await stripe.products.create({
            name: req.body.pack_name,
          });

          // Create price
          const stripePrice = await stripe.prices.create({
            unit_amount: price,
            currency: "usd",
            product: stripeProduct.id,
          });

          stripe_prod = stripeProduct.id;
          stripe_price = stripePrice.id;
        }
      }
    }

    const formattedDate = dateConversion();
    const additionalFields = {
      stripe_link: pack_stripe_link,
      stripe_product_id: stripe_prod,
      stripe_price_id: stripe_price,
      pack_validity: pack_validity,
      pack_price: pack_price,
      pack_created_date: formattedDate,
      pack_status: "active",
      custom_pack: custom_pack,
      custom_cid: custom_cid,
      custom_reg_id: custom_reg_id,
      coupon_pack: "no",
      validity_period: setvalidity_period,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL SAInsertPackage(?, ?)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    const [getPackage] = await pool.execute("CALL SAInsertedPackage()");
    const pack_id = getPackage[0][0]?.pack_id;

    const InsertFields = {
      pack_id: pack_id,
      portfolio: "portfolio",
      goals: "goals",
      goals_strategies: "KPIs per goal",
      goals_strategies_projects: "projects per KPIs",
      projects: "active projects",
      team_members: "team members",
      task: "task",
      storage: "storage",
      accountability_tracking: "accountability tracking",
      document_collaboration: "document collaboration",
      kanban_boards: "kanban boards",
      motivator: "motivator",
      internal_chat: "internal chat",
      content_planner: "posts / mo. content planner",
      data_recovery: "data recovery",
      email_support: "24/7 email support",
    };
    const paramNamesString2 = Object.keys(InsertFields).join(", ");
    const paramValuesString2 = Object.values(InsertFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL2 = `CALL SAInsertPricingLabels(?, ?)`;
    await pool.execute(callProcedureSQL2, [
      paramNamesString2,
      paramValuesString2,
    ]);

    if (pack_creation_page == "contacted_page") {
      const dynamicFieldsValues = `response_status = 'accepted',
                                    response_date = '${formattedDate}'`;
      const id = `cid  = '${custom_cid}'`;
      await pool.execute("CALL SAUpdateContactSales(?, ?)", [
        dynamicFieldsValues,
        id,
      ]);

      const letter = company_name.trim().substring(0, 3).toLowerCase();
      const randomNum = Math.floor(Math.random() * 10000) + 1;
      const get_ccode = letter + randomNum;

      const hashedCCode = await bcrypt.hash(get_ccode, 10);

      const cc_link = `${front_url}corporate-registration/${hashedCCode}`;

      const InsertFields3 = {
        cc_name: company_name,
        cc_tusers: company_users,
        cc_username: company_username,
        cc_createddate: formattedDate,
        contacted_sales_id: custom_cid,
        contacted_user_id: custom_reg_id,
        cc_status: "active",
        cc_corporate_id: get_ccode,
        cc_corporate_id_encrypt: hashedCCode,
        cc_link: cc_link,
        package_id: pack_id,
        package_use: "no",
      };
      const paramNamesString3 = Object.keys(InsertFields3).join(", ");
      const paramValuesString3 = Object.values(InsertFields3)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL3 = `CALL SAInsertContactedCompany(?, ?)`;
      await pool.execute(callProcedureSQL3, [
        paramNamesString3,
        paramValuesString3,
      ]);

      const [getContactedCompany] = await pool.execute(
        "CALL SAInsertedContactedCompany()"
      );
      const cc_id = getContactedCompany[0][0]?.cc_id;

      const [rows] = await pool.execute("CALL getStudentById(?)", [
        custom_reg_id,
      ]);
      const getEmail = rows[0][0]?.email_address;
      const userFName = `${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`;

      const InsertFields4 = {
        cc_id: cc_id,
        emp_email: getEmail,
        emp_status: "active",
        status: "accepted",
        cce_date: formattedDate,
        contacted_user: "yes",
      };
      const paramNamesString4 = Object.keys(InsertFields4).join(", ");
      const paramValuesString4 = Object.values(InsertFields4)
        .map((value) => `'${value}'`)
        .join(", ");

      const callProcedureSQL4 = `CALL SAInsertContactedCompanyEmp(?, ?)`;
      await pool.execute(callProcedureSQL4, [
        paramNamesString4,
        paramValuesString4,
      ]);

      const [getContactedCompanyEmp] = await pool.execute(
        "CALL SAInsertedContactedCompanyEmp()"
      );
      const cce_id = getContactedCompanyEmp[0][0]?.cce_id;

      const dynamicFieldsValues2 = `used_corporate_id = '${get_ccode}',
                                    cce_id = '${cce_id}',                        
                                    role_in_comp = 'contacted_user'`;
      const id2 = `reg_id  = '${custom_reg_id}'`;
      await pool.execute("CALL UpdateRegistration(?, ?)", [
        dynamicFieldsValues2,
        id2,
      ]);

      const hashedUsername = await bcrypt.hash(company_username, 10);
      const gen_pwd = `${front_url}set-password-company/${cc_id}/${hashedUsername}/1`;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: getEmail,
        subject: "Company Login Credentials | Decision 168",
        html: generateCompanyLoginCredentialsEmailTemplate(
          userFName,
          company_username,
          gen_pwd
        ),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.status(500).json({
            error: "Failed to send email.",
          });
        } else {
          res.status(201).json({
            message: "Email sent successfully.",
          });
        }
      });
    }

    res.status(200).json({
      message: "Package Added Successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//edit_package
router.patch("/pricing/edit-package", async (req, res) => {
  try {
    const {
      pack_id,
      custom_pack,
      validity_period,
      pack_name,
      pack_price,
      pack_validity,
      company_name,
      company_users,
      custom_cid,
      ...otherFields
    } = req.body;

    const formattedDate = dateConversion();

    const price = pack_price * 100;

    const [rows] = await pool.execute("CALL SApackage_detail(?)", [pack_id]);
    const pdetail = rows[0][0];

    let new_price_id = pdetail.stripe_price_id;
    let cc_updatedpp = "";
    let setvalidity_period = "";

    if (custom_pack === "yes") {
      setvalidity_period = validity_period;
    }

    if (pdetail?.stripe_link === "yes") {
      if (
        pdetail.pack_name != pack_name ||
        pdetail.pack_price != pack_price ||
        pdetail.pack_validity != pack_validity
      ) {
        if (!isNaN(pack_validity)) {
          if (pack_validity == "30") {
            validity = { interval: "month" };
          } else if (pack_validity == "90") {
            validity = { interval: "month", interval_count: 3 };
          } else if (pack_validity == "180") {
            validity = { interval: "month", interval_count: 6 };
          } else if (pack_validity == "270") {
            validity = { interval: "month", interval_count: 9 };
          } else if (pack_validity == "365") {
            validity = { interval: "year" };
          } else {
            validity = pack_validity;
          }

          // update product
          const stripeProduct = await stripe.products.update(
            pdetail.stripe_product_id,
            {
              name: pack_name,
            }
          );

          // update price
          if (
            pdetail.pack_price != pack_price ||
            pdetail.pack_validity != pack_validity
          ) {
            // Deactivate old price
            await stripe.prices.update(pdetail.stripe_price_id, {
              active: false,
            });

            // Create new price
            const stripePrice = await stripe.prices.create({
              unit_amount_decimal: price,
              currency: "usd",
              recurring: validity,
              product: pdetail.stripe_product_id,
            });

            new_price_id = stripePrice.id;
            cc_updatedpp = "yes";
          }
        }
      }
    }

    const additionalFields = {
      stripe_price_id: new_price_id,
      pack_name: pack_name,
      pack_validity: pack_validity,
      pack_price: pack_price,
      validity_period: setvalidity_period,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };

    const formattedParams = convertObjectToProcedureParams(
      requestBodyWithAdditionalFields
    );

    const storedProcedure = `CALL SAEditPackage('${formattedParams}', 'pack_id = ${pack_id}')`;
    await pool.execute(storedProcedure);

    if (custom_pack === "yes") {
      const dynamicFieldsValues = `cc_name = '${company_name}',
      cc_tusers = '${company_users}',
      cc_updatedpp = '${cc_updatedpp}',
      req_add_on = '',
      req_add_on_date = '${formattedDate}'`;
      const id = `contacted_sales_id  = '${custom_cid}'`;
      await pool.execute("CALL SAUpdateContactedCompany(?, ?)", [
        dynamicFieldsValues,
        id,
      ]);

      const [getCompDesRes] = await pool.execute(
        "CALL SAget_contacted_company_cid(?)",
        [custom_cid]
      );
      const getCompDes = getCompDesRes[0][0];
      if (getCompDes) {
        const [rows] = await pool.execute("CALL getStudentById(?)", [
          getCompDes.contacted_user_id,
        ]);
        const getEmail = rows[0][0]?.email_address;
        const userFName = `${rows[0][0]?.first_name} ${rows[0][0]?.last_name}`;

        let emsg;

        if (cc_updatedpp == "yes") {
          emsg = "Company package has been updated. Please upgrade package.";
        } else {
          emsg = "Company package has been updated.";
        }

        const mailOptions = {
          from: process.env.SMTP_USER,
          to: getEmail,
          subject: "Company Package Upgrade | Decision 168",
          html: generateCompanyPackageUpgradeEmailTemplate(userFName, emsg),
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(500).json({
              error: "Failed to send email.",
            });
          } else {
            res.status(201).json({
              message: "Email sent successfully.",
            });
          }
        });
      }
    }

    res.status(200).json({
      message: "Package Updated Successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//change_package_status
router.patch("/pricing/change-package-status", async (req, res) => {
  try {
    const { pack_id, status } = req.body;

    const [rows] = await pool.execute("Call SApackage_detail(?)", [pack_id]);
    const pdetail = rows[0][0];

    if (pdetail?.custom_pack == "yes") {
      const dynamicFieldsValues = `cc_status = '${status}'`;
      const id = `contacted_sales_id  = '${pdetail.custom_cid}'`;
      await pool.execute("CALL SAUpdateContactedCompany(?, ?)", [
        dynamicFieldsValues,
        id,
      ]);
    }

    const dynamicFieldsValues2 = `pack_status = '${status}'`;
    const id2 = `pack_id  = '${pack_id}'`;
    await pool.execute("CALL SAEditPackage(?, ?)", [dynamicFieldsValues2, id2]);

    res.status(200).json({
      message: "Status Changed Successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

//edit_change_labels
router.patch("/pricing/edit-change-labels", async (req, res) => {
  try {
    const { label_id, ...otherFields } = req.body;

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL SAEditPricingLabels('${formattedParams}', 'plabel = ${label_id}')`;
    await pool.execute(storedProcedure);

    res.status(200).json({
      message: "Updated Successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
