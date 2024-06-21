const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization,
  Organization_Subscription,
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
var validator = require('validator');
// const moment = require("moment");
const moment = require('moment-timezone');
const {currentDate} = require('../../utils/currentdate.gmt6');
exports.getCreateCashier = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    return res.render("admin/cashier/create-cashier.ejs", {
      message,
      error,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:2
    });
  } catch (err) {
    next(err);
  }
};

exports.createCashier = async (req, res, next) => {
  try {
    console.log("req.body--------", req.body);
    const { name, email, password, date_of_birth, contact_number } = req.body;
    const today = currentDate;
    if (date_of_birth) {
      const dob = moment(date_of_birth);
      if (dob.isAfter(today, 'day')) {
        throw new Error("Date of birth can't be greater than the current date.");
      }
    }
    if (email) {
      let user = await Super_Admin_Cashier.findOne({
        where: { email: req.body.email.trim() },
      });
      if (user) {
        throw new Error("Email already exist.");
      }
      if (!utils.isEmail(email)) {
        throw new Error("Invalid email.");
      }
    } else {
      throw new Error("Invalid email.");
    }
    if (!password) {
      throw new Error("Invalid password.");
    }
    if (!date_of_birth) {
      throw new Error("Invalid date of birth.");
    }
    if (!contact_number) {
      throw new Error("Invalid contact_number.");
    }
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;

    // const trialEndDate = moment().add(7, 'days').toDate();
    // const currentDate = new Date();
    // const dateString = currentDate.toISOString();
    // const todayDate = dateString.split("T")[0];

    let image;
    if (req.file) {
      image = req.file.filename;
    }

    let super_admin_cashier = await Super_Admin_Cashier.create({
      name: name.trim(),
      email: email.trim(),
      password: hash.trim(),
      date_of_birth: date_of_birth,
      role_id: 2,
      image: image, // Use image variable here
      contact_number: contact_number.trim(),
      status: ACTIVE,
    });

    let admin = req.admin;
    // let adminThemeColor = admin.Organizations[0].theme_color;
    let organization_user = await Organization_User.create({
      super_admin_cashier_id: super_admin_cashier.id,
      super_admin_cashier_type: 2,
      organization_id: admin.Organizations[0].id,
    });

    req.success = "Successfully Created.";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.getCashier = async (req, res, next) => {
  try {
    let admin = req.admin;
    const { page, limit, search_text, message, error, formValue } = req.query;
    let options = {
      attributes: [
        "id",
        "super_admin_cashier_id",
        "super_admin_cashier_type",
        "organization_id",
      ],
      include: [
        {
          model: Super_Admin_Cashier,
          required: true,
          attributes: [
            "id",
            "name",
            "email",
            "password",
            "date_of_birth",
            "image",
            "contact_number",
          ],
        },
        {
          model: Organization,
          required: false,
          attributes: [
            "business_name",
            "logo",
            "theme_color",
            "instagram_handle",
            "facebook_handle",
          ],
        },
      ],
      where: {
        organization_id: admin.Organizations[0].id,
        super_admin_cashier_type:2,
      },
      order: [["id", "DESC"]],
    };
    if (search_text) {
      console.log("search_text-------", search_text);
      req.query.where = { name: { [Op.like]: "%" + search_text + "%" } };
    }
    let data = await Organization_User.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    // return res.send(response);
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    // console.log("superAdmin",superAdmin);
    return res.render("admin/cashier/cashier.ejs", {
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
      superAdmin,
      active:3
    });
  } catch (err) {
    next(err);
  }
};

exports.editCashier = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    let admin = req.admin;
    const data = await Organization_User.findOne({
      // where: { super_admin_cashier_id: req.params.id },
      attributes: [
        "id",
        "super_admin_cashier_id",
        "super_admin_cashier_type",
        "organization_id",
      ],
      include: [
        {
          model: Super_Admin_Cashier,
          required: false,
          attributes: [
            "id",
            "name",
            "email",
            "password",
            "date_of_birth",
            "image",
            "contact_number",
          ],
        },
      ],
      where: {
        super_admin_cashier_id: req.params.id,
        organization_id: admin.Organizations[0].id,
        super_admin_cashier_type:2,
      },
    });
    // return res.send(data)
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    res.render("admin/cashier/edit-cashier.ejs", {
      data: data,
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:3
    });
  } catch (err) {
    next(err);
  }
};

// exports.updateCashier = async (req, res, next) => {
//   try {
//     const adminId = req.params.id;
//     const { name, email, password, date_of_birth, image, contact_number } =
//       req.body;
//     console.log("req.body",req.body);
//     console.log("req.body.name",req.body.name);
//     console.log("req.body.contact",req.body.contact_number);
//     const data = await Super_Admin_Cashier.update(
//       {
//         name: name,
//         email: email,
//         password: password,
//         date_of_birth: date_of_birth,
//         image: req.file.filename,
//         contact_number: contact_number,
//       },
//       {
//         where: {
//           id: req.params.id,
//         },
//       }
//     );
//     // return res.send(data)
//     req.success = "Successfully Updated.";
//     next("last");
//   } catch (err) {
//     next(err);
//   }
// };

