const { Super_Admin_Cashier } = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ACTIVE, BLOCKED, CREDENTIAL } = require("../../utils/constants");

exports.getLogin = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    return res.render("admin/auth/login.ejs", { message, error, formValue });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const admin = await Super_Admin_Cashier.findOne({
      where: { email: req.body.email.trim()},
    });
    if (!admin) {
      throw new Error("Invalid user name.");
    }
    if (admin.status !== ACTIVE) { 
      throw new Error('Your account is not active or blocked.'); 
    }
    let result = await bcrypt.compare(req.body.password, admin.password);
    if (result) {
      let token = jwt.sign(
        { id: admin.id, email: admin.email, role_id: admin.role_id },
        process.env.SECRET,
        { expiresIn: "365d" }
      );
      console.log("token", token);
      await Super_Admin_Cashier.update(
        { token: token },
        { where: { id: admin.id } }
      );
      res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
      // res.clearCookie("dd-user");
      switch (admin.role_id) {
        case 0:
          return res.redirect("/admin/superadmin/dashboard");
        case 1:
          return res.redirect("/admin/dashboard");
        case 2:
          return res.redirect("/cashier/dashboard");
        default:
          console.log("Invalid role_id:", super_admin_cashier.role_id);
      }
      // return res.redirect("/admin/superadmin/dashboard");
    } else {
      throw new Error("Invalid password.");
    }
  } catch (err) {
    next(err);
  }
};

exports.logOut = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    res.clearCookie("dd-token");
    req.success = "Successfully LogOut.";
    next("last");
  } catch (err) {
    next(err);
  }
};
