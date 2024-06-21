const {
    Subscription,
    Organization,
    Organization_User,
    Super_Admin_Cashier,
    Organization_Subscription,
  } = require("../../models");
  const bcrypt = require("bcrypt");
  const jwt = require("jsonwebtoken");
  const utils = require("../../utils/helper");
  const { Op } = require("sequelize");
  const { ACTIVE, BLOCKED, CREDENTIAL } = require("../../utils/constants");

  exports.getSetting = async (req, res, next) => {
    try {
       let admin = req.admin;
       let adminThemeColor = admin.Organizations[0].theme_color;
      const { page, limit, search_text, message, error, formValue } = req.query;
      const data = await Super_Admin_Cashier.findOne({
        where: { id: admin.id },
        attributes: ["id", "email", "password"],
        include: [
          {
            model: Organization,
            attributes: [
              "id",
              "business_id",
              "business_name",
              "logo",
              "theme_color",
              "instagram_handle",
              "facebook_handle",
              "welcome_message",
              "business_id"
            ]
          },
        ],
      });
      // return res.send(data)
      let adminBusinessName = admin.Organizations[0].business_name;
      let superAdmin = admin.is_superadmin;
      return res.render("admin/setting/setting.ejs", {
        data: data,
        message,
        error,
        adminThemeColor,
        adminBusinessName,
        superAdmin,
        active:12
      });
    } catch (err) {
      next(err);
    }
  };
  
  exports.editSetting = async (req, res, next) => {
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
      let admin = req.admin;
      let adminThemeColor = admin.Organizations[0].theme_color;
      let adminBusinessName = admin.Organizations[0].business_name;
      let superAdmin = admin.is_superadmin;
      res.render("admin/setting/edit-setting.ejs", {
        data: data,
        error,
        message,
        formValue,
        adminThemeColor,
        adminBusinessName,
        superAdmin,
        active:12
      });
    } catch (err) {
      next(err);
    }
  };
  
  exports.updateSetting = async (req, res, next) => {
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
        welcome_message
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
          organization.business_name = business_name;
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
        await organization.save();
      }
      req.success = "Successfully Updated.";
      next("last");
    } catch (err) {
      next(err);
    }
  };

  