const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization_Subscription,
  Loyalty_Point_Rule,
  Customer_Visit,
  Customer,
  PointPerDollar
} = require("../../models");
const bcrypt = require("bcrypt");
const { ACTIVE, BLOCKED, INTERNAL_SERVER, NOT_FOUND } = require("../../utils/constants");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const Joi = require("joi");
const Response = require("../../utils/response");
const { currentDate } = require('../../utils/currentdate.gmt6');


// 7771874281 old code
// exports.getRedeemLoyaltyPoints = async (req, res) => {
//   try {
//     const reqParam = req.body;
// console.log("==============================================================================================================================================================================================================================================================================================================================")
// console.log(req.body, "redeem point")
// console.log("==============================================================================================================================================================================================================================================================================================================================")
//     const reqObj = {
//       transaction_amount: Joi.number().required(),
//       customer_id: Joi.number().integer().required(),
//       organization_id: Joi.number().integer().required(),
//       customerVisitId: Joi.number().integer().required(),
//     };
//     const schema = Joi.object(reqObj);
//     const { error } = schema.validate(reqParam);

//     if (error) {
//       return Response.validationErrorResponseData(
//         res,
//         res.__(`${error.details[0].message}`)
//       );
//     }

//     let data = await Loyalty_Point_Rule.findOne({
//       where: {
//         start_transaction_amount: { [Op.lte]: reqParam.transaction_amount },
//         end_transaction_amount: { [Op.gte]: reqParam.transaction_amount },
//         organization_id: reqParam.organization_id,
//         status: ACTIVE
//       },
//       attributes: [
//         "id",
//         "organization_id",
//         "start_transaction_amount",
//         "end_transaction_amount",
//         "loyalty_point",
//         "status"
//       ],
//     });
//     if (!data) {
//       let info = {
//         loyalty_point: 0,
//         ms: 'No loyalty points available for this transaction amount'
//       }
//       // return Response.successResponseData(res, "No loyalty points available for this transaction amount");
//       return Response.successResponseData(
//         res,
//         info,
//         res.locals.__('Success')
//       );
//     }
//     console.log("loyalty point mile", data);
//     // let customerDetails = await Customer.findOne({ where: { id: reqParam.customer_id } });
//     let customerDetails = await Customer.findOne({ where: { id: reqParam.customer_id, organization_id: reqParam.organization_id, } });

//     console.log("customerDetails mili", customerDetails);

//     if (!customerDetails) {
//       return Response.errorResponseWithoutData(res, "Customer does not exist for that organization");
//     }

//     // let customerLoyaltyPoints = customerDetails.total_loyalty_point;
//     let customerLoyaltyPoints = customerDetails && customerDetails.total_loyalty_point ? parseInt(customerDetails.total_loyalty_point) : 0;
//     let customerTotalRemainingLoyaltyPoint = customerDetails && customerDetails.total_remaining_loyalty_point ? parseInt(customerDetails.total_remaining_loyalty_point) : 0;
//     console.log("customerLoyaltyPoints mile", customerLoyaltyPoints);
//     let customerOverallLoyaltyPoints = customerDetails && customerDetails.overall_total_loyalty_point ? parseInt(customerDetails.overall_total_loyalty_point) : 0;
//     console.log("customerOverallLoyaltyPoints", customerOverallLoyaltyPoints);
//     if (data) {
//       let updateLoyaltyPoints = data && data.loyalty_point ? parseInt(data.loyalty_point) : 0;
//       let totalLoyaltyPoints = customerLoyaltyPoints + updateLoyaltyPoints;
//       // Update the customer's total_loyalty_point
//       customerDetails.total_remaining_loyalty_point = customerTotalRemainingLoyaltyPoint + updateLoyaltyPoints;
//       customerDetails.total_loyalty_point = totalLoyaltyPoints;
//       customerDetails.overall_total_loyalty_point = totalLoyaltyPoints;
//       // Save the updated customer details
//       await customerDetails.save();

//       // let customerVisitRecord = await Customer_Visit.findOne({ where: { customer_id: reqParam.customer_id } });

