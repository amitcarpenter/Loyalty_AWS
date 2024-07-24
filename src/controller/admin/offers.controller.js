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


//=========================================== 7771874281 ==================================
exports.getCreateLimitedTimeOffer = async (req, res, next) => {
    try {
        const { error, message, formValue } = req.query;
        let admin = req.admin;
        let adminOrganizationID = admin.Organizations[0].id;
        let adminThemeColor = admin.Organizations[0].theme_color;
        let adminBusinessName = admin.Organizations[0].business_name;
        let superAdmin = admin.is_superadmin;

        return res.render('admin/offers/create.ejs', {
            title: 'Create New Limited-Time Offer',
            adminThemeColor,
            formValue,
            adminBusinessName,
            superAdmin,
            active: 40
        });
    } catch (error) {
        console.log('Error:', error);
        next(error);
    }
};


exports.postCreateLimitedTimeOffer = async (req, res, next) => {
    try {
        const { title, description, discount_percentage, start_date, end_date } = req.body;
        let admin = req.admin;
        let organization_id = admin.Organizations[0].id;

        let newOffer = await LimitedTimeOffer.create({
            title,
            description,
            discount_percentage,
            start_date,
            end_date,
            organization_id
        });
        return res.redirect("/admin/offers/list");
    } catch (err) {
        return res.render("admin/limitedTimeOffer/create.ejs", {
            title: 'Create New Limited-Time Offer',
            adminThemeColor: req.admin.Organizations[0].theme_color,
            adminBusinessName: req.admin.Organizations[0].business_name,
            error: err.message,
            formValue: req.body
        });
    }
};


exports.getAllOffers = async (req, res, next) => {
    try {
        const { page = 0, limit = 10, search_text } = req.query;
        let admin = req.admin;
        let adminOrganizationID = admin.Organizations[0].id;

        let options = {
            where: { organization_id: adminOrganizationID },
            offset: page * limit,
            limit: limit,
            order: [['id', 'DESC']]
        };

        if (search_text) {
            options.where.title = { [Op.like]: '%' + search_text + '%' };
        }

        let data = await LimitedTimeOffer.findAndCountAll(options);
        let response = utils.getPagingData(res, data, page + 1, limit);
        return res.render('admin/offers/list.ejs', {
            superAdmin: admin.is_superadmin,
            limit: 10,
            totalItems: response.totalItems,
            items: response.items,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            search_text: search_text,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name,
            active: 41
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteOffer = async (req, res, next) => {
    try {
        const { id } = req.params;

        let offer = await LimitedTimeOffer.findOne({ where: { id } });

        if (!offer) {
            return res.status(404).render('partials/404.ejs');
        }
        await offer.destroy();
        return res.redirect('/admin/offers/list');
    } catch (err) {
        next(err);
    }
};


exports.getOfferDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 0, limit = 10, search_text } = req.query;
        const admin = req.admin;
        const superAdmin = admin.is_superadmin;
        const adminOrganizationID = admin.Organizations[0].id;

        let offer = await LimitedTimeOffer.findOne({
            where: { id: id, organization_id: adminOrganizationID },
        });

        if (!offer) {
            return res.status(404).render("partials/404.ejs");
        }

        let offerRedeemed = [];
        try {
            offerRedeemed = await SingleUseOffer.findAll({
                where: { offer_id: id, organization_id: adminOrganizationID },
                include: [{
                    model: Customer,
                    attributes: ['name', 'contact_number'],
                    where: { organization_id: adminOrganizationID }
                }]
            });
        } catch (error) {
            console.error('Error fetching SingleUseOffer:', error);
        }

        console.log(offerRedeemed)
        console.log("****************8")
        console.log("****************8")
        console.log("****************8")
        console.log("****************8")
        console.log("****************8")
        console.log("****************8")
        console.log("****************8")
        console.log("****************8")

        return res.render("admin/offers/details.ejs", {
            superAdmin,
            active: 100,
            offer,
            offerRedeemed,
            adminThemeColor: admin.Organizations[0].theme_color,
            adminBusinessName: admin.Organizations[0].business_name
        });
    } catch (err) {
        next(err);
    }
};

exports.getEditOffer = async (req, res, next) => {
    try {
        const { id } = req.params;
        let admin = req.admin;
        let adminOrganizationID = admin.Organizations[0].id;

        // Fetch the offer details
        let offer = await LimitedTimeOffer.findOne({
            where: { id, organization_id: adminOrganizationID }
        });

        if (!offer) {
            return res.status(404).render('admin/404.ejs');
        }

        let adminThemeColor = admin.Organizations[0].theme_color;
        let adminBusinessName = admin.Organizations[0].business_name;
        let superAdmin = admin.is_superadmin;

        return res.render('admin/offers/edit.ejs', {
            title: 'Edit Offer',
            formValue: offer,
            adminThemeColor,
            adminBusinessName,
            superAdmin,
            active: 32 // Adjust as needed based on your design
        });
    } catch (error) {
        console.log('Error:', error);
        next(error);
    }
};

exports.updateOffer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, discount_percentage, start_date, end_date } = req.body;
        let offer = await LimitedTimeOffer.findOne({ where: { id } });
        if (!offer) {
            return res.status(404).render('partials/404.ejs');
        }

        // Update offer attributes
        offer.title = title;
        offer.description = description;
        offer.discount_percentage = discount_percentage;
        offer.start_date = start_date;
        offer.end_date = end_date;

        await offer.save();

        return res.redirect('/admin/offers/list');
    } catch (err) {
        next(err);
    }
};

exports.createSingleUseOffer = async (req, res, next) => {
    try {
        const singleUseOfferSchema = Joi.object({
            offer_id: Joi.number().integer().required(),
            customer_id: Joi.number().integer().required(),
            organization_id: Joi.number().integer().required()
        });
        const { error, value } = singleUseOfferSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
        }

        const { offer_id, customer_id, organization_id } = value;

        let newSingleUseOffer = await SingleUseOffer.create({
            offer_id,
            customer_id,
            organization_id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: 'Single-use offer created successfully',
            data: newSingleUseOffer
        });
    } catch (err) {
        console.error('Error creating single-use offer:', err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the single-use offer',
            error: err.message
        });
    }
}
