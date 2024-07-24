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
    SingleUseOffer,
    Trend_Report,
    API_Key,
    SentSMS,
    Organization,
    GptPersonalizeSms
} = require("../../models");
const { Op, where } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utils = require("../../utils/helper");
const Joi = require("joi");
const { Sequelize, QueryTypes } = require("sequelize");
const { ACTIVE, BLOCKED } = require("../../utils/constants");
const { currentDate } = require("../../utils/currentdate.gmt6");
const OpenAI = require("openai")

const GPT_API_KEY = process.env.GPT_API_KEY




// ============================== Analysis based on the client requirement start ===================
exports.getPurchaseFrequency = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            include: [{
                model: Customer_Visit,
                attributes: ['visit_date'],
            }],
        };

        if (search_text) {
            options.where = {
                ...options.where,
                name: { [Op.like]: `%${search_text}%` }
            };
        }

        const customers = await Customer.findAndCountAll(options);
        const customerVisitFrequencies = customers.rows.map(customer => ({
            id: customer.id,
            name: customer.name,
            age: customer.age,
            contact_number: customer.contact_number,
            total_loyalty_point: customer.total_loyalty_point,
            visit_frequency: customer.Customer_Visits.length,
            last_visit: customer.Customer_Visits.length > 0 ? customer.Customer_Visits[customer.Customer_Visits.length - 1].visit_date : null
        }));

        let response = utils.getPagingData(customers, page, limit);
        return res.render("admin/gptAnalysis/getPurchaseFrequency.ejs", {
            superAdmin: admin.is_superadmin,
            limit: limit,
            totalItems: response.totalItems,
            items: customerVisitFrequencies,
            totalPages: response.totalPages,
            currentPage: response.currentPage + 1,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 201,
            customerVisitFrequencies
        });
    } catch (error) {
        next(error);
    }
};

exports.getAverageTransactionAmount = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            include: [{
                model: Customer_Visit,
                attributes: ['transaction_amount'],
            }],
            order: [
                [{ model: Customer_Visit }, 'transaction_amount', 'DESC']
            ]
        };

        if (search_text) {
            options.where = {
                ...options.where,
                name: { [Op.like]: `%${search_text}%` }
            };
        }

        const customers = await Customer.findAndCountAll(options);
        const customerTransactionAverages = customers.rows
            .filter(customer => customer.Customer_Visits.some(visit => visit.transaction_amount !== null))
            .map(customer => {
                const validVisits = customer.Customer_Visits.filter(visit => visit.transaction_amount !== null);
                const totalAmount = validVisits.reduce((sum, visit) => sum + parseFloat(visit.transaction_amount), 0);
                const avgTransactionAmount = totalAmount / validVisits.length;
                return {
                    customer_id: customer.id,
                    name: customer.name,
                    average_transaction_amount: avgTransactionAmount || 0,
                };
            });

        let response = utils.getPagingData(res, customerTransactionAverages, page + 1, limit);
        return res.render("admin/gptAnalysis/getAverageTransactionAmount.ejs", {
            superAdmin: admin.is_superadmin,
            limit: 10,
            totalItems: response.totalItems,
            items: customerTransactionAverages,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 202,
            customerTransactionAverages
        });
    } catch (error) {
        next(error);
    }
};

