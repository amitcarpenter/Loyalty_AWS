const helper = require("../utils/helper")
const { Super_Admin_Cashier } = require("../models")
const jwt = require("jsonwebtoken")

module.exports = async (req, res, next) => {
    let token = helper.getcookie(req)
    if (token) {
        decodedToken = jwt.verify(token, process.env.SECRET)
        console.log("decodedToken",decodedToken);
        if (decodedToken) {
            let user = await Super_Admin_Cashier.findOne({ where : {id : decodedToken.id }})
            // console.log("user",user);
            if (user) {
                req.profile = user
                return next()
            } else { 
                console.log("No user found")
            }
        } else {
            console.log("Invalid token provided.")
        }
        return next()
    } else {
        const {error, message, formValue, isLoggedIn } = req.query;
        console.log("Undefine token")
        return res.render('web/user/welcome/welcome.ejs', {error, message, formValue, isLoggedIn});
    }
}

const helper = require("../utils/helper");
const {
  Super_Admin_Cashier,
  Organization,
  Subscription,
  Organization_Subscription,
} = require("../models");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    let token = helper.getcookieAdmin(req);
    // console.log("token",token);
    if (token) {
      decodedToken = jwt.verify(token, process.env.SECRET);
      if (decodedToken) {
        // console.log("decodedToken",decodedToken);
        let user = await Super_Admin_Cashier.findOne({
          where: { id: decodedToken.id },
          attributes: ["id", "email", "password","role_id","is_superadmin"],
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
              ],
            },
          ],
        });
        // return res.send(admin)
        console.log("admin--------------------", admin);
        if (user) {
          // console.log("admin",admin);
          req.user = user;
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
