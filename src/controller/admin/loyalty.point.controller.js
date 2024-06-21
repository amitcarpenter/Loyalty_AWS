const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization_Subscription,
  Loyalty_Point_Rule,
  PointPerDollar
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const Joi = require("joi")
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const Response = require("../../utils/response");

exports.getCreateLoyaltyPoint = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    return res.render("admin/loyalty/create-loyalty.ejs", {
      message,
      error,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active: 4
    });
  } catch (err) {
    next(err);
  }
};

exports.createLoyaltyPoint = async (req, res, next) => {
  try {
    const {
      start_transaction_amount,
      end_transaction_amount,
      loyalty_point,
      status,
    } = req.body;

    console.log("req.body", req.body);

    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;
    req.body.organization_id = adminOrganizationID;

    // Check if end_transaction_amount is less than or equal to start_transaction_amount
    if (Number(end_transaction_amount) <= Number(start_transaction_amount)) {
      throw new Error("End transaction amount must be greater than start transaction amount.");
    }
    // Check if there are any existing rules with overlapping ranges
    let overlappingRule = await Loyalty_Point_Rule.findOne({
      where: {
        [Op.and]: [
          { start_transaction_amount: { [Op.lte]: end_transaction_amount } },
          { end_transaction_amount: { [Op.gte]: start_transaction_amount } },
          { organization_id: adminOrganizationID },
        ],
      },
    });
    // If there is an overlapping rule, throw an error
    if (overlappingRule) {
      throw new Error("Overlapping transaction amount range already exists.");
    }
    // No overlapping rule, create a new entry
    let data = await Loyalty_Point_Rule.create({
      start_transaction_amount: start_transaction_amount,
      end_transaction_amount: end_transaction_amount,
      loyalty_point: loyalty_point,
      organization_id: adminOrganizationID,
      status: status,
    });
    req.success = "Successfully Created.";
    next("last");
  } catch (err) {
    next(err);
  }
};


exports.getLoyaltyPoint = async (req, res, next) => {
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
        "start_transaction_amount",
        "end_transaction_amount",
        "loyalty_point",
        "status",
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: { organization_id: adminOraganizationID },
    };
    if (search_text) {
      console.log("search_text-------", search_text);
      req.query.where = { name: { [Op.like]: "%" + search_text + "%" } };
    }
    let data = await Loyalty_Point_Rule.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    //   return res.send(response);
    return res.render("admin/loyalty/loyalty.ejs", {
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
      active: 5
    });
  } catch (err) {
    next(err);
  }
};

exports.editLoyaltyPoint = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    const data = await Loyalty_Point_Rule.findOne({
      where: { id: req.params.id },
      attributes: [
        "id",
        "start_transaction_amount",
        "end_transaction_amount",
        "loyalty_point",
        "status",
      ],
    });
    // return res.send(data)
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    res.render("admin/loyalty/edit-loyalty.ejs", {
      data: data,
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active: 5
    });
  } catch (err) {
    next(err);
  }
};

exports.updateLoyaltyPoint = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const {
      start_transaction_amount,
      end_transaction_amount,
      loyalty_point,
      status,
    } = req.body;
    const data = await Loyalty_Point_Rule.update(
      {
        start_transaction_amount: start_transaction_amount,
        end_transaction_amount: end_transaction_amount,
        loyalty_point: loyalty_point,
        status: status,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    req.success = "Successfully Updated.";
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.deleteLoyaltyPoint = async (req, res, next) => {
  try {
    console.log("del id", req.params.id);
    const data = await Loyalty_Point_Rule.destroy({
      where: { id: req.params.id },
    });
    // req.success = "";
    next("last");
  } catch (err) {
    next(err);
  }
};


//==================================== 7771874281 Point per dollar Routes ==============================

exports.upsertPointPerDollar = async (req, res) => {
  try {
    const schema = Joi.object({
      pointPerDollarNumber: Joi.number().integer().required(),
      organization_id: Joi.number().integer().required()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }

    const existingRecord = await PointPerDollar.findOne({
      where: {
        organization_id: value.organization_id
      }
    });

    let responseMessage;
    let record;

    if (existingRecord) {
      // Update existing record
      existingRecord.pointPerDollarNumber = value.pointPerDollarNumber;
      await existingRecord.save();
      responseMessage = 'Point per dollar updated successfully';
      record = existingRecord;
    } else {
      // Create new record
      const newRecord = await PointPerDollar.create({
        pointPerDollarNumber: value.pointPerDollarNumber,
        organization_id: value.organization_id
      });
      responseMessage = 'Point per dollar created successfully';
      record = newRecord;
    }

    return Response.successResponseData(
      res,
      record,
      res.locals.__(responseMessage),
    );

  } catch (error) {
    console.log('Error:', error);
    return Response.errorResponseWithoutData(
      res,
      res.__('Something went wrong'),
      500 
    );
  }
};


exports.showUpsertPointPerDollarPage = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;

    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;
    const existingRecord = await PointPerDollar.findOne({
      where: {
        organization_id: adminOrganizationID
      }
    });

    // Additional details from admin
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;

    return res.render('admin/loyalty/pointperdollar.ejs', {
      title: existingRecord ? 'Update Point Per Dollar' : 'Create Point Per Dollar',
      pointPerDollar: existingRecord || { pointPerDollarNumber: '', organization_id: adminOrganizationID },
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active: 5
    });
  } catch (error) {
    console.log('Error:', error);
    next(error);
  }
};