exports.getLoyaltyPoints = async (req, res, next) => {
    try {
        const { page = 0, limit = 60, search_text } = req.query;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            // offset: page * limit,
            // limit: limit,
            include: [{
                model: Customer_Visit,
                attributes: ['received_loyalty_point', 'redeem_loyalty_point', 'transaction_amount'],
            }],
        };



        const customers = await Customer.findAndCountAll(options);
        const customerLoyaltyPoints = customers.rows.map(customer => {
            const totalReceivedPoints = customer.Customer_Visits.reduce((sum, visit) => sum + visit.received_loyalty_point, 0);
            const totalRedeemedPoints = customer.Customer_Visits.reduce((sum, visit) => sum + visit.redeem_loyalty_point, 0);
            const totalTransection = customer.Customer_Visits.reduce((sum, visit) => sum + visit.transaction_amount, 0);

            return {
                customer_id: customer.id,
                name: customer.name,
                received_loyalty_points: totalReceivedPoints,
                redeem_loyalty_point: totalRedeemedPoints,
                transaction_amount: totalTransection,
            };
        });


        let response = utils.getPagingData(res, customerLoyaltyPoints, page + 1, limit);
        return res.render("admin/gptAnalysis/getLoyaltyPoints.ejs", {
            superAdmin: admin.is_superadmin,
            limit: 10,
            totalItems: response.totalItems,
            items: customerLoyaltyPoints,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 203,
            customerLoyaltyPoints
        });
    } catch (error) {
        next(error);
    }
};

exports.getVisitTrends = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            // offset: page * limit,
            // limit: limit,
            include: [{
                model: Customer_Visit,
                attributes: ['visit_date'],
            }],
        };

        if (search_text) {
            options.where = {
                ...options.where,
                name: { [Op.like]: `%${search_text}%` }
            };
        }

        const customers = await Customer.findAndCountAll(options);
        const visitTrends = customers.rows.map(customer => {
            const visitDates = customer.Customer_Visits.map(visit => new Date(visit.visit_date));
            const daysOfWeek = visitDates.map(date => date.getDay());
            const hoursOfDay = visitDates.map(date => date.getHours());
            return {
                customer_id: customer.id,
                name: customer.name,
                days_of_week: daysOfWeek,
                hours_of_day: hoursOfDay,
            };
        });

        let response = utils.getPagingData(res, visitTrends, page + 1, limit);
        return res.render("admin/gptAnalysis/getVisitTrends.ejs", {
            superAdmin: admin.is_superadmin,
            limit: 10,
            totalItems: response.totalItems,
            items: visitTrends,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 204,
            visitTrends
        });
    } catch (error) {
        next(error);
    }
};

exports.getCustomerRetention = async (req, res, next) => {
    try {
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        const totalCustomers = await Customer.count({ where: { organization_id: adminOrganizationID } });
        const repeatCustomers = await Customer.count({
            where: { organization_id: adminOrganizationID },
            include: [{
                model: Customer_Visit,
                having: sequelize.literal('COUNT(Customer_Visits.id) > 1'),
                required: true,
            }],
        });

        const retentionRate = (repeatCustomers / totalCustomers) * 100;

        return res.render("admin/gptAnalysis/getCustomerRetention.ejs", {
            superAdmin: admin.is_superadmin,
            repeatCustomers,
            retentionRate,
            totalCustomers,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 205
        });
    } catch (error) {
        next(error);
    }
};

exports.getHighValueCustomers = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            include: [{
                model: Customer_Visit,
                attributes: ['transaction_amount'],
            }],
        };

        if (search_text) {
            options.where = {
                ...options.where,
                name: { [Op.like]: `%${search_text}%` }
            };
        }

        const customers = await Customer.findAndCountAll(options);
        const highValueCustomers = customers.rows
            .map(customer => {
                // Filter out visits where transaction_amount is null
                const validVisits = customer.Customer_Visits.filter(visit => visit.transaction_amount !== null);

                if (validVisits.length === 0) {
                    return null; // If no valid visits, exclude this customer
                }

                const totalAmount = validVisits.reduce((sum, visit) => sum + parseFloat(visit.transaction_amount), 0);
                return {
                    customer_id: customer.id,
                    name: customer.name,
                    total_amount_spent: totalAmount,
                };
            })
            .filter(customer => customer !== null) // Remove null values
            .sort((a, b) => b.total_amount_spent - a.total_amount_spent);

        let response = utils.getPagingData(res, highValueCustomers, page + 1, limit);
        return res.render("admin/gptAnalysis/getHighValueCustomers.ejs", {
            superAdmin: admin.is_superadmin,
            limit: 10,
            totalItems: response.totalItems,
            items: highValueCustomers,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 206,
            highValueCustomers
        });
    } catch (error) {
        next(error);
    }
};

