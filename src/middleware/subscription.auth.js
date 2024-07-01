const helper = require("../utils/helper");
const {
  Super_Admin_Cashier,
  Organization,
  Subscription,
  Organization_Subscription,
  Admin_Subscription,
} = require("../models");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { Op } = require("sequelize");
const { currentDate } = require("../utils/currentdate.gmt6");
const momentTimezone = require("moment-timezone");


module.exports = async (req, res, next) => {
  try {
    let token = helper.getcookieAdmin(req);
    // console.log("token",token);
    if (token) {
      decodedToken = jwt.verify(token, process.env.SECRET);
      if (decodedToken) {
        // console.log("decodedToken",decodedToken);
        let admin_id = decodedToken.id;
        // const currentDate = moment().format("YYYY-MM-DD");
        console.log("currentDate", currentDate);
        // return res.json(admin);
        // console.log("admin--------------------", adminSubscriptions);
        try {
          const adminSubscription = await Admin_Subscription.findOne({
            order: [["id", "DESC"]],
            where: {
              admin_id: decodedToken.id,  
              plan_period_end: {
                [Op.gte]: currentDate,
              },
              status: "active",
            },
            include: [
              {
                model: Super_Admin_Cashier,
                attributes: [
                  "id",
                  "email",
                  "password",
                  "role_id",
                  "is_superadmin",
                ],
              },
              {
                model: Organization,
                attributes: [
                  "id",
                  "business_name",
                  "logo",
                  "theme_color",
                  "instagram_handle",
                  "facebook_handle",
                  "welcome_message",
                  "subscription_id",
                ],
              },
              {
                model: Subscription,
              },
            ],
          });

          if (!adminSubscription) {
            // If admin subscription data is not found or is null
            return res.redirect("/admin/dashboard");
          }
          if (adminSubscription) {
            const planEndDate = momentTimezone(
              adminSubscription.plan_period_end
            ).tz("America/Chicago");
            const currentLocalDate = momentTimezone().tz("America/Chicago"); // Current date in "America/Chicago" timezone

            if (planEndDate.isSameOrAfter(currentLocalDate, "day")) {
              // If plan end date is valid
              return next();
            } else {
              return res.redirect("/admin/dashboard");
            }
          }
        } catch (error) {
          console.error("Error fetching admin subscription data:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        const planEndDate = momentTimezone(admin.plan_period_end).tz(
          "America/Chicago"
        );
        // console.log("planEndDate",planEndDate);
        const currentLocalDate = momentTimezone().tz("America/Chicago"); // Current date in "America/Chicago" timezone
        // Compare plan end date with current date
        if (planEndDate.isSameOrAfter(currentLocalDate, "day")) {
          // console.log(
          //   "inside if admin.plan_period_end----",
          //   admin.plan_period_end
          // );
          // req.admin = admin;
          return next();
        } else {
          return res.redirect("/admin/dashboard");
        }
      } else {
        console.log("Invalid token provided.");
      }
      return next();
    } else {
      const { error, message, formValue } = req.query;
      console.log("Undefined token");
      return res.render("admin/auth/login.ejs", { error, message, formValue });
    }
  } catch (error) {
    next(error);
  }
};
