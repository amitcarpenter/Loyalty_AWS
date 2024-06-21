const {
  sequelize,
  Sequelize,
  Super_Admin_Cashier,
  Customer,
  Customer_Visit,
  Promotion,
} = require("../../models");
const moment = require("moment");
const { Op, fn, col, QueryTypes } = require("sequelize");
// const {path} = require('path')
const { ACTIVE, INACTIVE } = require("../../utils/constants");
const utils = require("../../utils/helper");
const {currentDate} = require('../../utils/currentdate.gmt6');
exports.superAdminDashboard = async (req, res, next) => {
  try {
    const error = req.flash("error");
    const message = req.flash("success");
    const formValue = req.flash("formValue")[0];
    return res.render("super_admin/user/dashboard/dashboard.ejs", {
      message,
      error,
      formValue,
    });
  } catch (err) {
    next(err);
  }
};

exports.adminDashboard = async (req, res, next) => {
  try {
    const error = req.flash("error");
    const message = req.flash("success");
    const formValue = req.flash("formValue")[0];
    let admin = req.admin;
    let adminThemeColor = admin.Organizations[0].theme_color;
    let adminBusinessName = admin.Organizations[0].business_name;
    let adminOraganizationID = admin.Organizations[0].id;
    let superAdmin = admin.is_superadmin;
    let newUserweek = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(COUNT(DISTINCT id), 0) AS signed) AS week_total,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Sunday" THEN id END), 0) AS signed) AS Sunday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Monday" THEN id END), 0) AS signed) AS Monday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Tuesday" THEN id END), 0) AS signed) AS Tuesday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Wednesday" THEN id END), 0) AS signed) AS Wednesday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Thursday" THEN id END), 0) AS signed) AS Thursday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Friday" THEN id END), 0) AS signed) AS Friday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Saturday" THEN id END), 0) AS signed) AS Saturday
      FROM
        customer
      WHERE
        DATE(createdAt) >= DATE(?) AND
        DATE(createdAt) <= DATE(?) AND
        organization_id = ?
      `,
      {
        replacements: [
          moment().startOf("week").format("YYYY-MM-DD"),
          moment().endOf("week").format("YYYY-MM-DD"),
          adminOraganizationID, // Organization ID
        ],
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );
    let lastWeekNewUserSignups = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(COUNT(DISTINCT id), 0) AS signed) AS last_week_total,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Sunday" THEN id END), 0) AS signed) AS Sunday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Monday" THEN id END), 0) AS signed) AS Monday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Tuesday" THEN id END), 0) AS signed) AS Tuesday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Wednesday" THEN id END), 0) AS signed) AS Wednesday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Thursday" THEN id END), 0) AS signed) AS Thursday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Friday" THEN id END), 0) AS signed) AS Friday,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DAYNAME(createdAt) = "Saturday" THEN id END), 0) AS signed) AS Saturday
      FROM
        customer
      WHERE
        DATE(createdAt) >= DATE(?) AND
        DATE(createdAt) <= DATE(?) AND
        organization_id = ?
      `,
      {
        replacements: [
          moment().subtract(1, "week").startOf("week").format("YYYY-MM-DD"),
          moment().subtract(1, "week").endOf("week").format("YYYY-MM-DD"),
          adminOraganizationID, // Organization ID
        ],
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );
    let newUsermonth = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(COUNT(DISTINCT id), 0) AS signed) AS month_total,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 1 THEN id END), 0) AS signed) AS January,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 2 THEN id END), 0) AS signed) AS February,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 3 THEN id END), 0) AS signed) AS March,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 4 THEN id END), 0) AS signed) AS April,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 5 THEN id END), 0) AS signed) AS May,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 6 THEN id END), 0) AS signed) AS June,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 7 THEN id END), 0) AS signed) AS July,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 8 THEN id END), 0) AS signed) AS August,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 9 THEN id END), 0) AS signed) AS September,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 10 THEN id END), 0) AS signed) AS October,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 11 THEN id END), 0) AS signed) AS November,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = 12 THEN id END), 0) AS signed) AS December
      FROM
        customer
      WHERE
      year(createdAt) = year(now())
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );
    let currentAndYesterdayUserSignups = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(COUNT(DISTINCT id), 0) AS signed) AS two_day_total,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DATE(createdAt) = DATE(?) THEN id END), 0) AS signed) AS today,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN DATE(createdAt) = DATE_SUB(DATE(?), INTERVAL 1 DAY) THEN id END), 0) AS signed) AS yesterday
      FROM
        customer
      WHERE
        DATE(createdAt) >= DATE_SUB(DATE(?), INTERVAL 1 DAY) AND
        DATE(createdAt) <= DATE(?) AND
        organization_id = ?
      `,
      {
        replacements: [
          moment().format("YYYY-MM-DD"), // Today's date
          moment().format("YYYY-MM-DD"), // Today's date (for yesterday's calculation)
          moment().format("YYYY-MM-DD"), // Today's date
          moment().format("YYYY-MM-DD"), // Today's date
          adminOraganizationID, // Organization ID
        ],
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );

    // let lastWeekAndThisWeekUserSignups = await sequelize.query(
    //   `
    //   SELECT
    //     CAST(COALESCE(COUNT(DISTINCT id), 0) AS signed) AS week_total,
    //     CAST(COALESCE(COUNT(DISTINCT CASE WHEN DATE(createdAt) >= DATE(?) AND DATE(createdAt) <= DATE(?) THEN id END), 0) AS signed) AS this_week,
    //     CAST(COALESCE(COUNT(DISTINCT CASE WHEN DATE(createdAt) >= DATE(?) AND DATE(createdAt) <= DATE(?) THEN id END), 0) AS signed) AS last_week
    //   FROM
    //     customer
    //   `,
    //   {
    //     replacements: [
    //       moment().startOf("week").format("YYYY-MM-DD"), // This week's start date
    //       moment().endOf("week").format("YYYY-MM-DD"), // This week's end date
    //       moment().subtract(1, "weeks").startOf("week").format("YYYY-MM-DD"), // Last week's start date
    //       moment().subtract(1, "weeks").endOf("week").format("YYYY-MM-DD"), // Last week's end date
    //     ],
    //     type: Sequelize.QueryTypes.SELECT,
    //     plain: true,
    //   }
    // );
    let lastMonthAndThisMonthUserSignups = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(COUNT(DISTINCT id), 0) AS signed) AS month_total,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN id END), 0) AS signed) AS this_month,
        CAST(COALESCE(COUNT(DISTINCT CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN id END), 0) AS signed) AS last_month
      FROM
        customer
      WHERE
        organization_id = ?
      `,
      {
        replacements: [
          moment().startOf("month").format("YYYY-MM-DD"), // This month's start date
          moment().format("YYYY-MM-DD"), // Current date for this month
          moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"), // Last month's start date
          moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD"), // Last month's end date
          adminOraganizationID, // Organization ID
        ],
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );
    // console.log("loyaltyPointLastAndThisMonth", loyaltyPointLastAndThisMonth);
    console.log(
      "lastMonthAndThisMonthUserSignups",
      lastMonthAndThisMonthUserSignups
    );
    const dailyTotalofTodayAndYesterdayUsers =
      currentAndYesterdayUserSignups.today +
      currentAndYesterdayUserSignups.yesterday;
    const weeklyTotalUsers =
      newUserweek.week_total + lastWeekNewUserSignups.last_week_total;

    // Count of customers belonging to the specified organization
    const totalMembers = await Customer.count({
      where: { organization_id: adminOraganizationID },
    });

    // Sum of total loyalty points for customers in the specified organization
    const loyaltyPointsSum = await Customer.sum("total_loyalty_point", {
      where: { organization_id: adminOraganizationID },
    });

    // Total promotions belonging to the specified organization
    const totalPromotions = await Promotion.count({
      where: { organization_id: adminOraganizationID },
    });

    // Total revenue from customers within the specified organization
    const totalRevenue = await Customer_Visit.sum("transaction_amount", {
      where: { organization_id: adminOraganizationID },
    });
    
    // const roundedTotalRevenue = parseFloat(totalRevenue.toFixed(2));
    // console.log("totalRevenue", roundedTotalRevenue);
    // Sum of total loyalty points redeemed by customers in the specified organization
    // const totalLoyaltyPointsRedeemed = await Customer_Visit.sum("redeem_loyalty_point", { where: { organization_id: adminOraganizationID } });
    const totalLoyaltyPointsRedeemed = await Customer_Visit.sum(
      "redeem_loyalty_point",
      { where: { organization_id: adminOraganizationID } }
    );
    // Get the first and last day of the current month
    const firstDayOfMonth = moment().startOf("month").toDate();
    const lastDayOfMonth = moment().endOf("month").toDate();

    // Calculate totalRevenue for the current month
    const totalBillingAmountofMonth = await Customer_Visit.sum(
      "transaction_amount",
      {
        where: {
          createdAt: {
            [Op.between]: [firstDayOfMonth, lastDayOfMonth],
          },
          organization_id: adminOraganizationID,
        },
      }
    );

    // Get the first and last day of the previous month
    const firstDayOfLastMonth = moment()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const lastDayOfLastMonth = moment()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    // Calculate totalRevenue for the last month
    const totalBillingAmountOfLastMonth = await Customer_Visit.sum(
      "transaction_amount",
      {
        where: {
          createdAt: {
            [Op.between]: [firstDayOfLastMonth, lastDayOfLastMonth],
          },
          organization_id: adminOraganizationID,
        },
      }
    );
  
    // const roundedTotalBillingAmountOfLastMonth = (Math.round(totalBillingAmountOfLastMonth * 100) / 100).toFixed(2);
    // console.log("Rounded total billing amount of last month:", roundedTotalBillingAmountOfLastMonth);
    // Get the first day of the current month
    const firstDayOfThisMonth = moment().startOf("month").toDate();
    // Get the current date
    // const currentDate = currentDate;
    // Calculate totalBillingAmount for the current month up to the current date
    const totalBillingAmountofThisMonthTillCurrentDate =
      await Customer_Visit.sum("transaction_amount", {
        where: {
          createdAt: {
            [Op.between]: [firstDayOfThisMonth, currentDate],
          },
          organization_id: adminOraganizationID,
        },
      });

    const currentYearStartDate = moment().startOf("year").toDate();
    const currentYearCurrentDate = moment().toDate(); // Current date
    const currentYearBillingAmountTillDate = await Customer_Visit.sum(
      "transaction_amount",
      {
        where: {
          createdAt: {
            [Op.between]: [currentYearStartDate, currentYearCurrentDate],
          },
          organization_id: adminOraganizationID,
        },
      }
    );

    console.log(
      "TBA for Current Year Till current Date:",
      currentYearBillingAmountTillDate
    );
    console.log(
      "TBA Current Month up to Current Date:",
      totalBillingAmountofThisMonthTillCurrentDate
    );

    console.log("TBA of Last Month:", totalBillingAmountOfLastMonth);

    // Get the first day of the current month
    const firstDayOfCurrentMonth = moment().startOf("month");
    // Calculate the difference in days between the first day of the month and the current date
    // const daysCount = currentDate.diff(firstDayOfCurrentMonth, "days") + 1;
    // const daysCount = currentDate.diff(firstDayOfCurrentMonth, 'days') + 1;
    // console.log(
    //   "Current month days count from start date till current date:",
    //   daysCount
    // );

    // const totalBillingAmountofMonth = await Customer_Visit.sum('transaction_amount', {
    //   where: {
    //     createdAt: {
    //       [Op.between]: [firstDayOfMonth, lastDayOfMonth],
    //     },
    //   },
    //   include: [{
    //     model: Customer,
    //     where: {
    //       organization_id: adminOraganizationID,
    //     },
    //   }],
    // });
    const totalMembersofMonth = await Customer.count({
      include: [
        {
          model: Customer_Visit,
          where: {
            createdAt: {
              [Op.between]: [firstDayOfMonth, lastDayOfMonth],
            },
          },
        },
      ],
      where: {
        organization_id: adminOraganizationID,
      },
    });

    console.log("totalMembersofMonth-----", totalMembersofMonth);
    console.log("totalBillingAmountofMonth---", totalBillingAmountofMonth);
    console.log("totalLoyaltyPointsRedeemed----", totalLoyaltyPointsRedeemed);
    console.log(
      "Total totalBillingAmount for Current Month:",
      totalBillingAmountofMonth
    );
    let conservativeRetentionRate = 0.05;
    let optimisticRetentionRate = 0.2;
    let averageSpentValue = totalBillingAmountofMonth / totalMembersofMonth;
    console.log("averageSpentValue", averageSpentValue);
    let ANVM = 2;
    // const TAR = ASPV × ANVM × CRR × TNC
    // const TARofconservative = averageSpentValue * ANVM * conservativeRetentionRate * totalMembersofMonth;
    // const TARofoptimistic = averageSpentValue * ANVM * optimisticRetentionRate * totalMembersofMonth;
    // console.log("TAR-------",TAR);
    const decimalPlaces = 0;
    const roundingFactor = Math.pow(10, decimalPlaces);
    const TARofconservative =
      Math.round(
        averageSpentValue *
          ANVM *
          conservativeRetentionRate *
          totalMembersofMonth *
          roundingFactor
      ) / roundingFactor;
    const TARofoptimistic =
      Math.round(
        averageSpentValue *
          ANVM *
          optimisticRetentionRate *
          totalMembersofMonth *
          roundingFactor
      ) / roundingFactor;

    console.log("TARofconservative------", TARofconservative);
    console.log("TARofoptimistic----", TARofoptimistic);
    const 
    TBA = await Customer_Visit.sum("transaction_amount", {
      where: { organization_id: adminOraganizationID },
    });
    console.log("TBA", TBA);
    const currentMonthAndLastMonthTBA = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(SUM(transaction_amount), 0) AS signed) AS month_total,
        CAST(COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN transaction_amount END), 0) AS signed) AS this_month,
        CAST(COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN transaction_amount END), 0) AS signed) AS last_month
      FROM
        customer_visit
      WHERE
        organization_id = ?
      `,
      {
        replacements: [
          moment().startOf("month").format("YYYY-MM-DD"), // This month's start date
          moment().format("YYYY-MM-DD"), // Current date for this month
          moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"), // Last month's start date
          moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD"), // Last month's end date
          adminOraganizationID, // Organization ID
        ],
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );

    const currentWeekAndLastWeekAndMonthTBA = await sequelize.query(
      `
      SELECT
        CAST(COALESCE(SUM(transaction_amount), 0) AS signed) AS month_total,
        CAST(COALESCE(SUM(CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN transaction_amount END), 0) AS signed) AS this_week,
        CAST(COALESCE(SUM(CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN transaction_amount END), 0) AS signed) AS last_week,
        CAST(COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN transaction_amount END), 0) AS signed) AS this_month,
        CAST(COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN transaction_amount END), 0) AS signed) AS last_month
      FROM
        customer_visit
      WHERE
        organization_id = ?
      `,
      {
        replacements: [
          moment().startOf("month").format("YYYY-MM-DD"), // This month's start date
          moment().format("YYYY-MM-DD"), // Current date for this month
          moment().startOf("week").format("YYYY-MM-DD"), // Start of the current week
          moment().format("YYYY-MM-DD"), // Current date for this week
          moment().subtract(1, "weeks").startOf("week").format("YYYY-MM-DD"), // Start of the last week
          moment().startOf("week").format("YYYY-MM-DD"), // End of the last week
          moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"), // Last month's start date
          moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD"), // Last month's end date
          adminOraganizationID, // Organization ID
        ],
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );

    // const currentWeekAndLastWeekAndMonthCustomerStats = await sequelize.query(
    //   `
    //   SELECT
    //     COUNT(DISTINCT CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN customer_id END) AS this_week_distinct_customers,
    //     COUNT(DISTINCT CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN customer_id END) AS last_week_distinct_customers,
    //     COUNT(DISTINCT CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN customer_id END) AS this_month_distinct_customers,
    //     COUNT(DISTINCT CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN customer_id END) AS last_month_distinct_customers,
    //     COALESCE(SUM(CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? AND organization_id = ? THEN transaction_amount END), 0) AS this_week_amount,
    //     COALESCE(SUM(CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? AND organization_id = ? THEN transaction_amount END), 0) AS last_week_amount,
    //     COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) AND organization_id = ? THEN transaction_amount END), 0) AS this_month_amount,
    //     COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) AND organization_id = ? THEN transaction_amount END), 0) AS last_month_amount
    //   FROM
    //     customer_visit
    //   WHERE
    //     organization_id = ?;
    //   `,
    //   {
    //     replacements: [
    //       moment().startOf("week").format("YYYY-MM-DD"), // Start of the current week
    //       moment().format("YYYY-MM-DD"), // Current date for this week
    //       moment().subtract(1, "weeks").startOf("week").format("YYYY-MM-DD"), // Start of the last week
    //       moment().startOf("week").format("YYYY-MM-DD"), // End of the last week
    //       moment().startOf("month").format("YYYY-MM-DD"), // This month's start date
    //       moment().format("YYYY-MM-DD"), // Current date for this month
    //       moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"), // Last month's start date
    //       moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD"), // Last month's end date
    //       moment().startOf("week").format("YYYY-MM-DD"), // Start of the current week for amount calculation
    //       moment().format("YYYY-MM-DD"), // Current date for amount calculation this week
    //       moment().subtract(1, "weeks").startOf("week").format("YYYY-MM-DD"), // Start of the last week for amount calculation
    //       moment().startOf("week").format("YYYY-MM-DD"), // End of the last week for amount calculation
    //       moment().startOf("month").format("YYYY-MM-DD"), // This month's start date for amount calculation
    //       moment().format("YYYY-MM-DD"), // Current date for amount calculation this month
    //       moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"), // Last month's start date for amount calculation
    //       moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD"), // Last month's end date for amount calculation
    //       adminOraganizationID, // Organization ID (replace with actual organization ID)
    //       adminOraganizationID, // Organization ID (replace with actual organization ID)
    //       adminOraganizationID, // Organization ID (replace with actual organization ID)
    //       adminOraganizationID, // Organization ID (replace with actual organization ID)
    //       adminOraganizationID, // Organization ID (replace with actual organization ID)
    //     ],
    //     type: Sequelize.QueryTypes.SELECT,
    //     plain: true,
    //   }
    // );
    const currentWeekAndLastWeekAndMonthCustomerStats = await sequelize.query(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN customer_id END) AS this_week_distinct_customers,
        COUNT(DISTINCT CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN customer_id END) AS last_week_distinct_customers,
        COUNT(DISTINCT CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN customer_id END) AS this_month_distinct_customers,
        COUNT(DISTINCT CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN customer_id END) AS last_month_distinct_customers,
        COALESCE(SUM(CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN transaction_amount END), 0) AS this_week_amount,
        COALESCE(SUM(CASE WHEN DATE(createdAt) >= ? AND DATE(createdAt) < ? THEN transaction_amount END), 0) AS last_week_amount,
        COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN transaction_amount END), 0) AS this_month_amount,
        COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(?) AND YEAR(createdAt) = YEAR(?) THEN transaction_amount END), 0) AS last_month_amount
      FROM
        customer_visit
      WHERE
        organization_id = ?;
      `,
      {
          replacements: [
              moment().startOf("week").format("YYYY-MM-DD"), // Start of the current week
              moment().add(1, "week").startOf("week").format("YYYY-MM-DD"), // End of the current week
              moment().subtract(1, "week").startOf("week").format("YYYY-MM-DD"), // Start of the last week
              moment().startOf("week").format("YYYY-MM-DD"), // End of the last week
              moment().startOf("month").format("YYYY-MM-DD"), // This month's start date
              moment().add(1, "month").startOf("month").format("YYYY-MM-DD"), // Next month's start date
              moment().startOf("month").format("YYYY-MM-DD"), // This month's start date for last month's calculation
              moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD"), // Last month's start date
              moment().startOf("week").format("YYYY-MM-DD"), // Start of the current week for amount calculation
              moment().add(1, "week").startOf("week").format("YYYY-MM-DD"), // End of the current week for amount calculation
              moment().subtract(1, "week").startOf("week").format("YYYY-MM-DD"), // Start of the last week for amount calculation
              moment().startOf("week").format("YYYY-MM-DD"), // End of the last week for amount calculation
              moment().startOf("month").format("YYYY-MM-DD"), // This month's start date for amount calculation
              moment().add(1, "month").startOf("month").format("YYYY-MM-DD"), // Next month's start date for amount calculation
              moment().startOf("month").format("YYYY-MM-DD"), // This month's start date for last month's amount calculation
              moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD"), // Last month's start date for amount calculation
              adminOraganizationID, // Organization ID (replace with actual organization ID)
          ],
          type: Sequelize.QueryTypes.SELECT,
          plain: true,
      }
  );
  

    // console.log('Current Week TBA:', currentWeekAndLastWeekAndMonthTBA.this_week);
    // console.log('Last Week TBA:', currentWeekAndLastWeekAndMonthTBA.last_week);
    // console.log('Current Month TBA:', currentMonthAndLastMonthTBA.this_month);
    // console.log('Last Month TBA:', currentMonthAndLastMonthTBA.last_month);
    // console.log('Total TBA:', currentMonthAndLastMonthTBA.month_total);
    console.log("currentWeekAndLastWeekAndMonthCustomerStats",currentWeekAndLastWeekAndMonthCustomerStats);

    const DA = await Customer_Visit.sum("redeem_loyalty_point", {
      where: { organization_id: adminOraganizationID },
    });
    console.log("DA----------",DA);
    const totalSpentPerMemberWithDiscountAmount =
    Math.round((TBA - DA) / totalMembers) / roundingFactor;

    const thisMonth = lastMonthAndThisMonthUserSignups.this_month;
    const totalSpentPerMemberWithOutDiscountAmount =
      Math.round(TBA / totalMembers) / roundingFactor;
    const thisMonthAverageExpenditure =
      Math.round(
        currentWeekAndLastWeekAndMonthCustomerStats.this_month_amount /
          currentWeekAndLastWeekAndMonthCustomerStats.this_month_distinct_customers
      ) / roundingFactor;
    const lastMonthAverageExpenditure =
      Math.round(
        currentWeekAndLastWeekAndMonthCustomerStats.last_month_amount /
          currentWeekAndLastWeekAndMonthCustomerStats.last_month_distinct_customers
      ) / roundingFactor;
    const thisWeekAverageExpenditure =
      Math.round(
        currentWeekAndLastWeekAndMonthCustomerStats.this_week_amount
         /currentWeekAndLastWeekAndMonthCustomerStats.this_week_distinct_customers
      ) / roundingFactor;
    const lastWeekAverageExpenditure =
      Math.round(
        currentWeekAndLastWeekAndMonthCustomerStats.last_week_amount
        /currentWeekAndLastWeekAndMonthCustomerStats.last_week_distinct_customers 
      ) / roundingFactor;
      console.log("currentWeekAndLastWeekAndMonthCustomerStats.last_week_distinct_customers",currentWeekAndLastWeekAndMonthCustomerStats.last_week_distinct_customers);
      console.log("currentWeekAndLastWeekAndMonthCustomerStats.last_week_amount", currentWeekAndLastWeekAndMonthCustomerStats.last_week_amount);

      console.log("currentWeekAndLastWeekAndMonthCustomerStats.this_week_amount",currentWeekAndLastWeekAndMonthCustomerStats.this_week_amount);
      console.log("currentWeekAndLastWeekAndMonthCustomerStats.this_week_distinct_customers",currentWeekAndLastWeekAndMonthCustomerStats.this_week_distinct_customers);

    console.log("thisMonthAverageExpenditure",thisMonthAverageExpenditure);
    console.log("lastMonthAverageExpenditure",lastMonthAverageExpenditure);
    console.log("thisWeekAverageExpenditure",thisWeekAverageExpenditure);
    console.log("lastWeekAverageExpenditure",lastWeekAverageExpenditure);
    // console.log(
    //   "totalSpentPerMemberWithDiscountAmount",
    //   totalSpentPerMemberWithDiscountAmount
    // );
    // console.log(
    //   "totalSpentPerMemberWithOutDiscountAmount",
    //   totalSpentPerMemberWithOutDiscountAmount
    // );
    // Function to get the name of the last month with the year
    function getLastMonthNameWithYear() {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const lastMonthName = monthNames[lastMonth.getMonth()];
      const lastMonthYear = lastMonth.getFullYear();

      return `${lastMonthName} ${lastMonthYear}`;
    }
    // Function to get the name of the current month with the year
    function getCurrentMonthNameWithYear() {
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const currentMonthName = monthNames[currentMonth.getMonth()];
      const currentMonthYear = currentMonth.getFullYear();

      return `${currentMonthName} ${currentMonthYear}`;
    }
    // Function to get the start and end dates of the last week with the year
    function getLastWeekDatesWithYear() {
      const today = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const lastWeekStartDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay() - 6
      );
      const lastWeekEndDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay()
      );

      const lastWeekStartYear = lastWeekStartDate.getFullYear();
      const lastWeekEndYear = lastWeekEndDate.getFullYear();

      return {
        start: `${lastWeekStartDate.getDate()} ${
          monthNames[lastWeekStartDate.getMonth()]
        } ${lastWeekStartYear}`,
        end: `${lastWeekEndDate.getDate()} ${
          monthNames[lastWeekEndDate.getMonth()]
        } ${lastWeekEndYear}`,
      };
    }
    // Function to get the start and end dates of the current week with the year
    function getCurrentWeekDatesWithYear() {
      const today = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const currentWeekStartDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay() + 1
      );
      const currentWeekEndDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + (6 - today.getDay())
      );

      const currentWeekStartYear = currentWeekStartDate.getFullYear();
      const currentWeekEndYear = currentWeekEndDate.getFullYear();

      return {
        start: `${currentWeekStartDate.getDate()} ${
          monthNames[currentWeekStartDate.getMonth()]
        } ${currentWeekStartYear}`,
        end: `${currentWeekEndDate.getDate()} ${
          monthNames[currentWeekEndDate.getMonth()]
        } ${currentWeekEndYear}`,
      };
    }
    // Function to get yesterday's date, month, and year name
    function getYesterdayDateWithYear() {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const yesterdayMonthName = monthNames[yesterday.getMonth()];
      const yesterdayYear = yesterday.getFullYear();

      return `${yesterday.getDate()} ${yesterdayMonthName} ${yesterdayYear}`;
    }
    // Function to get today's date, month, and year name
    function getTodayDateWithYear() {
      const today = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const todayMonthName = monthNames[today.getMonth()];
      const todayYear = today.getFullYear();

      return `${today.getDate()} ${todayMonthName} ${todayYear}`;
    }
    const yesterdayDate = getYesterdayDateWithYear();
    const todayDate = getTodayDateWithYear();

    // console.log("Yesterday's date:", yesterdayDate);
    // console.log("Today's date:", todayDate);

    // Example usage:
    const lastWeekDatesWithYear = getLastWeekDatesWithYear();
    const currentWeekDatesWithYear = getCurrentWeekDatesWithYear();
    const lastWeekStartDate = lastWeekDatesWithYear.start;
    const lastWeekEndDate = lastWeekDatesWithYear.end;
    const currentWeekStartDate = currentWeekDatesWithYear.start;
    const currentWeekEndDate = currentWeekDatesWithYear.end;

    // console.log("Last Week Start Date:", lastWeekDatesWithYear.start);
    // console.log("Last Week End Date:", lastWeekDatesWithYear.end);
    // console.log("Current Week Start Date:", currentWeekDatesWithYear.start);
    // console.log("Current Week End Date:", currentWeekDatesWithYear.end);

    // Example usage:
    const currentMonthNameWithYear = getCurrentMonthNameWithYear();
    // Example usage:
    const lastMonthNameWithYear = getLastMonthNameWithYear();

    // Calculate the date range for the current year
    const currentYearStart = moment().startOf("year");
    const currentYearEnd = moment().endOf("year");

    // Calculate the date range for the last year
    const lastYearStart = moment().subtract(1, "year").startOf("year");
    const lastYearEnd = moment().subtract(1, "year").endOf("year");

    const currentYearStartOf = moment().startOf("year").toDate();
    const currentToDate = moment().toDate(); // Current date
    const totalDaysTillCurrentDateCurrentYear = Math.floor(
      (currentToDate - currentYearStartOf) / (1000 * 60 * 60 * 24)
    );
    // Total days in the entire current year
    const totalDaysInYear = Math.floor(
      (currentYearEnd - currentYearStart) / (1000 * 60 * 60 * 24)
    );

    console.log("Total Days in Current Year:", totalDaysInYear);
    console.log(
      "totalDays in till date for current year-----",
      totalDaysTillCurrentDateCurrentYear
    );

    const currentMonthStart = moment().startOf("month").toDate();
    const totalDaysInMonth = moment().daysInMonth(); // Use moment to accurately get days in month

    const totalDaysTillCurrentDateThisMonth = Math.floor(
      (currentDate - currentMonthStart) / (1000 * 60 * 60 * 24)
    );

    console.log("Total Days in Current Month:", totalDaysInMonth);
    console.log(
      "Total Days This Month Till Current Date:",
      totalDaysTillCurrentDateThisMonth
    );

    // Calculate the transaction amount sum for the current year till date
    const currentYearBillingAmount = await Customer_Visit.sum(
      "transaction_amount",
      {
        where: {
          createdAt: {
            [Op.between]: [currentYearStart, currentYearEnd],
          },
          organization_id: adminOraganizationID,
        },
      }
    );

    // Calculate the transaction amount sum for the last year
    const lastYearBillingAmount = await Customer_Visit.sum(
      "transaction_amount",
      {
        where: {
          createdAt: {
            [Op.between]: [lastYearStart, lastYearEnd],
          },
          organization_id: adminOraganizationID,
        },
      }
    );
    // const roundedlastYearBillingAmount = lastYearBillingAmount.toFixed(2);
    // const roundedLastYearBillingAmount = (Math.round(lastYearBillingAmount * 100) / 100).toFixed(2);
    // const roundedCurrentYearBillingAmount = (Math.round(currentYearBillingAmount * 100) / 100).toFixed(2);
    const roundedTotalRevenue = totalRevenue !== null ? parseFloat(totalRevenue.toFixed(2)) : null;

// Check if totalBillingAmountOfLastMonth is not null before rounding
    const roundedTotalBillingAmountOfLastMonth = totalBillingAmountOfLastMonth !== null ? 
    (Math.round(totalBillingAmountOfLastMonth * 100) / 100).toFixed(2) : null;

// Check if lastYearBillingAmount is not null before rounding
const roundedLastYearBillingAmount = lastYearBillingAmount !== null ? 
    (Math.round(lastYearBillingAmount * 100) / 100).toFixed(2) : null;

// Check if currentYearBillingAmount is not null before rounding
const roundedCurrentYearBillingAmount = currentYearBillingAmount !== null ? 
    (Math.round(currentYearBillingAmount * 100) / 100).toFixed(2) : null;

    // console.log("Rounded last year billing amount:", roundedLastYearBillingAmount);
    // console.log("Current Year Billing Amount:",  roundedCurrentYearBillingAmount);
    // console.log("Last Year Billing Amount:", roundedlastYearBillingAmount);
   
    // spending trends for last and thismonth
    const lastMonthSpendingTrend = roundedTotalBillingAmountOfLastMonth;
    const averageSpendTillCurrentDateOfThisMonth = Math.round(
      totalBillingAmountofThisMonthTillCurrentDate /
        totalDaysTillCurrentDateThisMonth
    );
    const thisMonthSpendingTrend =
      averageSpendTillCurrentDateOfThisMonth * totalDaysInMonth;

    console.log(
      "averageSpendTillCurrentDateOfThisMonth",
      averageSpendTillCurrentDateOfThisMonth
    );
    console.log("thisMonthSpendingTrend", thisMonthSpendingTrend);
    console.log("lastMonthSpendingTrend", lastMonthSpendingTrend);

    // spending trends for last and this year
    const lastYearSpendingTrend = roundedLastYearBillingAmount;
    const averageSpendTillCurrentDateOfThisYear = Math.round(
      currentYearBillingAmount / totalDaysTillCurrentDateCurrentYear
    );
    const thisYearSpendingTrend = averageSpendTillCurrentDateOfThisYear * totalDaysInYear;

    // Get the current year name
    const currentYearName = moment().format("YYYY");
    // Get the last year name
    const lastYearName = moment().subtract(1, "year").format("YYYY");

    console.log("Current Year:", currentYearName);
    console.log("Last Year:", lastYearName);

    return res.render("admin/dashboard/dashboard", {
      superAdmin,
      active:1,
      message,
      error,
      formValue,
      admin,
      adminThemeColor,
      adminBusinessName,
      totalMembers,
      loyaltyPointsSum,
      totalPromotions,
      roundedTotalRevenue,
      totalLoyaltyPointsRedeemed,
      newUserweek,
      lastWeekNewUserSignups,
      newUsermonth,
      currentAndYesterdayUserSignups,
      dailyTotalofTodayAndYesterdayUsers,
      weeklyTotalUsers,
      lastMonthAndThisMonthUserSignups,
      TARofconservative,
      TARofoptimistic,
      totalSpentPerMemberWithDiscountAmount,
      totalSpentPerMemberWithOutDiscountAmount,
      lastMonthNameWithYear,
      currentMonthNameWithYear,
      lastWeekStartDate,
      lastWeekEndDate,
      currentWeekStartDate,
      currentWeekEndDate,
      yesterdayDate,
      todayDate,
      thisMonthAverageExpenditure,
      lastMonthAverageExpenditure,
      thisWeekAverageExpenditure,
      lastWeekAverageExpenditure,
      totalBillingAmountOfLastMonth,
      lastMonthSpendingTrend,
      thisMonthSpendingTrend,
      lastYearSpendingTrend,
      thisYearSpendingTrend,
      currentYearName,
      lastYearName
    });
  } catch (err) {
    next(err);
  }
};
