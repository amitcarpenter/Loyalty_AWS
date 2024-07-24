const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization_Subscription,
  Loyalty_Point_Rule,
  Customer_Visit,
  Customer,
  sequelize,
  TierSystem
} = require("../../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const Joi = require("joi");
const { Sequelize, QueryTypes } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const { currentDate } = require("../../utils/currentdate.gmt6");
const Response = require("../../utils/response");



exports.getCustomer = async (req, res, next) => {
  try {
    let admin = req.admin;
    const { page, limit, search_text, message, error, formValue } = req.query;
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
          // where: {organization_id:adminOraganizationID},
        },
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
    let data = await Customer.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    // return res.send(response);
    const totalMembers = await Customer.count({
      where: { organization_id: adminOraganizationID },
    });
    let superAdmin = admin.is_superadmin;
    return res.render("admin/customer/customer.ejs", {
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
      active: 10,
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadOrganizationCutomerCsv = async (req, res, next) => {
  try {
    let admin = req.admin;
    const { page, limit, search_text, message, error, formValue } = req.query;
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
        },
      ],
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]],
      where: { organization_id: adminOraganizationID },
    };
    let data = await Customer.findAndCountAll(options);
    if (!data) {
      console.log("users not found");
      return;
    }
    let userinfo = data.rows;

    // Assuming columns is an array containing your custom column names
    const columns = [
      "name",
      "age",
      "contact_number",
      "visit_date",
      "total_loyalty_point",
    ]; // Replace with your actual column names

    const csvContent = convertToCSV(userinfo, columns);
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    res.setHeader("Content-Type", "text/csv");
    console.log("csvContent", csvContent);
    res.status(200).send(csvContent);

    function convertToCSV(data, columns) {
      const header = columns.join(",") + "\n";
      const csvRows = data.map((row) =>
        columns.map((column) => {
          let cellValue;

          if (column === "visit_date") {
            row.Customer_Visits = row.Customer_Visits[0];
            cellValue = row.Customer_Visits[column];
          }
          // else if (Array.isArray(row[column])) {
          //   cellValue = row[column].join(',');
          // }
          else {
            cellValue = row[column];
          }

          return cellValue;
        })
      );

      return header + csvRows.join("\n");
      // map(row => row.join(',')).join('\n');
    }
  } catch (error) {
    console.log("error", error);
  }
};

