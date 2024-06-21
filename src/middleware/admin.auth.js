const helper = require("../utils/helper");
const {
  Super_Admin_Cashier,
  Organization,
  Subscription,
  Organization_Subscription,
  Admin_Subscription,
} = require("../models");
const jwt = require("jsonwebtoken");
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
        let admin = await Super_Admin_Cashier.findOne({
          where: { id: decodedToken.id },
          attributes: ["id", "email", "password", "role_id", "is_superadmin"],
          include: [
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
              include: [
                {
                  model: Subscription,
                  attributes: [
                    "id",
                    "name",
                    "currency",
                    "price",
                    "subscription_type",
                  ],
                },
                {
                  model: Admin_Subscription,
                  order: [["id", "DESC"]],
                   limit: 1,
                   where: {
                    admin_id: decodedToken.id,
                    plan_period_end: {
                      [Op.gte]: currentDate,
                    },
                    status: "active",
                  },
                },
              ],
            },
          ],
        });
        // return res.send(admin);
        // console.log("admin--------------------", admin);
        if (admin) {
          // console.log("admin",admin);
          req.admin = admin;
          return next();
        } else {
          console.log("No admin found");
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
