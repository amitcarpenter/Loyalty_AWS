const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization_Subscription,
  Organization,
  Customer,
  Promotion,sms_details,
  Admin_Subscription
} = require("../../models");
const { Sequelize, DataTypes } = require('sequelize');
const {twilio_Auth} = require('../../utils/constantwords')
const client = require('twilio')(twilio_Auth.accountSid, twilio_Auth.authToken);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const { Op } = require("sequelize");
const {CreatePramotion} = require("../validation/validatorFunction")
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const moment = require("moment");
const {currentDate} = require('../../utils/currentdate.gmt6');

exports.getCreatePromotion = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    return res.render("admin/promotions/create-promotions.ejs", {
      message,
      error,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:8
    });
  } catch (err) {
    next(err);
  }
};

exports.createPromotion = async (req, res, next) => {
  try {
    let admin = req.admin;
    const adminID = admin.id;
    const adminOraganizationID = admin.Organizations[0].id;
    const Pramotioninfo = await CreatePramotion.validateAsync(req.body);
    let options2 = {
      distinct: true,
      order: [["id", "DESC"]],
      where: {
        organization_id:adminOraganizationID,
        admin_id: adminID, 
        status:"active"
      },
      include: [{
        model: Subscription
      }]
    };
    let adminSubscription = await Admin_Subscription.findOne(options2);
    // console.log('outside the cond ....',adminSubscription)
    if(adminSubscription)
    {
      const { name, email, password, date_of_birth, contact_number } = req.body;
      // const currentDate = moment(); // Current date and time
      if (req.body.start_date) {
        const startDate = moment(req.body.start_date);
      
        if (startDate.isBefore(currentDate, 'day')) {
          throw new Error("Promotion start date can't be less than the current date.");
        }
      }
      console.log('inside the cond ....',adminSubscription)
      console.log("req.body--------", req.body);
      let adminOraganizationID = admin.Organizations[0].id;
      req.body.organization_id = adminOraganizationID
      let data = await Promotion.create(req.body);
      req.success = "Successfully Created.";
      next("last");
    }else{
      throw new Error("Please, Purchase a Subscription For Create Promotions");
    }
  } catch (err) {
    next(err);
  }
};

exports.sendSmsApi = async (req, res, next) => {
  try {
    client.messages
      .create({
        body: 'HELLO Hackerkernal from JUNED',
        from: twilio_Auth.from,
        to: twilio_Auth.to
      })
      .then((message) => {
        console.log(`Message SID: ${message.sid}, Status: ${message.status}`);
        
        // Check if the message was delivered successfully
        if (message.status === 'delivered') {
          console.log('Message delivered successfully!');
          // Your additional logic for a delivered message can go here
        } else {
            setTimeout(() => {
                client.messages(message.sid).fetch()
                  .then(updatedMessage => {
                    console.log(`Updated Message Status: ${updatedMessage.status}`);
                    // Handle the updated status as needed
                  })
                  .catch(error => {
                    console.error(`Error fetching updated message status: ${error.message}`);
                  });
              }, 5000);
          console.log(`Message status: ${message.status}`);
          // Handle other statuses if needed
        }
      })
      .catch((error) => {
        console.error(`Error sending SMS: ${error.message}`);
        // Handle the error
      });
} catch (error) {
    console.log('error',error)
}
};

exports.getPromotion = async (req, res, next) => {
  try {
    const { page, limit, search_text, message, error, formValue } = req.query;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let adminOraganizationID = admin.Organizations[0].id;
    let options = {
      // attributes: ["id", "name", "email", "password", "date_of_birth","image","contact_number"],
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
    let data = await Promotion.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    // return res.send(response);
    let superAdmin = admin.is_superadmin;
    return res.render("admin/promotions/promotions.ejs", {
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
      active:9
    });
  } catch (err) {
    next(err);
  }
};

exports.pramotionSmsList = async (req, res, next) => {
  try {
    console.log('req.query.filter',req.query.filter);
    let relatedCustomers,mergedinfo,ageStart,ageEnd
    let ageValue = req.query && req.query.filter && req.query.filter=='ALL' ? undefined : req.query.filter
    if(ageValue)
    {
      let data = ageValue.split("-");
      ageStart=data && data[0] ? data[0] :undefined;
      ageEnd=data && data[1] ? data[1] :undefined;
      console.log('ageStart',ageStart)
      console.log('ageEnd',ageEnd)
    }
    const { page, limit, search_text, message, error, formValue } = req.query;
    let pramotionInfo = await Promotion.findOne({
      where: { id: req.params.id },
      attributes: ["id", "message", "age", "start_date","organization_id", "status"],
    });
    pramotionInfo=pramotionInfo.dataValues;
    const SMS_DETAILS = await sms_details.findAll({
      where: {
        organization_id: pramotionInfo.organization_id,
        promotion_id:req.params.id
      },
    });

    const customerIds = SMS_DETAILS.map(smsDetail => smsDetail.customer_id);
    if(customerIds)
    {
      const whereClause = {
        id: customerIds,
      };
      if (ageStart !== undefined && ageEnd !== undefined) {
        whereClause.age = {
          [Op.between]: [ageStart, ageEnd],
        };
      }
      // const SMS_DETAILS = await sms_details.findAll({
      //   where: whereClause,
      // });
       relatedCustomers = await Customer.findAll({
        where: whereClause,
        attributes: ["id", "name", "age", "contact_number"],
      });
      if(relatedCustomers)
      {
        mergedinfo = SMS_DETAILS
        .filter(smsDetail => relatedCustomers.some(customer => customer.id === smsDetail.customer_id))
        .map(smsDetail => {
          const relatedCustomer = relatedCustomers.find(customer => customer.id === smsDetail.customer_id);
          // Merge properties from SMS_DETAILS and relatedCustomer
          return {
            ...smsDetail.dataValues, // Add any additional properties from smsDetail if needed
            customer: relatedCustomer ? relatedCustomer.dataValues : null,
          };
        });
      
    }
      console.log(mergedinfo);
      
    }
    
    let response = utils.getPagingData(res, SMS_DETAILS, page + 1, limit);
    // return res.send(SMS_DETAILS)
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    function formatDate(dateString) {
      const date = new Date(dateString);
     let endDate = moment(date).format("DD MMM YYYY");
      return endDate; // This will use the default locale and format
    }
    let superAdmin = admin.is_superadmin;
    res.render("admin/promotions/pramotion-sms-list.ejs", {
      formatDate,
      message,
      error,
      formValue,
      totalItems:mergedinfo.length,
      items:mergedinfo,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      search_text: search_text,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:9
    });
  } catch (error) {
    console.log('error',error)
  }
}

exports.editPromotion = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    const data = await Promotion.findOne({
      where: { id: req.params.id },
      attributes: ["id", "message", "age", "start_date", "status"],
    });
    // return res.send(data)
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;
    res.render("admin/promotions/edit-promotions.ejs", {
      data: data,
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active:9
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePromotion = async (req, res, next) => {
  try {
    const {message, start_date, status } = req.body;
    const data = await Promotion.update(
      {
        message: message,
        start_date: start_date,
        status: status
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

exports.deletePromotion = async (req, res, next) => {
  try {
    console.log("del id", req.params.id);
    const data = await Promotion.destroy({
      where: { id: req.params.id },
    });
    // req.success = "";
    next("last");
  } catch (err) {
    next(err);
  }
};
