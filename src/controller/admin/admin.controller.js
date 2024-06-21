const {
  Subscription,
  Organization,
  Organization_User,
  Super_Admin_Cashier,
  Admin_Subscription
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const { ACTIVE, BLOCKED, CREDENTIAL } = require("../../utils/constants");
const crypto = require('crypto');
const moment = require("moment");
const { log } = require("util");
// const admin = require(".");
const {currentDate} = require('../../utils/currentdate.gmt6');
function generateHexacode() {
  const randomBytes = crypto.randomBytes(3);
  return randomBytes.toString('hex').toUpperCase();
}
exports.getCreateAdmin = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    return res.render("super_admin/user/admin/create-admin.ejs", {
      message,
      error,
      formValue,
      active:1
    });
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    console.log("req.body--------", req.body);
    const {
      business_name,
      logo,
      email,
      password,
      theme_color,
      instagram_handle,
      facebook_handle,
      welcome_message
    } = req.body;

    if (req.file) {
      req.body.logo = req.file.filename;
    }
    // if (email) {
    let user = await Super_Admin_Cashier.findOne({
      where: { email: req.body.email.trim() },
    });
    // }
    if (user) {
      throw new Error("Email already exist.");
    }
    if (!utils.isEmail(email)) {
      throw new Error("Invalid email.");
    }
    if (!email) {
      throw new Error("Invalid email.");
    }
    if (!password) {
      throw new Error("Invalid password.");
    }
    if (!business_name) {
      throw new Error("Invalid business name.");
    }
    if (!theme_color) {
      throw new Error("Invalid theme color.");
    }
    if (!instagram_handle) {
      throw new Error("Invalid instagram_handle.");
    }
    if (!facebook_handle) {
      throw new Error("Invalid facebook_handle.");
    }
    if (!welcome_message) {
      throw new Error("Invalid welcome_message.");
    }
    // console.log("welcome message",welcome_message.length);
    // console.log("welcome message trim",welcome_message.trim().length);
    const businessNameWithoutSpaces = business_name.replace(/\s/g, "");
    // console.log("messageWithoutSpaces",messageWithoutSpaces.length);
    if (businessNameWithoutSpaces.length > 17) {
      throw new Error("Business Name cannot exceed 17 characters (excluding spaces).");
    }
    const messageWithoutSpaces = welcome_message.replace(/\s/g, "");
    // console.log("messageWithoutSpaces",messageWithoutSpaces.length);
    if (messageWithoutSpaces.length > 15) {
      throw new Error("Welcome message cannot exceed 15 characters (excluding spaces).");
    }
    let adminPassword = req.body.password
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;
    const hexacode = generateHexacode();
    const freeSubscription = await Subscription.findOne({where: { id: 1 }})
    const trialEndDate = moment().add(freeSubscription.trial_period, 'days').toDate();
    // const currentDate = new Date();
    // const dateString = currentDate.toISOString();
    // const todayDate = dateString.split("T")[0];
    // const currentDate = moment().format("YYYY-MM-DD");
    let super_admin_cashier = await Super_Admin_Cashier.create({
      email: email.trim(),
      password: hash.trim(),
      role_id: true,
      status: ACTIVE,
    });
    let organization = await Organization.create({
      business_name: business_name.trim(),
      logo: req.file.filename,
      theme_color: theme_color.trim(),
      instagram_handle: instagram_handle.trim(),
      facebook_handle: facebook_handle.trim(),
      welcome_message: welcome_message.trim(),
      business_id : hexacode,
    });
    let businessId = organization.business_id ;
    let businessName = organization.business_name ;
    let organization_user = await Organization_User.create({
      super_admin_cashier_id: super_admin_cashier.id,
      super_admin_cashier_type: false,
      organization_id: organization.id,
    });
    let adminAssignFreeSubscription = await Admin_Subscription.create({
      admin_id: super_admin_cashier.id,
      organization_id: organization.id,
      subscription_id: 1,
      plan_period_start:currentDate,
      plan_period_end:trialEndDate,
      status:"active"
    });
    await utils.sendCredentialMail(super_admin_cashier, adminPassword, businessId, businessName);
    req.success = "Successfully Created.";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.getAdmin = async (req, res, next) => {
  try {
    const { page, limit, search_text, message, error, formValue } = req.query;
    const options = {
      attributes: ["id", "email", "password"],
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
            "business_id"
          ],
        },
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: { role_id: true },
    };
    if (search_text) {
      options.include[0].where = {
        business_name: { [Op.like]: "%" + search_text + "%" }
      };
    }
    const data = await Super_Admin_Cashier.findAndCountAll(options);
    // return res.send(data)
    const response = utils.getPagingData(res, data, page + 1, limit);
    // return res.send(response)
    return res.render("super_admin/user/admin/admin.ejs", {
      message,
      error,
      formValue,
      totalItems: response.totalItems,
      items: response.items,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      search_text: search_text,
      active:2
    });
  } catch (err) {
    next(err);
  }
};