exports.getLowValueCustomers = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            // offset: page * limit,
            // limit: limit,
            include: [{
                model: Customer_Visit,
                attributes: ['transaction_amount'],
                where: {
                    transaction_amount: {
                        [Op.ne]: null // Exclude null transaction amounts
                    }
                },
                required: true // Ensure customers have at least one visit with a non-null transaction amount
            }],
        };

        if (search_text) {
            options.where = {
                ...options.where,
                name: { [Op.like]: `%${search_text}%` }
            };
        }

        const customers = await Customer.findAndCountAll(options);
        const lowValueCustomers = customers.rows.map(customer => {
            const totalAmount = customer.Customer_Visits.reduce((sum, visit) => sum + parseFloat(visit.transaction_amount), 0);
            return {
                customer_id: customer.id,
                name: customer.name,
                total_amount_spent: totalAmount,
            };
        }).sort((a, b) => a.total_amount_spent - b.total_amount_spent);

        let response = utils.getPagingData(res, lowValueCustomers, page + 1, limit);
        return res.render("admin/gptAnalysis/getLowValueCustomers.ejs", {
            superAdmin: admin.is_superadmin,
            limit: 10,
            totalItems: response.totalItems,
            items: lowValueCustomers,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 207,
            lowValueCustomers
        });
    } catch (error) {
        next(error);
    }
};
// ============================== Analysis based on the client requirement End ===================



const openai = new OpenAI({
    apiKey: GPT_API_KEY,
});

const chatgptModle = async (messageContent) => {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: messageContent },
            ],
            model: "gpt-3.5-turbo-1106",
        });

        let response = completion.choices[0].message.content; // Extract the message content
        console.log(response)

        return response;
    } catch (error) {
        console.error("Error in analysis", error);
        throw error; // Propagate error to the caller
    }
};

exports.startAnalysis = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        let admin = req.admin;
        let organization_id = admin.Organizations[0].id;
        let superAdmin = admin.is_superadmin;
        const customers = await Customer.findAll({
            where: { organization_id },
            include: [{ model: Customer_Visit }],
            order: [['createdAt', 'DESC']], // Order by createdAt in descending order
            limit: 100
        });


        const dataForAnalysis = customers.map(customer => ({
            name: customer.name,
            visits: customer.Customer_Visits.map(visit => visit.visit_date),
            transactions: customer.Customer_Visits.map(visit => visit.transaction_amount),
            received_loyalty_point: customer.Customer_Visits.map(visit => visit.received_loyalty_point),
            redeem_loyalty_point: customer.Customer_Visits.map(visit => visit.redeem_loyalty_point)
        }));


        // return res.json(dataForAnalysis)

        //     // Call ChatGPT API for analysis

        //     // Call ChatGPT API for analysis
        //     const prompt = `
        //   Analyze the following customer data:
        //   ${JSON.stringify(dataForAnalysis)}
        //   Provide insights such as top spenders, frequent buyers, and loyalty points summary, Organization ke trend reports fetch karo.
        // `;

        const prompt = ` this is my customer data ${JSON.stringify(dataForAnalysis)} ,  i want to get the data for the chart to show on the screen please give me array for the show the result for the trend`
        // const prompt = `Analyze the customer data provided, focusing on the following fields: visit_date, transaction_amount, received_loyalty_point, and redeem_loyalty_point. Generate a comprehensive analysis and trend reports based on this data. Include insights on purchase frequency, average transaction amounts, loyalty points earned and redeemed, visit trends, customer retention, and identify high-value and low-value customers. Provide the results in the form of a summary, detailed report, and line charts depicting relevant trends. this is my customer data ${JSON.stringify(dataForAnalysis)} ,  i want to get the data for the chart to show on the screen`


        // const chatGPTResponse = await chatgptModle(prompt);

        // // Try parsing the response as JSON
        // let analysisResult;
        // try {
        //     analysisResult = JSON.parse(chatGPTResponse);
        // } catch (error) {
        //     console.error("Error parsing ChatGPT response as JSON:", error);
        //     analysisResult = chatGPTResponse; // Fallback to raw response
        // }
        // console.log(chatGPTResponse, analysisResult)
        // return res.json(chatGPTResponse)

        return res.render('admin/gptAnalysis/dataAnalysis.results.ejs', {
            superAdmin,
            analysisResult: dataForAnalysis,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 101
        });
    } catch (error) {
        next(error);
    }
};

