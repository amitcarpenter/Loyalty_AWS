const {
  Subscription,
  Super_Admin_Cashier,
  Organization_User,
  Organization_Subscription,
  Loyalty_Point_Rule,
  Customer_Visit,
  Customer,
  sequelize,
  Campaign,
  Campaign_Stats,
  sms_details,
  smsCampaign_send,
  LimitedTimeOffer,
  SingleUseOffer
} = require("../../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const Joi = require("joi");
const { Sequelize, QueryTypes } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const { currentDate } = require("../../utils/currentdate.gmt6");


const targetAudienceOptions = [
  { value: 'top_spenders', label: 'Top Spenders' },
  { value: 'most_frequent_buyers', label: 'Most Frequent Buyers' },
  { value: 'least_frequent_buyers', label: 'Least Frequent Buyers' }
];
//=========================================== 7771874281 ==================================
exports.getCampaignOverview = async (req, res, next) => {
  try {
    const { page = 0, limit = 10, search_text } = req.query;
    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;
    let superAdmin = admin.is_superadmin;

    let options = {
      where: { organization_id: adminOrganizationID },
      offset: page * limit,
      limit: limit,
      order: [["id", "DESC"]]
    };

    if (search_text) {
      options.where.name = { [Op.like]: "%" + search_text + "%" };
    }

    let data = await Campaign.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    // return res.json(response.items)

    return res.render("admin/smsCampaign/overview.ejs", {
      superAdmin,
      limit: 10,
      totalItems: response.totalItems,
      items: response.items,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      search_text: search_text,
      adminThemeColor: admin.Organizations[0].theme_color,
      adminBusinessName: admin.Organizations[0].business_name,
      active: 31
    });
  } catch (err) {
    next(err);
  }
};

exports.getCreateNewCampaign = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;
    // Additional details from admin
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;

    return res.render('admin/smsCampaign/create.ejs', {
      title: 'Create New Campaign',
      error,
      message,
      formValue,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      targetAudienceOptions: targetAudienceOptions,
      active: 32
    });
  } catch (error) {
    console.log('Error:', error);
    next(error);
  }
};

exports.postCreateNewCampaign = async (req, res, next) => {
  try {
    let { name, target_audience, message_content, start_date, end_date, status } = req.body;
    let admin = req.admin;
    let organization_id = admin.Organizations[0].id;

    let newCampaign = await Campaign.create({
      name,
      target_audience,
      message_content,
      start_date,
      end_date,
      status,
      organization_id
    });

    return res.redirect("/admin/campaign-overview");
  } catch (err) {
    return res.render("admin/smsCampaign/create.ejs", {
      title: 'Create New Campaign',
      adminThemeColor: req.admin.Organizations[0].theme_color,
      adminBusinessName: req.admin.Organizations[0].business_name,
      error: err.message,
      formValue: req.body
    });
  }
};

exports.getCampaignDetails = async (req, res, next) => {
  try {
    let { id } = req.params;
    const { page = 0, limit = 10, search_text } = req.query;
    let admin = req.admin;
    let superAdmin = admin.is_superadmin;
    let adminOrganizationID = admin.Organizations[0].id;

    // Fetch the campaign details along with the associated campaign stats
    let campaign = await Campaign.findOne({
      where: { id: id, organization_id: adminOrganizationID },
      include: [Campaign_Stats]
    });

    if (!campaign) {
      return res.status(404).render("partials/404.ejs");
    }

    let smsCampaignSends = [];
    try {
      smsCampaignSends = await smsCampaign_send.findAll({
        where: { campaign_id: id, organization_id: adminOrganizationID },
        include: [{
          model: Customer,
          attributes: ['name', 'contact_number'],
          where: { organization_id: adminOrganizationID }
        }]
      });
    } catch (error) {
      console.error('Error fetching smsCampaign_send:', error);

    }
    // return res.json(smsCampaignSends)

    return res.render("admin/smsCampaign/details.ejs", {
      superAdmin,
      active: 100,
      campaign,
      smsCampaignSends,
      adminThemeColor: admin.Organizations[0].theme_color,
      adminBusinessName: admin.Organizations[0].business_name
    });
  } catch (err) {
    next(err);
  }
};

exports.getEditCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;

    // Fetch the campaign details
    let campaign = await Campaign.findOne({
      where: { id, organization_id: adminOrganizationID },
      include: [Campaign_Stats]
    });

    if (!campaign) {
      return res.status(404).render('admin/404.ejs');
    }

    // Additional details from admin
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let superAdmin = admin.is_superadmin;

    return res.render('admin/smsCampaign/edit-campaign.ejs', {
      title: 'Edit Campaign',
      formValue: campaign,
      adminThemeColor,
      adminBusinessName,
      superAdmin,
      targetAudienceOptions: targetAudienceOptions,
      active: 32
    });
  } catch (error) {
    console.log('Error:', error);
    next(error);
  }
};

exports.deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;

    // Find and delete the campaign
    let campaign = await Campaign.findOne({
      where: { id, organization_id: adminOrganizationID }
    });

    if (!campaign) {
      return res.status(404).render('admin/404.ejs');
    }

    await campaign.destroy();

    return res.redirect('/admin/campaign-overview');
  } catch (error) {
    console.log('Error:', error);
    next(error);
  }
};