exports.getCustomerDetail = async (req, res, next) => {
  try {
    const { page, limit, search_text, message, error, formValue } = req.query;
    // Assuming you have Sequelize initialized as sequelize
    const customerID = req.params.id;
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let adminOraganizationID = admin.Organizations[0].id;
    const totalLoyaltyPoints = await Customer.sum(
      "overall_total_loyalty_point",
      {
        where: {
          id: req.params.id,
          organization_id: adminOraganizationID, // Add organization ID condition
        },
      }
    );
    console.log(
      "totalLoyaltyPoints-----------------------",
      totalLoyaltyPoints
    );
    const totalRedeemLoyaltyPoints = await Customer.sum(
      "total_redeem_loyalty_point",
      {
        where: {
          id: req.params.id,
          organization_id: adminOraganizationID, // Add organization ID condition
        },
      }
    );

    const totalRemainingLoyaltyPoints = await Customer.sum(
      "total_remaining_loyalty_point",
      {
        where: {
          id: req.params.id,
          organization_id: adminOraganizationID, // Add organization ID condition
        },
      }
    );

    const totalTransactionAmount = await Customer_Visit.sum(
      "transaction_amount",
      {
        where: {
          customer_id: req.params.id,
          organization_id: adminOraganizationID,
        },
      }
    );

    // Calculate remaining loyalty points
    // const remainingLoyaltyPoints = totalLoyaltyPoints - totalRedeemLoyaltyPoints;

    // Use these variables as needed in your application
    console.log("Total Loyalty Points:", totalLoyaltyPoints);
    console.log("Total Redeem Loyalty Points:", totalRedeemLoyaltyPoints);
    console.log("Total Transaction Amount:", totalTransactionAmount);
    console.log("Remaining Loyalty Points:", totalRemainingLoyaltyPoints);

    const customerMaxVisitCountForCurrentMonth = await sequelize.query(
      `
      SELECT 
        customer_id, 
        COUNT(*) AS visit_count 
      FROM 
        customer_visit 
      WHERE 
        organization_id = :organizationId 
        AND MONTH(createdAt) = MONTH(CURRENT_DATE())
        AND YEAR(createdAt) = YEAR(CURRENT_DATE())
      GROUP BY 
        customer_id 
      ORDER BY 
        visit_count DESC 
      LIMIT 1;
      `,
      {
        replacements: { organizationId: adminOraganizationID },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    let maxVisitCount;
    if (customerMaxVisitCountForCurrentMonth.length > 0) {
      maxVisitCount = customerMaxVisitCountForCurrentMonth[0].visit_count;
      console.log("Max Visit Count=====:", maxVisitCount);
    } else {
      console.log("No data found for the current month.");
    }

    const customerVisitCountForCurrentMonth = await sequelize.query(
      `
      SELECT 
        COUNT(*) AS visit_count 
      FROM 
        customer_visit 
      WHERE 
        organization_id = :organizationId 
        AND customer_id = :customerId
        AND MONTH(createdAt) = MONTH(CURRENT_DATE())
        AND YEAR(createdAt) = YEAR(CURRENT_DATE());
      `,
      {
        replacements: {
          organizationId: adminOraganizationID,
          customerId: customerID,
        },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    console.log(
      "customerVisitCountForCurrentMonth",
      customerVisitCountForCurrentMonth
    );
    let visitCount;

    if (customerVisitCountForCurrentMonth.length > 0) {
      visitCount = customerVisitCountForCurrentMonth[0].visit_count;
      console.log(
        `Visit Count for Customer ${customerID} in Organization ${adminOraganizationID} for the current month:`,
        visitCount
      );
    } else {
      console.log(
        `No visits found for Customer ${customerID} in Organization ${adminOraganizationID} for the current month.`
      );
    }

    // console.log('Outside if condition:', visitCount);

    let options = {
      distinct: true,
      offset: page * limit,
      limit: limit,
      order: [["visit_date", "DESC"]],
      where: {
        customer_id: req.params.id,
        organization_id: adminOraganizationID,
        [Op.and]: [
          {
            [Op.or]: [
              { transaction_amount: { [Op.not]: null } },
              { received_loyalty_point: { [Op.not]: null } },
              { redeem_loyalty_point: { [Op.not]: null } },
            ],
          },
        ],
      },
    };
    if (search_text) {
      console.log("search_text-------", search_text);
      req.query.where = { name: { [Op.like]: "%" + search_text + "%" } };
    }
    let data = await Customer_Visit.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    // return res.send(response);
    // Calculate number of days in current month
    const currentMonthDays = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();
    // Calculate engagement rate
    const engagementRate = Math.round((visitCount / maxVisitCount) * 100);
    // console.log('Engagement Rate:', engagementRate);

    // Round off engagement rate
    // const engagementRatePercentage = Math.round(engagementRate);
    console.log("engagementRate--", engagementRate);
    // userMonthVisitCount  / currentMonthDays (<%= roundedEngagementRate %>%)
    let superAdmin = admin.is_superadmin;
    return res.render("admin/customer-detail/customer-detail.ejs", {
      message,
      error,
      formValue,
      totalItems: response.totalItems,
      items: response.items,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      search_text: search_text,
      adminThemeColor,
      customerID,
      totalLoyaltyPoints,
      totalRedeemLoyaltyPoints,
      totalTransactionAmount,
      totalRemainingLoyaltyPoints,
      adminBusinessName,
      engagementRate,
      superAdmin,
      active: 10,
    });
  } catch (err) {
    next(err);
  }
};

exports.editCustomer = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    const customerId = req.params.id;

    // Fetch customer details
    const customer = await Customer.findOne({
      where: { id: customerId },
      attributes: [
        "id",
        "name",
        "date_of_birth",
        "contact_number",
        // "total_loyalty_point",
        // "overall_total_loyalty_point",
        // "total_redeem_loyalty_point",
        // "total_remaining_loyalty_point",
        // "status",
      ],
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Fetch admin details for rendering
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;

    // Render edit customer form
    res.render("admin/customer/edit-customer.ejs", {
      customer, // Corrected here
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active: 10,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const { name, contact_number, date_of_birth } = req.body;

    // Find the customer by ID
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update the customer details
    await customer.update({
      name,
      contact_number,
      date_of_birth,
    });

    req.success = "Successfully Updated.";
    return res.redirect(`/admin/customer/list`);
  } catch (err) {
    req.error = "Error updating customer.";
    next(err);
  }
};

//===================================  7771874281 Ananlytics ==============================================
const determineTier = async (totalSpent, organizationId) => {
  try {
    // Fetch tier thresholds from the database
    const tierSystem = await TierSystem.findOne({
      where: { organization_id: organizationId }
    });
    if (!tierSystem.dataValues) {
      console.error('No tier system found for this organization');
      return 'Bronze';
    }
    if (totalSpent > tierSystem.dataValues.Gold) {
      return 'Gold';
    } else if (totalSpent > tierSystem.dataValues.Silver) {
      return 'Silver';
    } else {
      return 'Bronze';
    }
  } catch (error) {
    console.error('Error determining tier:', error);
    return 'Bronze';
  }
};

const getMostFrequentBuyers = async (adminOrganizationID, dateRange, topN = 100) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    // Fetching customer visits and aggregating data
    const customerVisits = await Customer_Visit.findAll({
      where: {
        organization_id: adminOrganizationID,
        visit_date: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "customer_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "visit_count"],
        [sequelize.fn("SUM", sequelize.col("transaction_amount")), "total_spent"],
        [
          sequelize.fn("COUNT", sequelize.literal('CASE WHEN transaction_amount IS NOT NULL THEN 1 END')),
          "transaction_count"
        ],
      ],
      group: ["customer_id"],
      order: [[sequelize.fn("COUNT", sequelize.literal('CASE WHEN transaction_amount IS NOT NULL THEN 1 END')), "DESC"]],
      raw: true,
    });

    // Fetching customer details
    const customerFields = ["id", "name", "contact_number"];
    const customers = await Customer.findAll({
      where: { organization_id: adminOrganizationID },
      attributes: customerFields,
      raw: true,
    });

    const customerMap = new Map();
    customers.forEach((customer) => customerMap.set(customer.id, customer));

    // Mapping customer visits to customer details and adding tiers
    const frequentBuyersPromises = customerVisits.map(async (visit) => {
      const customer = customerMap.get(visit.customer_id);
      if (!customer) {
        console.warn(`Customer with ID ${visit.customer_id} not found`);
        return null;
      }

      const totalSpent = visit.total_spent ? parseFloat(visit.total_spent) : 0;
      const transactionCount = visit.transaction_count ? parseInt(visit.transaction_count, 10) : 0;

      const tier = await determineTier(totalSpent, adminOrganizationID);

      return {
        ...customer,
        total_spent: totalSpent,
        transaction_count: transactionCount,
        visit_count: visit.visit_count ? parseInt(visit.visit_count, 10) : 0,
        tier,
      };
    });

    const frequentBuyers = await Promise.all(frequentBuyersPromises);

    // Filter out any null values (from customers not found) and limit to topN
    return frequentBuyers.filter(buyer => buyer !== null).slice(0, topN);

  } catch (error) {
    console.error('Error in getMostFrequentBuyers:', error);
    throw error;  // Re-throw the error for the caller to handle
  }
}

const getLeastFrequentBuyers = async (adminOrganizationID, dateRange) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const customerVisits = await Customer_Visit.findAll({
      where: {
        organization_id: adminOrganizationID,
        visit_date: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "customer_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "visit_count"],
        [sequelize.fn("SUM", sequelize.col("transaction_amount")), "total_spent"],
        [
          sequelize.fn("COUNT", sequelize.literal('CASE WHEN transaction_amount IS NOT NULL THEN 1 END')),
          "transaction_count"
        ],
      ],
      group: ["customer_id"],
      order: [[sequelize.fn("COUNT", sequelize.literal('CASE WHEN transaction_amount IS NOT NULL THEN 1 END')), "ASC"]],
      raw: true,
    });

    const customerFields = ["id", "name", "contact_number"];
    const customers = await Customer.findAll({
      where: { organization_id: adminOrganizationID },
      attributes: customerFields,
      raw: true,
    });

    const customerMap = new Map();
    customers.forEach((customer) => customerMap.set(customer.id, customer));

    const leastFrequentBuyersPromises = customerVisits.map(async (visit) => {
      const customer = customerMap.get(visit.customer_id);
      if (!customer) {
        console.warn(`Customer with ID ${visit.customer_id} not found`);
        return null;
      }

      const totalSpent = visit.total_spent ? parseFloat(visit.total_spent) : 0;
      const transactionCount = visit.transaction_count ? parseInt(visit.transaction_count, 10) : 0;

      const tier = await determineTier(totalSpent, adminOrganizationID);

      return {
        ...customer,
        total_spent: totalSpent,
        transaction_count: transactionCount,
        visit_count: visit.visit_count ? parseInt(visit.visit_count, 10) : 0,
        tier,
      };
    });

    const leastFrequentBuyers = await Promise.all(leastFrequentBuyersPromises);

    // Filter out null values and sort by visit_count
    const sortedLeastFrequentBuyers = leastFrequentBuyers
      .filter(buyer => buyer !== null)
      .sort((a, b) => a.visit_count - b.visit_count);

    return sortedLeastFrequentBuyers;

  } catch (error) {
    console.error('Error in getLeastFrequentBuyers:', error);
    throw error;  // Re-throw the error for the caller to handle
  }
};

exports.getCustomersBySpending = async (req, res) => {
  try {
    const admin = req.admin;
    const {
      page = 1,
      limit = 10,
      search_text,
      message,
      error,
      formValue,
      date_range = 30,
    } = req.query;

    const adminThemeColor = admin.Organizations[0].theme_color;
    const adminBusinessName = admin.Organizations[0].business_name;
    const adminOrganizationID = admin.Organizations[0].id;
    const superAdmin = admin.is_superadmin;

    // Get customer spending data
    const customerSpendings = await Customer_Visit.findAll({
      where: { organization_id: adminOrganizationID },
      attributes: [
        "customer_id",
        [sequelize.fn("SUM", sequelize.col("transaction_amount")), "total_spent"],
        [
          sequelize.fn("COUNT", sequelize.literal('CASE WHEN transaction_amount IS NOT NULL THEN 1 END')),
          "transaction_count"
        ],
        [sequelize.fn("MAX", sequelize.col("transaction_amount")), "biggest_transaction_amount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "visit_count"],
      ],
      group: ["customer_id"],
      raw: true,
    });

    // Get most and least frequent buyers
    const mostFrequentBuyers = await getMostFrequentBuyers(adminOrganizationID, date_range);
    const leastFrequentBuyers = await getLeastFrequentBuyers(adminOrganizationID, date_range);

    // Get customer details
    const customerFields = ["id", "name", "contact_number"];
    const customers = await Customer.findAll({
      where: { organization_id: adminOrganizationID },
      attributes: customerFields,
      raw: true,
    });

    const customerMap = new Map();
    customers.forEach((customer) => customerMap.set(customer.id, customer));

    // Combine spending data with customer details
    const customersWithSpendingPromises = customerSpendings.map(async (spending) => {
      const customer = customerMap.get(spending.customer_id);

      if (!customer) {
        console.warn(`Customer with ID ${spending.customer_id} not found`);
        return null;
      }

      const totalSpent = spending.total_spent ? parseFloat(spending.total_spent) : 0;
      const transactionCount = spending.transaction_count ? parseInt(spending.transaction_count, 10) : 0;

      const tier = await determineTier(totalSpent, adminOrganizationID);

      return {
        ...customer,
        total_spent: totalSpent,
        transaction_count: transactionCount,
        biggest_transaction_amount: spending.biggest_transaction_amount ? parseFloat(spending.biggest_transaction_amount) : 0,
        visit_count: spending.visit_count ? parseInt(spending.visit_count, 10) : 0,
        tier,
      };
    });

    const customersWithSpending = await Promise.all(customersWithSpendingPromises);

    // Filter out null values and sort customers by total_spent in descending order
    const topSpenders = customersWithSpending
      .filter(customer => customer !== null)
      .sort((a, b) => b.total_spent - a.total_spent);

    // Render the data to an EJS template
    return res.render("admin/analytics/analytics.ejs", {
      message,
      error,
      formValue,
      totalPages: 10,
      currentPage: 1,
      search_text,
      topSpenders,
      mostFrequentBuyers,
      leastFrequentBuyers,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      date_range,
      active: 20,
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// +=================================================7771874281 Tier Handle =============================================================
exports.updateTierSystem = async (req, res) => {
  try {
    const schema = Joi.object({
      Gold: Joi.number().integer().required(),
      Silver: Joi.number().integer().required(),
      Bronze: Joi.number().integer().required(),
      organization_id: Joi.number().integer().required()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(`${error.details[0].message}`)
      );
    }

    const [record, created] = await TierSystem.findOrCreate({
      where: { organization_id: value.organization_id },
      defaults: value
    });

    if (!created) {
      await record.update(value);
    }

    const responseMessage = created ? 'Tier system created successfully' : 'Tier system updated successfully';

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

exports.showTierCustomizePage = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;

    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;
    const existingRecord = await TierSystem.findOne({
      where: {
        organization_id: adminOrganizationID
      }
    });

    // Additional details from admin
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;

    return res.render('admin/analytics/tier.ejs', {
      title: existingRecord ? 'Update Tier System' : 'Create Tier System',
      tierSystem: existingRecord || { Gold: '', Silver: '', Bronze: '', organization_id: adminOrganizationID },
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      active: 21
    });
  } catch (error) {
    console.log('Error:', error);
    next(error);
  }
};