// ======================== Start Controller for the Analysis ====================


exports.getTrendReports = async (req, res, next) => {
    try {

        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;

        let adminOrganizationID = admin.Organizations[0].id;

        const options = {
            where: { organization_id: adminOrganizationID },
            offset: page * limit,
            limit: limit,
            order: [['id', 'DESC']]
        };

        const data = await Trend_Report.findAndCountAll(options);
        const response = utils.getPagingData(res, data, page + 1, limit);

        return res.render('admin/gptAnalysis/trendReports.overview.ejs', {
            totalItems: response.totalItems,
            limit: 10,
            items: response.items,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 102
        });
    } catch (error) {
        next(error);
    }
};

exports.getTrendReportDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = req.admin;

        let adminOrganizationID = admin.Organizations[0].id;

        const report = await Trend_Report.findOne({
            where: { id, organization_id: adminOrganizationID }
        });

        if (!report) {
            return res.status(404).render('partials/404.ejs');
        }

        return res.render('admin/gptAnalysis/trendReports.details.ejs', {
            report,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 100
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTrendReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = req.admin;

        let adminOrganizationID = admin.Organizations[0].id;
        const report = await Trend_Report.findOne({
            where: { id, organization_id: adminOrganizationID }
        });
        if (!report) {
            return res.status(404).render('partials/404.ejs');
        }
        await report.destroy();
        return res.redirect('/admin/trendReports');
    } catch (error) {
        next(error);
    }
};


// ====================== sms ===================================

exports.generateSMS = async (req, res, next) => {
    try {
        const { page = 0, limit = 10 } = req.query;
        const admin = req.admin;

        let adminOrganizationID = admin.Organizations[0].id;

        // Fetch generated SMS from the database
        const smsContents = await GptPersonalizeSms.findAll({
            where: { organization_id: adminOrganizationID },
        });


        // const totalPages = Math.ceil(count / limit);

        return res.render('admin/gptAnalysis/smsManagement.generate.ejs', {
            totalPages: 1,
            currentPage: parseInt(page, 10) + 1,
            // totalItems: count,
            limit: parseInt(limit, 10),
            smsContents,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 103
        });
    } catch (error) {
        console.log('Error:', error);
        next(error);
    }
};

exports.generate_sms_by_chatgpt = async (req, res, next) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const { page = 0, limit = 10 } = req.query;
        const admin = req.admin;

        let adminOrganizationID = admin.Organizations[0].id;
        let Organization_details = await Organization.findOne({ where: { id: adminOrganizationID } });
        let organization_name = Organization_details?.business_name;

        // Fetch customer data
        const customers = await Customer.findAll({ where: { organization_id: adminOrganizationID } });
        const customerChunks = chunkArray(customers, 20); // Divide customers into chunks of 20

        for (let chunk of customerChunks) {
            const chunkProcessingPromises = chunk.map(async (customer) => {
                const prompt = `Analyze customer data and write a personalized SMS for the customer ${JSON.stringify(customer)}. Only provide the message. My organization name is ${organization_name}.`;
                const smsContent = await chatgptModle(prompt);

                // Validate smsContent and customer details
                if (!customer.name || !customer.contact_number || !smsContent) {
                    console.warn('Missing data:', { customer, smsContent });
                    return; // Skip this record if any required field is missing
                }

                // Check for existing record
                const existingRecord = await GptPersonalizeSms.findOne({
                    where: { customer_contact_number: customer.contact_number },
                    transaction: t
                });

                const recordData = {
                    customer_name: customer.name,
                    customer_contact_number: customer.contact_number,
                    personalize_message: smsContent,
                    organization_id: adminOrganizationID
                };

                if (existingRecord) {
                    // Update existing record
                    await GptPersonalizeSms.update({
                        customer_name: recordData.customer_name,
                        personalize_message: recordData.personalize_message,
                        updatedAt: new Date()
                    }, {
                        where: { id: existingRecord.id },
                        transaction: t
                    });
                } else {
                    // Insert new record
                    await GptPersonalizeSms.create(recordData, { transaction: t });
                }
            });

            // Wait for all promises in the chunk to be processed
            await Promise.all(chunkProcessingPromises);
        }

        await t.commit(); // Commit transaction

        const response = utils.getPagingData(res, [], page + 1, limit);
        return res.redirect("/admin/smsManagement/generate");
    } catch (error) {
        await t.rollback(); // Rollback transaction in case of error
        console.log('Error:', error);
        next(error);
    }
};

