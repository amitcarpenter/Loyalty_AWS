const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization_Subscription,
  Loyalty_Point_Rule,
  Customer_Visit,
  Customer,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const Joi = require("joi");
const { Sequelize, QueryTypes } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const { currentDate } = require("../../utils/currentdate.gmt6");

// exports.getCampaignAnalytics = async (req, res, next) => {
//   try {
//     let admin = req.admin;
//     const { page, limit, search_text, message, error, formValue } = req.query;
//     let adminThemeColor = admin.Organizations[0].theme_color;
//     let adminBusinessName = admin.Organizations[0].business_name;
//     let adminOraganizationID = admin.Organizations[0].id;
//     let options = {
//       include: [
//         {
//           model: Customer_Visit,
//           required: false,
//           attributes: [
//             "id",
//             "visit_date",
//             "transaction_amount",
//             "received_loyalty_point",
//             "redeem_loyalty_point",
//           ],
//           order: [["visit_date", "DESC"]],
//           limit: 1,
//           // where: {organization_id:adminOraganizationID},
//         },
//       ],
//       distinct: true,
//       offset: page * limit,
//       limit: limit,
//       order: [["id", "DESC"]],
//       where: { organization_id: adminOraganizationID },
//     };
//     if (search_text) {
//       console.log("search_text-------", search_text);
//       req.query.where = { name: { [Op.like]: "%" + search_text + "%" } };
//     }
//     let data = await Customer.findAndCountAll(options);
//     let response = utils.getPagingData(res, data, page + 1, limit);
//     // return res.send(response);
//     const totalMembers = await Customer.count({
//       where: { organization_id: adminOraganizationID },
//     });
//     let superAdmin = admin.is_superadmin;
//     return res.render("admin/smsCampaign/dashboard.ejs", {
//       message,
//       error,
//       formValue,
//       totalItems: response.totalItems,
//       items: response.items,
//       totalPages: response.totalPages,
//       currentPage: response.currentPage,
//       search_text: search_text,
//       adminThemeColor,
//       adminBusinessName,
//       totalMembers,
//       superAdmin,
//       active: 10,
//     });
//   } catch (err) {
//     next(err);
//   }
// };



exports.getCampaignAnalytics = async (req, res, next) => {
  try {
    let admin = req.admin;
    const { page = 0, limit = 10, search_text, message, error, formValue } = req.query;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let adminOraganizationID = admin.Organizations[0].id;

    let options = {
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
          order: [["visit_date", "DESC"]],
          limit: 1,
        },
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: { organization_id: adminOraganizationID },
    };

    if (search_text) {
      options.where = { name: { [Op.like]: "%" + search_text + "%" } };
    }

    let data = await Customer.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    const totalMembers = await Customer.count({
      where: { organization_id: adminOraganizationID },
    });

    // Dummy data for charts, replace with your actual data fetching logic
    const smsDeliveredData = [10, 0, 90, 40, 50, 60, 70, 80, 90,];
    const customersVisitedData = [5, 15, 25, 5, 105, 15, 65, 75, 85];

    let superAdmin = admin.is_superadmin;

    let chartData = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: 20 },
      // Add more data points
    ];


    return res.render("admin/smsCampaign/dashboard.ejs", {
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
      totalMembers,
      superAdmin,
      active: 14,
      smsDeliveredData, 
      customersVisitedData, 
      chartData,
    });
  } catch (err) {
    next(err);
  }
};



// exports.getCampaignAnalytics = async (req, res, next) => {
//   try {
//     let admin = req.admin;
//     const { page = 1, limit = 10, search_text, message, error, formValue } = req.query;
//     let adminThemeColor = admin.Organizations[0].theme_color;
//     let adminBusinessName = admin.Organizations[0].business_name;
//     let adminOraganizationID = admin.Organizations[0].id;

//     let options = {
//       include: [
//         {
//           model: Customer_Visit,
//           required: false,
//           attributes: [
//             "id",
//             "visit_date",
//             "transaction_amount",
//             "received_loyalty_point",
//             "redeem_loyalty_point",
//           ],
//           order: [["visit_date", "DESC"]],
//           limit: 1,
//         },
//       ],
//       distinct: true,
//       offset: (page - 1) * limit,
//       limit: limit,
//       order: [["id", "DESC"]],
//       where: { organization_id: adminOraganizationID },
//     };
//     if (search_text) {
//       options.where.name = { [Op.like]: "%" + search_text + "%" };
//     }
//     let data = await Customer.findAndCountAll(options);
//     let response = utils.getPagingData(res, data, page, limit);

//     // Sample chart data
//     let chartData = [
//       { date: '2024-01-01', value: 10 },
//       { date: '2024-01-02', value: 20 },
//       // Add more data points
//     ];

//     // Sample SMS delivered data
//     let smsDeliveredData = [
//       { date: '2024-01-01', value: 100 },
//       { date: '2024-01-02', value: 150 },
//       // Add more data points
//     ];

//     // Sample customers visited data
//     let customersVisitedData = [
//       { date: '2024-01-01', value: 5 },
//       { date: '2024-01-02', value: 7 },
//       // Add more data points
//     ];

//     const totalMembers = await Customer.count({
//       where: { organization_id: adminOraganizationID },
//     });
//     let superAdmin = admin.is_superadmin;

//     return res.render("admin/smsCampaign/dashboard.ejs", {
//       message,
//       error,
//       formValue,
//       totalItems: response.totalItems,
//       items: response.items,
//       totalPages: response.totalPages,
//       currentPage: response.currentPage,
//       search_text: search_text,
//       adminThemeColor,
//       adminBusinessName,
//       totalMembers,
//       superAdmin,
//       active: 10,
//       chartData,
//       smsDeliveredData,
//       customersVisitedData,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
