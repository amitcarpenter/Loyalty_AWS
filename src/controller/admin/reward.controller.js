const {
  Subscription,
  Super_Admin_Cashier,
  Reward,
  Loyalty_Point_Rule,
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
// const moment = require('moment');
const moment = require('moment-timezone');
const {currentDate} = require('../../utils/currentdate.gmt6');


exports.getCreateReward = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    return res.render("admin/reward/create-reward.ejs", {
      message,
      error,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:6
    });
  } catch (err) {
    next(err);
  }
};

exports.createReward = async (req, res, next) => {
  try {
    let admin = req.admin;
    let adminOraganizationID = admin.Organizations[0].id;
    req.body.organization_id = adminOraganizationID;
    const { title, start_date, end_date, image, loyalty_point } = req.body;
    // Validate start and end dates
    // const today = currentDate;
    if (start_date && end_date) {
      const startDate = moment(start_date);
      const endDate = moment(end_date);
      const today = currentDate;
      
      if (startDate.isBefore(today, 'day') || endDate.isBefore(today, 'day')) {
        throw new Error("Start date and end date cannot be less than the current date.");
      }
      if (endDate.isBefore(startDate, 'day')) {
        throw new Error("End date can't be less than the start date.");
      }
    }
    const messageWithoutSpaces = title.replace(/\s/g, "");
    // console.log("messageWithoutSpaces",messageWithoutSpaces.length);
    if (messageWithoutSpaces.length > 15) {
      throw new Error("Reward Title cannot exceed 15 characters (excluding spaces).");
    }
   
    const data = await Reward.create(req.body);
    req.success = "Successfully Created.";
    next("last");
  } catch (err) {
    next(err);
  }
};


exports.getReward = async (req, res, next) => {
  try {
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let adminOraganizationID = admin.Organizations[0].id;
    let superAdmin = admin.is_superadmin;
    const { page, limit, search_text, message, error, formValue } = req.query;
    let options = {
      attributes: [
        "id",
        "title",
        "start_date",
        "end_date",
        "loyalty_point"
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: {organization_id:adminOraganizationID}
    };
    if (search_text) {
      console.log("search_text-------", search_text);
      req.query.where = { name: { [Op.like]: "%" + search_text + "%" } };
    }
    let data = await Reward.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
      // return res.send(response);
    return res.render("admin/reward/reward.ejs", {
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
      active:7
    });
  } catch (err) {
    next(err);
  }
};

exports.editReward = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    const data = await Reward.findOne({
      where: { id: req.params.id },
      attributes: [
        "id",
        "title",
        "start_date",
        "end_date",
        "loyalty_point"
      ],
    });
    // return res.send(data)
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    res.render("admin/reward/edit-reward.ejs", {
      data: data,
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:7
    });
  } catch (err) {
    next(err);
  }
};

exports.updateReward = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const { title, start_date, end_date, loyalty_point, active } = req.body;
    
    // Check if req.file exists to conditionally update the image
    const updateFields = {
      title: title,
      start_date: start_date,
      end_date: end_date,
      loyalty_point: loyalty_point,
      active: active
    };

    const data = await Reward.update(updateFields, {
      where: {
        id: req.params.id,
      },
    });
    
    req.success = "Successfully Updated.";
    next("last");
  } catch (err) {
    next(err);
  }
};


exports.deleteReward = async (req, res, next) => {
  try {
    console.log("del id", req.params.id);
    const data = await Reward.destroy({ where: { id: req.params.id } });
    next("last");
  } catch (err) {
    next(err);
  }
};