function chunkArray(arr, chunkSize) {
    let results = [];
    while (arr.length) {
        results.push(arr.splice(0, chunkSize));
    }
    return results;
}

exports.getCampaignOverview = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;

        let adminOrganizationID = admin.Organizations[0].id;

        const options = {
            where: { organization_id: adminOrganizationID },
            offset: page * limit,
            limit: limit,
            order: [['id', 'DESC']]
        };

        if (search_text) {
            options.where.name = { [Op.like]: `%${search_text}%` };
        }

        const data = await Campaign.findAndCountAll(options);
        const response = utils.getPagingData(res, data, page + 1, limit);

        return res.render('admin/gptAnalysis/campaignManagement.overview.ejs', {
            limit: limit,
            totalItems: response.totalItems,
            items: response.items,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 104
        });
    } catch (error) {
        next(error);
    }
};


exports.getCreateNewCampaign = async (req, res, next) => {
    try {
        const { error, message, formValue } = req.query;
        const { organization_id } = req.admin;

        return res.render('admin/campaignManagement/create.ejs', {
            title: 'Create New Campaign',
            error,
            message,
            formValue,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 106
        });
    } catch (error) {
        next(error);
    }
};

exports.postCreateNewCampaign = async (req, res, next) => {
    try {
        const { name, target_audience, message_content, start_date, end_date, status } = req.body;
        const { organization_id } = req.admin;

        const newCampaign = await Campaign.create({
            name,
            target_audience,
            message_content,
            start_date,
            end_date,
            status,
            organization_id
        });

        return res.redirect('/admin/campaign-overview');
    } catch (error) {
        return res.render('admin/campaignManagement/create.ejs', {
            title: 'Create New Campaign',
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            error: error.message,
            formValue: req.body,
            superAdmin: req.admin.is_superadmin,
            active: 106
        });
    }
};


exports.getCampaignDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { organization_id } = req.admin;

        const campaign = await Campaign.findOne({
            where: { id, organization_id },
            include: [SentSMS]
        });

        if (!campaign) {
            return res.status(404).render('partials/404.ejs');
        }

        const smsCampaignSends = await SentSMS.findAll({
            where: { campaign_id: id, organization_id },
            include: [{ model: Customer, attributes: ['name', 'contact_number'] }]
        });

        return res.render('admin/campaignManagement/details.ejs', {
            campaign,
            smsCampaignSends,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 107
        });
    } catch (error) {
        next(error);
    }
};


exports.getSettings = async (req, res, next) => {
    try {
        const admin = req.admin;
        let adminOrganizationID = admin.Organizations[0].id;
        const apiKey = await API_Key.findOne({ where: { organization_id: adminOrganizationID } });
        if (!apiKey) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "No Data Found"
            })
        }

        return res.render('admin/gptAnalysis/settings.ejs', {
            title: 'Set API Key',
            formValue: apiKey,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 105
        });
    } catch (error) {
        next(error);
    }
};