//       // const currentDate = new Date().toISOString().split('T')[0];
//       let customerVisitRecord = await Customer_Visit.findOne({
//         where: {
//           id: reqParam.customerVisitId,
//           customer_id: reqParam.customer_id,
//           organization_id: reqParam.organization_id,
//           visit_date: {
//             [Op.eq]: currentDate,
//           },
//         },
//       });
//       console.log("customerVisitRecord mile", customerLoyaltyPoints);
//       if (!customerVisitRecord) {
//         // Create a new record if it doesn't exist
//         customerVisitRecord = await Customer_Visit.create({
//           customer_id: reqParam.customer_id,
//           visit_date: currentDate,
//           transaction_amount: reqParam.transaction_amount,
//           received_loyalty_point: updateLoyaltyPoints,
//           organization_id: reqParam.organization_id
//           // redeem_loyalty_point:0,
//         });
//       } else {
//         // Update the existing record
//         customerVisitRecord.transaction_amount = reqParam.transaction_amount;
//         customerVisitRecord.received_loyalty_point = updateLoyaltyPoints;
//         // customerVisitRecord.redeem_loyalty_point = updateLoyaltyPoints;
//         await customerVisitRecord.save();
//       }
//       return Response.successResponseData(
//         res,
//         data,
//         res.locals.__('Success')
//       );
//     } else {
//       return Response.errorResponseWithoutData(
//         res,
//         "Failed"
//       );
//     }
//   } catch (error) {
//     console.log(": error ", error);
//     return Response.errorResponseWithoutData(
//       res,
//       res.__('Something went wrong'),
//       INTERNAL_SERVER
//     );
//   }
// };


// 7771874281 new code
exports.getRedeemLoyaltyPoints = async (req, res) => {
  try {
    const reqParam = req.body;

    console.log("==============================================================================================================================================================================================================================================================================================================================")
    console.log(req.body, "redeem point")
    console.log("==============================================================================================================================================================================================================================================================================================================================")
    const reqObj = {
      transaction_amount: Joi.number().required(),
      customer_id: Joi.number().integer().required(),
      organization_id: Joi.number().integer().required(),
      customerVisitId: Joi.number().integer().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);

    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }

    // Fetch points per dollar from the database
    const pointsPerDollarRecord = await PointPerDollar.findOne({
      where: {
        organization_id: reqParam.organization_id,
      }
    });

    if (!pointsPerDollarRecord) {
      return Response.errorResponseWithoutData(res, "Points per dollar configuration not found");
    }

    const pointsPerDollar = pointsPerDollarRecord.pointPerDollarNumber;


    console.log("==============================================================================================================================================================================================================================================================================================================================")
    console.log(pointsPerDollar, "pointsPerDollar")
    console.log("==============================================================================================================================================================================================================================================================================================================================")


    // Fixed points per dollar logic
    // const pointsPerDollar = 5;
    const loyaltyPointsEarned = reqParam.transaction_amount * pointsPerDollar;

    // Fetch customer details
    let customerDetails = await Customer.findOne({ where: { id: reqParam.customer_id, organization_id: reqParam.organization_id } });

    if (!customerDetails) {
      return Response.errorResponseWithoutData(res, "Customer does not exist for that organization");
    }

    let customerLoyaltyPoints = customerDetails.total_loyalty_point ? parseInt(customerDetails.total_loyalty_point) : 0;
    let customerTotalRemainingLoyaltyPoint = customerDetails.total_remaining_loyalty_point ? parseInt(customerDetails.total_remaining_loyalty_point) : 0;
    let customerOverallLoyaltyPoints = customerDetails.overall_total_loyalty_point ? parseInt(customerDetails.overall_total_loyalty_point) : 0;

    let totalLoyaltyPoints = customerLoyaltyPoints + loyaltyPointsEarned;

    // Update the customer's loyalty points
    customerDetails.total_remaining_loyalty_point = customerTotalRemainingLoyaltyPoint + loyaltyPointsEarned;
    customerDetails.total_loyalty_point = totalLoyaltyPoints;
    customerDetails.overall_total_loyalty_point = totalLoyaltyPoints;

    await customerDetails.save();

    // Handle customer visit record
    let customerVisitRecord = await Customer_Visit.findOne({
      where: {
        id: reqParam.customerVisitId,
        customer_id: reqParam.customer_id,
        organization_id: reqParam.organization_id,
        visit_date: {
          [Op.eq]: currentDate,
        },
      },
    });

    if (!customerVisitRecord) {
      customerVisitRecord = await Customer_Visit.create({
        customer_id: reqParam.customer_id,
        visit_date: currentDate,
        transaction_amount: reqParam.transaction_amount,
        received_loyalty_point: loyaltyPointsEarned,
        organization_id: reqParam.organization_id
      });
    } else {
      customerVisitRecord.transaction_amount = reqParam.transaction_amount;
      customerVisitRecord.received_loyalty_point = loyaltyPointsEarned;
      await customerVisitRecord.save();
    }

    return Response.successResponseData(
      res,
      { loyaltyPointsEarned },
      res.locals.__('Success')
    );

  } catch (error) {
    console.log(": error ", error);
    return Response.errorResponseWithoutData(
      res,
      res.__('Something went wrong'),
      INTERNAL_SERVER
    );
  }
};


