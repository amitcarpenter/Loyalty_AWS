const {
  Subscription,
  Super_Admin_Cashier,
  Reward,
  Customer,
  Loyalty_Point_Rule,
  Customer_Visit,
} = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const Joi = require("joi");
const { Op } = require("sequelize");
const moment = require("moment");
const {currentDate} = require('../../utils/currentdate.gmt6');
const {
  ACTIVE,
  BLOCKED,
  INTERNAL_SERVER,
  NOT_FOUND,
} = require("../../utils/constants");
const Response = require("../../utils/response");

exports.getAllReward = async (req, res) => {
  try {
    const { organization_id } = req.body;

    let data = await Reward.findAll({
      where: {
        organization_id: organization_id,
      },
      order: [["loyalty_point", "ASC"]],
    });

    if (data.length > 0) {
      return Response.successResponseData(res, data, res.locals.__("Success"));
    } else {
      return Response.successResponseData(res, data, res.locals.__("Success"));
    }
  } catch (error) {
    console.log(": error ", error);
    return Response.errorResponseWithoutData(
      res,
      res.__("Something went wrong"),
      INTERNAL_SERVER
    );
  }
};

exports.getRedeemReward = async (req, res) => {
  try {
    const reqParam = req.body;
    const reqObj = {
      reward_id: Joi.number().integer().required(),
      customer_id: Joi.number().integer().required(),
      organization_id: Joi.number().integer().required(),
      customerVisitId: Joi.number().integer().required(),
    };
    // console.log("reqParam---",reqParam);
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }
    let rewardExists = await Reward.findOne({
      where: {
        id: reqParam.reward_id,
        organization_id: reqParam.organization_id,
      },
    });
    let customerDetails = await Customer.findOne({
      where: {
        id: reqParam.customer_id,
        organization_id: reqParam.organization_id,
      },
    });
   
    let customerVisitRecord = await Customer_Visit.findOne({
      where: {
        id: reqParam.customerVisitId,
        customer_id: reqParam.customer_id,
        // visit_date: {
        //   [Op.eq]: currentDate,
        // },
      },
    });
    if (!customerVisitRecord) {
      return Response.errorResponseWithoutData(
        res,
        "customerVisitRecord does not exist for that organization"
      );
    }

    if (!rewardExists) {
      return Response.errorResponseWithoutData(
        res,
        "Reward does not exist for that organization"
      );
    }
    if (!customerDetails) {
      return Response.errorResponseWithoutData(
        res,
        "Customer does not exist, for that organization"
      );
    }
    let rewardPoints =
      rewardExists && rewardExists.loyalty_point
        ? parseInt(rewardExists.loyalty_point)
        : 0;
    let customerLoyaltyPoints =
      customerDetails && customerDetails.total_loyalty_point
        ? parseInt(customerDetails.total_loyalty_point)
        : 0;
    let customerTotalRemainingLoyaltyPoint =
        customerDetails && customerDetails.total_remaining_loyalty_point
          ? parseInt(customerDetails.total_remaining_loyalty_point)
          : 0;
    console.log("rewardPoints", rewardPoints);
    let customerRedeemLoyaltyPoint = customerDetails.total_redeem_loyalty_point;
    console.log("customerRedeemLoyaltyPoint", customerRedeemLoyaltyPoint);

    if (customerLoyaltyPoints >= rewardPoints) {
      let availableLoyaltyPoints = customerTotalRemainingLoyaltyPoint - rewardPoints;
      console.log("availableLoyaltyPoints", customerLoyaltyPoints);
      let updateRedeemLoyaltyPoints = customerRedeemLoyaltyPoint + rewardPoints;
      // Update the customer's total_loyalty_point
      console.log("updateRedeemLoyaltyPoints", updateRedeemLoyaltyPoints);
      customerDetails.total_redeem_loyalty_point = updateRedeemLoyaltyPoints;
      // customerDetails.total_loyalty_point = availableLoyaltyPoints;
      customerDetails.total_remaining_loyalty_point = availableLoyaltyPoints;
      if (customerVisitRecord) {
        customerVisitRecord.redeem_loyalty_point = rewardPoints;
        await customerVisitRecord.save();
      }
      // Save the updated customer details
      await customerDetails.save();
      return Response.successResponseWithoutData(
        res,
        res.locals.__("Reward redeemed successfully")
      );
    } else {
      // Calculate the difference between rewardPoints and customerLoyaltyPoints
      let pointsNeeded = rewardPoints - customerLoyaltyPoints;
      return Response.successResponseWithoutData(
        res,
        `So close! You’re only ${pointsNeeded} points away from redeeming this reward.`
      );
    }
  } catch (error) {
    console.log(": error ", error);
    return Response.errorResponseWithoutData(
      res,
      res.__("Something went wrong"),
      INTERNAL_SERVER
    );
  }
};
