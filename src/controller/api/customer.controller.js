const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Loyalty_Point_Rule,
  Customer_Visit,
  Organization,
  Customer,
} = require("../../models");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Sequelize, QueryTypes } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const { Op } = require("sequelize");
const Response = require("../../utils/response");
const moment = require("moment");
const {CustomerSignUp,CheckuserId} = require("../validation/validatorFunction")
// const {currentDate} = require('../../utils/currentdate.gmt6');
const momentTimezone = require('moment-timezone');
// Set time zone to GMT-6 (Central Standard Time)
const now = momentTimezone().tz('GMT-6');
// console.log("Current date and time in GMT-6 time zone",now.format()); // Current date and time in GMT-6 time zone
// const currentDateGMTMinus6 = moment().tz('GMT-6').format('YYYY-MM-DD');
const currentDate = momentTimezone().tz('America/Chicago').format('YYYY-MM-DD');

exports.customerLogin = async (req, res, next) => {
  try {
    let info={};
    const reqParam = req.body;
    // Get the current date
    // const currentDate = moment();
    // Format the date as per your requirement
    const formattedDate = currentDate;
    // Validate request parameters
    const reqObj = {
      contact_number: Joi.string().required(),
      organization_id: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }
    // Find the user by contact_number and organization_id
    let customerDetails = await Customer.findOne({
      where: {
        [Op.and]: [
          { contact_number: reqParam.contact_number },
          { organization_id: reqParam.organization_id },   
          //jk47
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
          order: [['visit_date', 'ASC']], 
        },
      ],
    });

    // console.log("customerDetails=====",customerDetails);
    
    let totalVisitCount = 0;
    let lastVisitCount = 0;

    if (customerDetails) {
      info.userType=`${customerDetails && !customerDetails.name || customerDetails.name==null ? 'NEW' : 'OLD'}`
      const customerVisits = customerDetails?.Customer_Visits || [];
      totalVisitCount = customerVisits.length;
      // console.log("totalVisitCount----------",totalVisitCount);
      lastVisitCount = customerVisits[customerVisits.length - 1]?.visit_date ? 1 : 0; // Check if last visit exists
      // console.log("lastVisitCount----------",lastVisitCount);
    }
    // console.log("Last Visit Count:", lastVisitCount);
    // If customer not found, create a new entry
    if (!customerDetails) {
      info.userType="NEW";
      // Create a new customer entry
      customerDetails = await Customer.create({
        contact_number: reqParam.contact_number,
        organization_id: reqParam.organization_id,
      });
      // Create a corresponding entry in Customer_Visit table
      try {
        const visit = await Customer_Visit.create({
          customer_id: customerDetails.id,
          visit_date: formattedDate,
          organization_id:customerDetails.organization_id
        });
      } catch (visitError) {
        console.error("Error creating Customer_Visit entry:", visitError);
        // Handle the error appropriately (log it, return an error response, etc.)
      }
    }
    if (customerDetails) {
      let customerVisit = await Customer_Visit.create({
        customer_id: customerDetails.id,
        visit_date: formattedDate,
        organization_id:customerDetails.organization_id
      });
    }
    // Generate and set JWT token
    const token = jwt.sign(
      {
        id: customerDetails.id,
        organization_id: customerDetails.organization_id,
      },
      process.env.SECRET,
      { expiresIn: "365d" }
    );

    // Update user with token
    await Customer.update(
      { token: token },
      { where: { id: customerDetails.id } }
    );
    info.customerDetails=customerDetails;
    info.totalVisitCount=totalVisitCount;
    info.lastVisitCount=lastVisitCount
    res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
    return Response.successResponseData(
      res,
      info,
      res.locals.__("Logged In Successfully")
    );
  } catch (err) {
    // Log the error for debugging
    console.error("Error during customer login:", err);
    // Send a generic error response
    return Response.errorResponseWithoutData(
      res,
      res.locals.__("Inavalid Credentials")
    );
  }
};