// Update campaign details
exports.updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, target_audience, message_content, start_date, end_date, status } = req.body; // Assuming these are the fields to update

    let admin = req.admin;
    let adminOrganizationID = admin.Organizations[0].id;

    // Find the campaign to update
    let campaign = await Campaign.findOne({
      where: { id, organization_id: adminOrganizationID }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update campaign fields
    campaign.name = name;
    campaign.target_audience = target_audience;
    campaign.message_content = message_content;
    campaign.start_date = start_date;
    campaign.end_date = end_date;
    campaign.status = status;

    await campaign.save();

    return res.json({ message: 'Campaign updated successfully', campaign });
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// ===================================== New Analytics data drap ======================================
exports.getCampaignAnalytics = async (req, res, next) => {
  try {
    let admin = req.admin;
    const { page = 0, limit = 10, search_text, message, error, formValue } = req.query;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let adminOrganizationID = admin.Organizations[0].id;

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
      where: { organization_id: adminOrganizationID },
    };

    if (search_text) {
      options.where = {
        ...options.where,
        name: { [Op.like]: "%" + search_text + "%" },
      };
    }

    let data = await Customer.findAndCountAll(options);
    let response = utils.getPagingData(res, data, page + 1, limit);
    const totalMembers = await Customer.count({
      where: { organization_id: adminOrganizationID },
    });

    // Monthly data for charts
    const smsDeliveredData = await getMonthlyData(smsCampaign_send, adminOrganizationID, 'send_date', 'message_status', 'delivered');
    const customersVisitedData = await getMonthlyData(Customer_Visit, adminOrganizationID, 'visit_date');
    const redeemedLoyaltyPointData = await getRedeemedLoyaltyPointData(10);

    // return res.json(redeemedLoyaltyPointData)

    // Generate monthsData for the dropdown
    const monthsData = generateMonthsData();

    let superAdmin = admin.is_superadmin;

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
      active: 30,
      smsDeliveredData,
      customersVisitedData,
      monthsData,
      redeemedLoyaltyPointData,
    });
  } catch (err) {
    next(err);
  }
};


// Function to generate monthsData (example implementation)
function generateMonthsData() {
  const monthsData = [];
  const currentDate = new Date();

  // Generate data for the last 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    monthsData.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1, // January is 0 in JavaScript
      monthName: date.toLocaleString('default', { month: 'short' }),
    });
  }

  return monthsData.reverse(); // Reverse to display in descending order
}


async function getRedeemedLoyaltyPointData(organizationID) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const data = await Customer_Visit.findAll({
    where: {
      organization_id: organizationID,
      visit_date: {
        [Op.gte]: startDate,
      },
    },
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col('visit_date')), 'month'],
      [Sequelize.fn('YEAR', Sequelize.col('visit_date')), 'year'],
      [Sequelize.fn('SUM', Sequelize.col('redeem_loyalty_point')), 'total_redeemed'],
    ],
    group: ['year', 'month'],
    order: [['year', 'ASC'], ['month', 'ASC']],
  });

  const result = new Array(12).fill(0);
  data.forEach(item => {
    console.log(item)
    const index = (item.dataValues.year - startDate.getFullYear()) * 12 + item.dataValues.month - startDate.getMonth() - 1;
    if (index >= 0 && index < 12) {
      result[index] = parseInt(item.dataValues.total_redeemed) || 0;
    }
  });

  return result;
}


async function getMonthlyData(model, organizationID, dateField, statusField = null, statusValue = null, year = null, month = null) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  let whereClause = {
    organization_id: organizationID,
    [dateField]: {
      [Op.gte]: startDate,
    },
  };

  if (statusField && statusValue) {
    whereClause[statusField] = statusValue;
  }

  if (year && month) {
    whereClause[dateField] = {
      [Op.and]: [
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col(dateField)), year),
        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col(dateField)), month),
      ]
    };
  }

  const data = await model.findAll({
    where: whereClause,
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col(dateField)), 'month'],
      [Sequelize.fn('YEAR', Sequelize.col(dateField)), 'year'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['year', 'month'],
    order: [['year', 'ASC'], ['month', 'ASC']],
  });

  const result = new Array(12).fill(0);
  data.forEach(item => {
    const index = (item.dataValues.year - startDate.getFullYear()) * 12 + item.dataValues.month - startDate.getMonth() - 1;
    if (index >= 0 && index < 12) {
      result[index] = item.dataValues.count;
    }
  });

  return result;
}



//========================== Sms Send create ================================
exports.createSmsSend = async (req, res, next) => {
  try {
    const { customer_id, organization_id, campaign_id, sms_id, sended_message, message_status, send_date } = req.body;
    let newSmsSend = await smsCampaign_send.create({
      customer_id,
      organization_id,
      campaign_id,
      sms_id,
      sended_message,
      message_status,
      send_date
    });
    return res.status(201).json(
      {
        success: true,
        status: 201,
        message: "message send success fully"
      }
    )
  } catch (err) {
    return res.status(500).json(
      {
        success: false,
        status: 500,
        error: err
      }
    )
  }
};