// 7771874281 old code
// exports.getLoyaltyPoints = async (req, res) => {
//   try {
//     const reqParam = req.body;

//     console.log("==============================================================================================================================================================================================================================================================================================================================")
//     console.log(req.body, "get loyality point")
//     console.log("==============================================================================================================================================================================================================================================================================================================================")

//     const reqObj = {
//       transaction_amount: Joi.number().required(),
//       customer_id: Joi.number().integer().required(),
//       organization_id: Joi.number().integer().required(),
//     };
//     const schema = Joi.object(reqObj);
//     const { error } = schema.validate(reqParam);

//     if (error) {
//       return Response.validationErrorResponseData(
//         res,
//         res.__(`${error.details[0].message}`)
//       );
//     }
//     let data = await Loyalty_Point_Rule.findOne({
//       where: {
//         start_transaction_amount: { [Op.lte]: reqParam.transaction_amount },
//         end_transaction_amount: { [Op.gte]: reqParam.transaction_amount },
//         organization_id: reqParam.organization_id,
//         status: ACTIVE,
//       },
//       attributes: [
//         "id",
//         "organization_id",
//         "start_transaction_amount",
//         "end_transaction_amount",
//         "loyalty_point",
//         "status"
//       ],
//     });
//     let customerDetails = await Customer.findOne({ where: { id: reqParam.customer_id, organization_id: reqParam.organization_id, } });
//     // let customerDetails = await Customer.findOne({ where: { id: reqParam.customer_id} });
//     if (!data) {
//       let info = {
//         loyalty_point: 0,
//         ms: 'No loyalty points available for this transaction amount'
//       }
//       // return Response.successResponseData(res, "No loyalty points available for this transaction amount");
//       return Response.successResponseData(
//         res,
//         info,
//         res.locals.__('Success')
//       );
//     }
//     if (!customerDetails) {
//       return Response.errorResponseWithoutData(res, "Customer does not exist for that organization");
//     }

//     if (data) {
//       let LoyaltyPoints = data.loyalty_point;
//       let info = {
//         LoyaltyPoints: LoyaltyPoints
//       }
//       return Response.successResponseData(
//         res,
//         info,
//         res.locals.__('Success')
//       );
//     }
//   } catch (error) {
//     console.log('error', error)
//   }
// }

// 7771874281 new code
exports.getLoyaltyPoints = async (req, res) => {
  try {
    const reqParam = req.body;

    console.log("==============================================================================================================================================================================================================================================================================================================================")
    console.log(req.body, "get loyalty point")
    console.log("==============================================================================================================================================================================================================================================================================================================================")

    const reqObj = {
      transaction_amount: Joi.number().required(),
      customer_id: Joi.number().integer().required(),
      organization_id: Joi.number().integer().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);

    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }

    // Fetch points per dollar from the database
    const pointsPerDollarRecord = await PointPerDollar.findOne({
      where: {
        organization_id: reqParam.organization_id,
      }
    });

    if (!pointsPerDollarRecord) {
      return Response.errorResponseWithoutData(res, "Points per dollar configuration not found");
    }

    const pointsPerDollar = pointsPerDollarRecord.pointPerDollarNumber;


    console.log("==============================================================================================================================================================================================================================================================================================================================")
    console.log(pointsPerDollar, "pointsPerDollar")
    console.log("==============================================================================================================================================================================================================================================================================================================================")


    // Fixed points per dollar logic
    // const pointsPerDollar = 5;
    const loyaltyPointsEarned = reqParam.transaction_amount * pointsPerDollar;

    let customerDetails = await Customer.findOne({ where: { id: reqParam.customer_id, organization_id: reqParam.organization_id } });
    if (!customerDetails) {
      return Response.errorResponseWithoutData(res, "Customer does not exist for that organization");
    }

    let info = {
      LoyaltyPoints: loyaltyPointsEarned
    }

    return Response.successResponseData(
      res,
      info,
      res.locals.__('Success')
    );
  } catch (error) {
    console.log('error', error);
    return Response.errorResponseWithoutData(
      res,
      res.__('Something went wrong'),
      INTERNAL_SERVER
    );
  }
}


