const {
  Subscription,
  Super_Admin_Cashier,
  connection_code,
  Organization,
  Customer,
  Customer_Visit,
  Organization_User,
  Admin_Subscription
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const Joi = require("joi");
const { SendmsToclient } = require("../../socket/connection");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const Response = require("../../utils/response");
const moment = require("moment");
const {currentDate} = require('../../utils/currentdate.gmt6');
const {
  CustomerSignUp,
  CheckuserId,
} = require("../validation/validatorFunction");

exports.cashierLogin = async (req, res, next) => {
  try {
    const reqParam = req.body;
    // Validate request parameters
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      organization_id:Joi.number().integer().required(),
    });
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }
    // Find the cashier by email
    const cashierDetails = await Super_Admin_Cashier.findOne({
      where: { 
        email: reqParam.email,
        role_id: 2
      },
      attributes: [
        "id",
        "name",
        "email",
        "password",
        "contact_number",
        "date_of_birth",
        "token",
      ],
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
            "trial_start_date",
            "trial_end_date"
          ],
          where: { id:reqParam.organization_id, },
          required: true
        },
      ],
    });
    if (!cashierDetails) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("This Cashier Credentials doesn't Exist for that Organization")
      );
    }
    if (cashierDetails != null) {
      const isMatch = await bcrypt.compare(
        reqParam.password,
        cashierDetails.password
      );
      if (cashierDetails.email === reqParam.email && isMatch) {
        try {
          const rowToDelete = await connection_code.findOne({
            where: {
              cashier_id:cashierDetails.id,
              org_id:reqParam.organization_id
            },
          });
            // Delete the record where socket_id matches a specific value
            if(rowToDelete && rowToDelete.connection_route)
            {
              let info={
                conection:false,
                reset:true,
                status:0,
                // rowToDelete:rowToDelete,
                ms:'Connection needs to reset'
              }
              SendmsToclient(info,rowToDelete);
              // io.emit(rowToDelete.connection_route,info);
            }
        } catch (error) {
          console.log('error in delete connection',error);
        }
        const token = jwt.sign(
          {
            id: cashierDetails.id,
            email: cashierDetails.email,
          },
          process.env.SECRET,
          { expiresIn: "365d" }
        );
        await Super_Admin_Cashier.update(
          { token: token },
          { where: { id: cashierDetails.id } }
        );
        res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
        //console.log(token)
        return Response.successResponseData(
          res,
          cashierDetails,
          res.locals.__("Logged In Successfully")
        );
      } else {
        res.status(401).json({
          status: "failed",
          message: "EMAIL AND PASSWORD DOES NOT MATCH",
        });
      }
    }
  } catch (err) {
    return Response.errorResponseWithoutData(
      res,
      res.locals.__("An error occurred during login")
    );
  }
};

exports.customerinfo = async (req, res, next) => {
  try {
    console.log("req.body", req.body);
    const userinfo = await CheckuserId.validateAsync(req.body);
    let customerDetails = await Customer.findOne({
      where: {
        [Op.and]: [
          { id: userinfo.userId },
          { organization_id: userinfo.organization_id },   //jk47
        ],
      },
      include: [
        {
          model: Customer_Visit,
          required: false,
          attributes: [
            "id",
            "visit_date",
            "transaction_amount",
            "received_loyalty_point",
            "redeem_loyalty_point",
          ],
          order: [["visit_date", "ASC"]], // Order by visit_date in ascending order
        },
      ],
    });
    if (customerDetails) {
      let resData = customerDetails;
      resData.token = "";
      return Response.successResponseData(
        res,
        resData,
        res.locals.__("Logged in successfully")
      );
    } else {
      res.status(401).json({
        status: "failed",
        message: "User not Found for that Organization, UserID : " + req.body.userId,
      });
    }
    // console.log('customerDetails',customerDetails)
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      status: "failed",
      message: "Error" + error,
    });
  }
};