exports.editAdmin = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    const data = await Super_Admin_Cashier.findOne({
      where: { id: req.params.id },
      attributes: ["id", "email", "password"],
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
          ],
        },
      ],
    });
    // return res.send(data)
    // const subscriptionList = await Subscription.findAll();
    res.render("super_admin/user/admin/edit-admin.ejs", {
      data: data,
      error,
      message,
      formValue,
      active:2
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const {
      business_name,
      logo,
      email,
      password,
      theme_color,
      instagram_handle,
      facebook_handle,
      welcome_message,
    } = req.body;

    // Check if the admin exists
    const admin = await Super_Admin_Cashier.findByPk(adminId);
    console.log("admin------", admin);

    const existingData = await Super_Admin_Cashier.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Organization
        },
      ],
    });

    // Update Super_Admin_Cashier details
    if (email) {
      admin.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      admin.password = hash;
    }
    await admin.save();

    // Update Organization details
    const organization = await Organization.findOne({
      where: { id: existingData.Organizations[0].id  },
    });
    console.log("organization---", organization);
    if (organization) {
      if (business_name) {
        organization.business_name = business_name.trim();
      }
      if (req.file) {
        organization.logo = req.file.filename;
      }
      if (theme_color) {
        organization.theme_color = theme_color;
      }
      if (instagram_handle) {
        organization.instagram_handle = instagram_handle;
      }
      if (facebook_handle) {
        organization.facebook_handle = facebook_handle;
      }
      if (welcome_message) {
        organization.welcome_message = welcome_message;
      }
      // if (subscription_id) {
      //   organization.subscription_id = subscription_id;
      // }
      await organization.save();
    }
    req.success = "Successfully Updated.";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.loginAsAdmin = async (req, res, next) =>{
  try {
    const admin = await Super_Admin_Cashier.findOne({
      where: { id:req.params.admin_id},
    });
    // console.log("req.params.admin_id",req.params.admin_id);
   
    // console.log("superAdmin",superAdmin);
    if (!admin) {
      throw new Error("Invalid user name.");
    }
    if (admin.status !== ACTIVE) { 
      throw new Error('Your account is not active or blocked.'); 
    }
    if(admin)
    {
      const superAdmin = await Super_Admin_Cashier.update(
        { is_superadmin: true}, 
        { where: { id: admin.id } }
      );
      let token = jwt.sign(
        { id: admin.id, email: admin.email, role_id: admin.role_id,
          //  role:"superadmin"
          },
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
    }
  } catch (error) {
    console.log('error',error);
  }
}

exports.ForgetPassword = async (req, res, next)=>{

}
exports.deleteAdmin = async (req, res, next) => {
  try {
    console.log("del id", req.params.id);
    const data = await Super_Admin_Cashier.destroy({
      where: { id: req.params.id },
    });
    // req.success = "";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.blockAdmin = async (req, res, next) => {
  try {
    console.log("Block admin ID:", req.params.id);
    const adminId = req.params.id;
    // Assuming 'status' is the field representing the admin's status
    const admin = await Super_Admin_Cashier.findByPk(adminId);
    if (!admin) {
      throw new Error("Admin not found.");
    }
    if (admin.status === "BLOCKED") {
      // Update status from "BLOCKED" to "ACTIVE" instead of throwing an error
      await Super_Admin_Cashier.update(
        { status: "ACTIVE" }, 
        { where: { id: adminId } }
      );
      req.success = "Admin is now active.";
      next("last");
    } else {
      // If status is not "BLOCKED", block the admin
      const blockedAdmin = await Super_Admin_Cashier.update(
        { status: "BLOCKED" }, 
        { where: { id: adminId } }
      );
      req.success = "Successfully Blocked.";
      next("last");
    }
  } catch (err) {
    next(err);
  }
};