exports.postSettings = async (req, res, next) => {
    try {
        const { service_name, api_key } = req.body;
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        // Find or create the API Key record
        const [apiKeyRecord, created] = await API_Key.findOrCreate({
            where: { organization_id: adminOrganizationID },
            defaults: { service_name, api_key, organization_id: adminOrganizationID }
        });

        // If the record was found, update it
        if (!created) {
            await apiKeyRecord.update({ service_name, api_key });
        }

        return res.redirect('/admin/gpt/setting');
    } catch (error) {
        return res.render('admin/gptAnalysis/settings.ejs', {
            title: 'Set API Key',
            service_name: req.body.service_name,
            api_key: req.body.api_key,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            error: error.message,
            superAdmin: req.admin.is_superadmin,
            active: 108
        });
    }
};



//=============================================================================
exports.generateTrendAnalysis = async (req, res, next) => {
    const { organization_id, start_date, end_date } = req.query;
    const chunkSize = 100; // Adjust as necessary
    const context = {}; // In-memory cache to keep track of context

    try {
        // Fetch customer visit data
        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        // Apply date range filter if provided
        const customerVisits = await Customer_Visit.findAll({
            where: {
                organization_id: adminOrganizationID,
                // visit_date: {
                //     [Op.between]: [start_date, end_date]
                // }
            },
            include: [
                {
                    model: Customer,
                    attributes: ['name', 'contact_number']
                }
            ]
        });

        const totalVisits = customerVisits.length;
        let currentIndex = 0;
        let insights = '';

        while (currentIndex < totalVisits) {
            const chunk = customerVisits.slice(currentIndex, currentIndex + chunkSize);
            currentIndex += chunkSize;

            // Process chunk data
            const visitsData = chunk.map(v => ({
                customerName: v.Customer.name,
                visitDate: v.visit_date,
                transactionAmount: v.transaction_amount,
                receivedLoyaltyPoint: v.received_loyalty_point,
                redeemLoyaltyPoint: v.redeem_loyalty_point
            }));

            const prompt = `Analyze the following customer visit data and identify trends: ${JSON.stringify(visitsData)}. Provide insights and recommendations for improving customer engagement and increasing sales. Keep the context from previous data in mind.`;

            // Send prompt to GPT API
            const response = await chatgptModle(prompt);
            insights += response; // Aggregate insights
        }

        // Send the aggregated insights
        return res.json({ insights });
    } catch (error) {
        console.error('Error generating trend analysis:', error);
        next(error);
    }
};



exports.generateWeeklySuggestions = async (req, res, next) => {
    try {
        // Fetch data for the last week
        const { page = 0, limit = 10, search_text } = req.query;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const admin = req.admin;
        const adminOrganizationID = admin.Organizations[0].id;

        // Fetch customer visit data for the last week
        const customerVisits = await Customer_Visit.findAll({
            where: {
                organization_id: adminOrganizationID,
                visit_date: {

                    [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
                }
            },
            include: [
                {
                    model: Customer,
                    attributes: ['name', 'contact_number']
                }
            ],
        });

        // Process data to create prompt for GPT
        const visitsData = customerVisits.map(v => ({
            customerName: v.Customer.name,
            visitDate: v.visit_date,
            transactionAmount: v.transaction_amount,
            receivedLoyaltyPoint: v.received_loyalty_point,
            redeemLoyaltyPoint: v.redeem_loyalty_point
        }));

        const prompt = `Analyze the following customer visit data from the last week and provide business growth tips: ${JSON.stringify(visitsData)}. Include insights and actionable recommendations for improving customer engagement and increasing sales.Give me 5 Tips`;


        const suggestions = await chatgptModle(prompt);

        console.log('Weekly Business Suggestions:', suggestions);
        return res.render("admin/gptAnalysis/generateWeeklySuggestions.ejs", {
            totalPages: 1,
            currentPage: parseInt(page, 10) + 1,
            // totalItems: count,
            limit: parseInt(limit, 10),
            suggestions,
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            superAdmin: req.admin.is_superadmin,
            active: 101
        })

    } catch (error) {
        console.error('Error generating weekly suggestions:', error);
    }
};