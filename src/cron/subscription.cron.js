const { Admin_Subscription, Subscription, Organization,  Super_Admin_Cashier} = require("../models");
const cron = require("node-cron");
const { Op, Sequelize } = require("sequelize");
const { currentDate } = require("../utils/currentdate.gmt6");
const checkAuth = require("../middleware/admin.auth.js");
const utils = require("../utils/helper");

cron.schedule('0 12 * * *', subscriptionCheckCron);
// cron.schedule("* * * * *",subscriptionCheckCron);

async function subscriptionCheckCron(req, res, next) {
  try {
    const adminSubscriptions = await Admin_Subscription.findAll({
      distinct: true,
      order: [["id", "DESC"]],
      where: {
        plan_period_end: {
          [Op.lt]: currentDate,
        },
        status: "active",
      },
      include: [
        {
          model: Subscription,
        },
        {
          model: Super_Admin_Cashier,
        },
        {
          model: Organization,
        }
      ],
    });
    // console.log("adminSubscriptions.length",adminSubscriptions.length);
    // return res.json(adminSubscriptions)
    if (adminSubscriptions.length > 0) {
      for (const subscription of adminSubscriptions) {
        const userEmail = subscription.Super_Admin_Cashier.email;
        const businessName = subscription.Organization.business_name;
        const subscriptionName = subscription.Subscription.name; 
        const planEndDate = subscription.plan_period_end;
        await utils.sendSubscriptionNoftifyMail(userEmail, businessName, subscriptionName, planEndDate);
      }
    }else{
      console.log("No expired subscriptions found.");
    }
  } catch (error) {
    console.log("error", error);
  }
}
module.exports = {
  subscriptionCheckCron,
};