exports.customerSignUp = async (req, res, next) => {
  try {
    const userinfo = await CustomerSignUp.validateAsync(req.body);
    const reqParam = req.body;
    
      let info={}
      try {
              // Age start
      let birthdateString = userinfo.dob;
      if(birthdateString)
      {
        const [day, month, year] = birthdateString.split("/");

        // Month in JavaScript Date object is 0-indexed, so we subtract 1 from the month
        let birthdate = new Date(`${year}-${month - 1}-${day}`);
  
        if (birthdate.toString() === "Invalid Date") {
          console.error("Invalid date format");
        } else {
          // Your logic for calculating age based on the birthdate and current date
          let currentDate = new Date();
          let age = currentDate.getFullYear() - birthdate.getFullYear();
          if (
            currentDate.getMonth() < birthdate.getMonth() ||
            (currentDate.getMonth() === birthdate.getMonth() &&
              currentDate.getDate() < birthdate.getDate())
          ) {
            age--;
          }
          console.log("user age is", age);
          userinfo.age=age
        }
      }
        // Age end
        Customer.findOne({
          where: {
            [Op.and]: [
              { contact_number: reqParam.contact_number },
              { organization_id: reqParam.organization_id },
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
            },
          ],
        })
          .then((rowToUpdate) => {
            if (rowToUpdate) {
              // Update the status
              return rowToUpdate.update(
                {
                  name: userinfo.username,
                  date_of_birth: userinfo.dob,
                  age: `${userinfo && userinfo.age ? userinfo.age : ''}`,
                  status: 'ACTIVE',
                } // Replace 'new_status_value' with the desired new status
              );
            } else {
              console.log('Row not found.');
              return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("User Not Found ",userinfo.contact_number)
                  );
              // res.status(404).send('Customer not found');

            }
          })
          .then((updatedRow) => {
            if (updatedRow) {
              let data ={
                customerDetails:updatedRow
              }
              console.log('Updated row data:', updatedRow.toJSON());
              return Response.successResponseData(
                res,
                data,
                res.locals.__("SignUp in successfully")
              );
            }
          })
          .catch((error) => {
            console.error(error);
          });
       
      } catch (error) {
        return Response.errorResponseWithoutData(
          res,
          res.locals.__("Invalid Credentials")
        );
      }
  } catch (err) {
    // Send a generic error response
    return Response.errorResponseWithoutData(
      res,
      res.locals.__("Invalid Credentials")
    );
  }
};

exports.checkBusinessID = async (req, res, next) => {
  try {
    const reqParam = req.body;
    // Validate request parameters
    const reqObj = {
      business_id: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    let organizationDetails;
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    } else {
      organizationDetails = await Organization.findOne({
        where: {
          business_id: reqParam.business_id,
        },
        attributes: [
          "id",
          "business_name",
          "logo",
          "theme_color",
          "instagram_handle",
          "facebook_handle",
          "welcome_message",
          "business_id",
        ],
      });
    }

    if (!organizationDetails) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("Inavalid Business ID")
      );
    }
    return Response.successResponseData(
      res,
      organizationDetails,
      res.locals.__("Checked Business ID Successfully")
    );
  } catch (err) {
    return Response.errorResponseWithoutData(
      res,
      res.locals.__("Something went wrong")
    );
  }
};

exports.customerinfo= async (req,res,next)=>{
  try {
      console.log('req.body',req.body);
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
            order: [['visit_date', 'ASC']], // Order by visit_date in ascending order
          },
        ],
      });
      if(customerDetails){
        let resData = customerDetails;
        resData.token=''
        return Response.successResponseData(
          res,
          resData,
          res.locals.__("Logged In Successfully")
        );
      } else {
        res.status(401).json({
          status: "failed",
          message: "User not Found id:"+req.body.userId,
        });
      }
      // console.log('customerDetails',customerDetails)
  } catch (error) {
      console.log('error',error)
      res.status(500).json({
        status: "failed",
        message: "Error"+error,
      });
  }
}