// exports.updateCashier = async (req, res, next) => {
//   try {
//     const { name, email, password, date_of_birth, contact_number } = req.body;
//     // Fetch the existing cashier data
//     let admin = req.admin;
//     const existingCashier = await Organization_User.findOne({
//       include: [
//         {
//           model: Super_Admin_Cashier,
//           attributes: [
//             "id",
//             "name",
//             "email",
//             "password",
//             "date_of_birth",
//             "image",
//             "contact_number",
//           ],
//         },
//       ],
//       where: {
//         super_admin_cashier_id: req.params.id,
//         organization_id: admin.Organizations[0].id,
//         super_admin_cashier_type: true,
//       },
//     });
//     console.log();
//     // Update the cashier data
//     // if (existingCashier && existingCashier.Super_Admin_Cashier) {
//     //   existingCashier.Super_Admin_Cashier.name = name;
//     //   existingCashier.Super_Admin_Cashier.email = email;
//     //   existingCashier.Super_Admin_Cashier.password = password;
//     //   existingCashier.Super_Admin_Cashier.date_of_birth = date_of_birth;
//     //   existingCashier.Super_Admin_Cashier.contact_number = contact_number;

//     //   await existingCashier.Super_Admin_Cashier.save();
//     //   req.success = "Cashier data updated successfully.";
//     //   // Redirect or respond as needed
//     // } else {
//     //   // Handle if the cashier data doesn't exist
//     //   req.error = "Cashier data not found.";
//     //   // Redirect or respond as needed
//     // }
//   } catch (err) {
//     next(err);
//   }
// };
exports.updateCashier = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const { name, image, email, password, date_of_birth, contact_number } =
      req.body;

    // Check if the admin exists
    const admin = await Super_Admin_Cashier.findByPk(adminId);
    console.log("admin------", admin);
    
    // Update Super_Admin_Cashier details
    if (name) {
      admin.name = name;
    }
    if (email) {
      admin.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      admin.password = hash;
    }
    if (date_of_birth) {
      admin.date_of_birth = date_of_birth;
    }
    if (contact_number) {
      admin.contact_number = contact_number;
    }
    if (req.file) {
      admin.image = req.file.filename;
    }
    await admin.save();

    // Update Organization details
    // const organization = await Organization.findOne({
    //   where: { id: existingData.Organizations[0].id },
    // });
    // console.log("organization---", organization);
    // if (organization) {
    //   if (business_name) {
    //     organization.business_name = business_name;
    //   }
    //   if (req.file) {
    //     organization.logo = req.file.filename;
    //   }
    //   if (theme_color) {
    //     organization.theme_color = theme_color;
    //   }
    //   if (instagram_handle) {
    //     organization.instagram_handle = instagram_handle;
    //   }
    //   if (facebook_handle) {
    //     organization.facebook_handle = facebook_handle;
    //   }
    //   if (welcome_message) {
    //     organization.welcome_message = welcome_message;
    //   }
    //   if (subscription_id) {
    //     organization.subscription_id = subscription_id;
    //   }
    //   await organization.save();
    // }
    req.success = "Successfully Updated.";
    next("last");
  } catch (err) {
    next(err);
  }
};
// exports.updateCashier = async (req, res, next) => {
//   try {
//     const adminId = req.params.id;
//     const { name, email, password, date_of_birth, image, contact_number } =
//       req.body;

//     // Retrieve the cashier
//     const admin = await Super_Admin_Cashier.findOne({
//       where: {
//         id: req.params.id,
//       },
//     });

//     // Check if the cashier exists
//     if (!admin) {
//       req.error = "Cashier not found";
//       return next("last"); // Handle the error gracefully
//     }

//     // Update cashier details
//     if (name) admin.name = name;
//     if (email) admin.email = email;
//     if (req.file) admin.image = req.file.filename;
//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       const hash = await bcrypt.hash(password, salt);
//       admin.password = hash;
//     }
//     if (date_of_birth) admin.date_of_birth = date_of_birth;
//     if (contact_number) admin.contact_number = contact_number;

//     // Save the updated cashier
//     await admin.save();

//     req.success = "Successfully Updated.";
//     next("last");
//   } catch (err) {
//     next(err);
//   }
// };

// exports.updateCashier = async (req, res, next) => {
//   try {
//     const adminId = req.params.id;
//     const { name, email, password, date_of_birth, contact_number } = req.body;
//     console.log("req.body",req.body);
//     console.log("req.body.name",req.body.name);
//     console.log("req.body.contact",req.body.contact_number);

//     // Check if req.file exists to conditionally update the image
//     const updateFields = {
//       name: name,
//       email: email,
//       password: password,
//       date_of_birth: date_of_birth,
//       contact_number: contact_number,
//     };

//     if (req.file) {
//       updateFields.image = req.file.filename;
//     }

//     const data = await Super_Admin_Cashier.update(updateFields, {
//       where: {
//         id: req.params.id,
//       },
//     });

//     req.success = "Successfully Updated.";
//     next("last");
//   } catch (err) {
//     next(err);
//   }
// };

exports.deleteCashier = async (req, res, next) => {
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
