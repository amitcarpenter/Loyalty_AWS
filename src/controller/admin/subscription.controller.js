const {
  Subscription,
  Organization,
  Organization_User,
  Super_Admin_Cashier,
  Admin_Subscription,
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
// STRIPE_LIVE_SECRET_KEY
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const stripe = require("stripe")(process.env.STRIPE_LIVE_SECRET_KEY);
const { ACTIVE, INACTIVE } = require("../../utils/constants");
const url = require("url");
const moment = require('moment');
const {currentDate} = require('../../utils/currentdate.gmt6');

exports.getCreateSubscription = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    return res.render("super_admin/user/subscription/create-subscription.ejs", {
      message,
      error,
      formValue,
      active: 3,
    });
  } catch (err) {
    next(err);
  }
};

exports.createSubscription = async (req, res, next) => {
  try {
    req.body.active = ACTIVE;
    console.log("req.body--------", req.body);
    // const { brand_name, logo, email, password, theme_color } = req.body;
    if (req.body.price < 1) {
      throw new Error("Price value can't be less than 1.");
    }
    // Check if trial period is less than 1
    if (req.body.trial_period < 0) {
      throw new Error("Period days value can't be less than 0.");
    }
    const product = await stripe.products.create({
      name: req.body.name,
      //add organization or business name as a product
    });
    const price = await stripe.prices.create({
      currency: "CAD",
      unit_amount: req.body.price * 100,
      recurring: {
        interval: req.body.subscription_type,
      },
      product_data: {
        name: product.name,
      },
    });
    const plan = await stripe.plans.create({
      amount: req.body.price * 100,
      currency: "CAD",
      interval: req.body.subscription_type,
      product: product.id,
    });
    // const customer = await stripe.customers.create({
    //   email: req.body.stripeEmail,
    //   // Add other customer details as needed, e.g., name, address, etc.
    // });
    console.log("product", product);
    console.log("price", price);
    console.log("plan", plan);
    // stripe.customers.create({
    //   email: req.body.stripeEmail,
    //   name: "Sourav Rajput",
    // });
    let subscription = await Subscription.create({
      name: req.body.name,
      currency: "CAD",
      price: req.body.price,
      subscription_type: req.body.subscription_type,
      trial_period: req.body.trial_period,
      status: ACTIVE,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      stripe_plan_id: plan.id,
    });
    req.success = "Successfully Created.";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.getSubscription = async (req, res, next) => {
  try {
    const { page, limit, search_text, message, error, formValue } = req.query;
    let options = {
      attributes: [
        "id",
        "name",
        "currency",
        "price",
        "subscription_type",
        "trial_period",
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: {},
    };
    let data = await Subscription.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    // return res.send(response);
    return res.render("super_admin/user/subscription/subscription.ejs", {
      message,
      error,
      formValue,
      totalItems: response.totalItems,
      items: response.items,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      search_text: search_text,
      active: 4,
    });
  } catch (err) {
    next(err);
  }
};

exports.editSubscription = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    const data = await Subscription.findOne({
      where: { id: req.params.id },
      attributes: [
        "id",
        "name",
        // "currency",
        "price",
        "subscription_type",
        "trial_period",
      ],
    });
    // return res.send(data)
    res.render("super_admin/user/subscription/edit-subscription.ejs", {
      data: data,
      error,
      message,
      formValue,
      active: 4,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSubscription = async (req, res, next) => {
  const { name, currency, price, subscription_type, trial_period } = req.body;
  try {
    const data = await Subscription.update(
      {
        name: name,
        // currency: currency,
        price: price,
        subscription_type: subscription_type,
        trial_period: trial_period,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    req.success = "Successfully updated.";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.deleteSubscription = async (req, res, next) => {
  try {
    console.log("del id", req.params.id);
    const data = await Subscription.destroy({ where: { id: req.params.id } });
    req.success = "";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.getAdminSubscriptions = async (req, res, next) => {
  try {
    let admin = req.admin;
    let admin_id = req.admin.id;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    const adminOraganizationID = admin.Organizations[0].id;
    const routePath = req.route.path;
    console.log("routePath", routePath);
    const parsedUrl = url.parse(req.url, true);
    const redirectStatus = parsedUrl.query.redirect_status;
    console.log("Redirect Status:", redirectStatus);
    // console.log("window.location.href",window.location.href);
    if (redirectStatus === "succeeded") {
      await Admin_Subscription.update(
        { status: "inactive" }, 
        { where: {
          admin_id: admin_id,
          subscription_id: 1,
          organization_id: adminOraganizationID } } 
      );
    }
    // const currentDate = moment().format("YYYY-MM-DD");
    const { page, limit, search_text, message, error, formValue } = req.query;
    let options3 = {
      attributes: [
        "id",
        "admin_id",
        "subscription_id",
        "organization_id",
        "plan_period_start",
        "plan_period_end",
        "status",
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: {
        admin_id: admin_id,
        subscription_id: 1,
        organization_id: adminOraganizationID,
        plan_period_end: {
          [Op.gte]: currentDate, // Greater than or equal to the current date
        },
        status:"active"
      },
      include: [
        {
          model: Subscription,
          attributes: [
            "id",
            "name",
            "currency",
            "price",
            "subscription_type",
            "trial_period",
          ]
        },
      ],
    };
    
    let freeSubscription = await Admin_Subscription.findOne(options3);
    // return res.json(freeSubscription)
    let options = {
      attributes: [
        "id",
        "name",
        "currency",
        "price",
        "subscription_type",
        "trial_period",
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: {},
    };
  
    let data = await Subscription.findAndCountAll(options);
    let options2 = {
      distinct: true,
      order: [["id", "DESC"]],
      where: {
        organization_id: adminOraganizationID,
        admin_id: admin_id,
        plan_period_end: {
          [Op.gte]: currentDate, // Greater than or equal to the current date
        },
        status:"active"
      },
      include: [
        {
          model: Subscription,
        },
      ],
    };
  
    let adminSubscription = await Admin_Subscription.findOne(options2);
    // return res.json(adminSubscription)
    let response = utils.getPagingData(res, data, page + 1, limit);
    let superAdmin = admin.is_superadmin;
    // return res.json(adminSubscription);
    return res.render("admin/subscription/subscription.ejs", {
      message,
      error,
      formValue,
      totalItems: response.totalItems,
      items: response.items,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      search_text: search_text,
      adminThemeColor,
      adminBusinessName,
      key: process.env.STRIPE_LIVE_PUBLISHABLE_KEY,
      adminSubscription,
      redirectStatus,
      freeSubscription,
      superAdmin,
      active: 11,
    });
  } catch (err) {
    next(err);
  }
};

// Admin subscription
exports.getAdminSubscription = async (req, res, next) => {
  try {
    let admin = req.admin;
    let admin_id = req.admin.id;
    let adminOraganizationID = admin.Organizations[0].id;
    const { search_text, message, error, formValue } = req.query;
    let options = {
      // attributes: [
      //   "id",
      //   "name",
      //   "currency",
      //   "price",
      //   "subscription_type",
      //   "trial_period",
      // ],
      distinct: true,
      order: [["id", "DESC"]],
      where: {
        organization_id: adminOraganizationID,
        admin_id: admin_id,
        status: "active",
      },
      include: [
        {
          model: Subscription,
        },
      ],
    };

    let data = await Admin_Subscription.findOne(options);
    // console.log(adminSubInfo);
    // return res.json(data)
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    return res.render("admin/subscription/adminSubscriptioninfo.ejs", {
      message,
      error,
      formValue,
      adminThemeColor,
      data,
      adminBusinessName,
    });
  } catch (error) {
    console.log("error", error);
  }
};

exports.getAdminPurchaseSubscription = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    // let admin = req.admin;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let data = req.params.id;
    return res.render("admin/subscription/purchase_subscription.ejs", {
      message,
      error,
      formValue,
      adminThemeColor,
      adminBusinessName,
      key: process.env.STRIPE_LIVE_PUBLISHABLE_KEY,
      amount: 25,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.postProcessSubscription = async (req, res, next) => {
  try {
    console.log("postProcessSubscription api hit");
    const admin = req.admin;
    const adminID = admin.id;
    const adminOraganizationID = admin.Organizations[0].id;
    const adminEmail = admin.email;
    const stripe_customer_id = admin.stripe_customer_id;

    if (stripe_customer_id == null) {
      var customer = await stripe.customers.create({
        // name: req.body.billing_details.name,
        email: adminEmail,
        // address: req.body.billing_details.address,
      });
      var customer_id = await Super_Admin_Cashier.update(
        {
          stripe_customer_id: customer.id,
        },
        {
          where: { id: adminID },
        }
      );
    }

    const plan = await Subscription.findOne({ where: { id: req.params.id } });
    console.log("plan------", plan);
    // Create Stripe customer
    // const customer = await stripe.customers.create({ email: adminEmail });
    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripe_customer_id == null ? customer.id : stripe_customer_id,
      items: [{ price: plan.stripe_price_id }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });
    const planStartDate = new Date(subscription.current_period_start * 1000);
    const planEndDate = new Date(subscription.current_period_end * 1000);

    console.log("Plan Start Date:", planStartDate);
    console.log("Plan End Date:", planEndDate);

    console.log("subscription", subscription);
    // console.log("paymentIntent.client_secret",paymentIntent.client_secret);
    console.log(
      "subscription.latest_invoice.payment_intent.client_secret",
      subscription.latest_invoice.payment_intent.client_secret
    );
    // Store subscription details in database
    const adminSubscription = await Admin_Subscription.create({
      admin_id: adminID,
      organization_id: adminOraganizationID,
      subscription_id: plan.id,
      stripe_customer_id: stripe_customer_id,
      stripe_subscription_id: subscription.id,
      stripe_plan_id: plan.stripe_plan_id,
      stripe_plan_price_id: plan.stripe_price_id,
      // stripe_token_id: req.body.stripeToken,
      paid_amount: plan.price,
      paid_amount_currency: plan.currency,
      plan_interval: plan.subscription_type,
      default_payment_method: "stripe",
      plan_period_start: planStartDate,
      plan_period_end: planEndDate,
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status,
    });
    console.log("555555555555555",{
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      stripe_subscription_id: subscription.id,
      ms: "Form submitted successfully",
    });
    res.send({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      stripe_subscription_id: subscription.id,
      ms: "Form submitted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.subscriptionStatusUpdate = async (req, res) => {
  try {
    const admin = req.admin;
    const adminID = admin.id;
    const adminOraganizationID = admin.Organizations[0].id;
    const adminEmail = admin.email;
    const stripe_customer_id = admin.stripe_customer_id;
    console.log("API hit");
    console.log("req.body", req.body);
    // Assuming subscriptionId and status are sent in the request body
    const { id, status } = req.body;
    const data = await Organization.update(
      { trial_start_date: null, trial_end_date: null },
      { where: { id: adminOraganizationID } } // Condition to find the subscription to update
    );

    // Send a response indicating success
    res
      .status(200)
      .json({ message: "Subscription status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.subscriptionWebhook = async (req, res, next) => {
  const endpointSecret = "whsec_rqOCGOMjPK3OJcdGwmOXmwMnKcK70mU3";

  let sig = req.headers["stripe-signature"];

  var event = req.body;

  console.log("event----------", event);

  // Handle the event
  switch (event.type) {
    case "customer.subscription.created":
      console.log("customer.subscription.created");
      var subscription = event.data.object;
      const data = await Admin_Subscription.update(
        {
          status: subscription.status,
        },
        {
          where: { stripe_subscription_id: subscription.id },
        }
      );
      console.log("customer.subscription.created", data);
      break;
    case "customer.subscription.deleted":
      console.log("customer.subscription.deleted");
      var subscription = event.data.object;
      var immediateCancel = await Admin_Subscription.update(
        {
          status: subscription.status,
          plan_period_end: new Date(subscription.canceled_at * 1000),
        },
        {
          where: { stripe_subscription_id: subscription.id },
        }
      );
      console.log("immediateCancel", immediateCancel);
      break;
    case "customer.subscription.updated":
      console.log("customer.subscription.updated");
      var subscription = event.data.object;

      var subscriptionCancel = await Admin_Subscription.update(
        {
          status: subscription.status,
        },
        {
          where: { stripe_subscription_id: subscription.id },
        }
      );
      console.log("subscriptionCancel", subscriptionCancel);
      break;
    case "subscription_schedule.created":
      var subscriptionSchedule = event.data.object;
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  // Return a 200 res to acknowledge receipt of the event
  res.json({ received: true });
};

exports.cencelProcessSubscription = async (req, res, next) => {
  try {
    console.log("Body", req.body);

    let stripe_subscription_id = req.params.stripe_subscription_id;

    var cancelSubscription = await stripe.subscriptions.update(
      stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    console.log(cancelSubscription);

    var endDate = new Date(cancelSubscription.current_period_end * 1000);

    let cancelData = await Admin_Subscription.update(
      {
        plan_period_end: new Date(cancelSubscription.current_period_end * 1000),
        cancel_at_period_end: true,
      },
      {
        where: { stripe_subscription_id: stripe_subscription_id },
      }
    );
    req.success = "Your subscription has been successfully cancelled.";
    return next("last");
    // res.status(200).json({ data: "User's subscription will end at "});
  } catch (error) {
    console.log("error", error);
  }
};
