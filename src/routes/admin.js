const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/admin.auth.js");
const subscriptionCheck = require("../middleware/subscription.auth.js");
const multer = require('../middleware/file.upload.js');
const controller = require('../controller/admin/index');
const singleImage = multer.upload.single("image");
const logoImage = multer.upload.single("logo");
const cron = require('../cron/cron.js')
const { join } = require('path');
const { sendSMSJOB } = require('../cron/cron.js');
const { subscriptionCheckCron } = require('../cron/subscription.cron.js');
router.get('/sendsms',sendSMSJOB)
router.post('/sendsms',sendSMSJOB)

router.get('/getsubscription',subscriptionCheckCron)
router.post('/getsubscription',subscriptionCheckCron)
// authcontroller
router.get("/login", controller.AuthController.getLogin);
router.post("/login", controller.AuthController.login);
router.get("/log-out",checkAuth,controller.AuthController.logOut);
router.get("/emails/forgot-password", controller.AuthController.GetforgotPasswordPage);
router.get("/emails/sendToken", controller.AuthController.SendforgotPasswordToken);
router.get("/reset/:token", controller.AuthController.resetPasswordApi);  //user confirmation
router.get("/emails/reset-password", controller.AuthController.resetAdminPasswordApi);  //user confirmation
// router.get("/emails/reset/:token", controller.AuthController.NavigateToresetPassword);

router.get("/forget-password", controller.AuthController.forgotPassword);
router.post("/forget-password",controller.AuthController.userForgotPassword)
router.get("/reset-password",controller.AuthController.resetPassword)
router.post("/reset-password",controller.AuthController.userResetPassword)

// download 
router.get('/customer/downloadCsv',checkAuth,subscriptionCheck,controller.CustomerController.downloadOrganizationCutomerCsv);
// dashboardcontroller
router.get('/superadmin/dashboard',checkAuth,controller.DashboardController.superAdminDashboard);
router.get('/dashboard',checkAuth,controller.DashboardController.adminDashboard);

// admincontroller
router.get('/create', checkAuth,controller.AdminController.getCreateAdmin);
router.post('/create',checkAuth,logoImage,checkAuth, controller.AdminController.createAdmin);
router.get('/list',checkAuth, controller.AdminController.getAdmin);
router.get('/edit/:id',checkAuth, controller.AdminController.editAdmin);
router.post('/update/:id',checkAuth, logoImage, controller.AdminController.updateAdmin);
router.get('/delete/:id',checkAuth, controller.AdminController.deleteAdmin);

//cashiercontroller
router.get('/cashier/create',checkAuth,subscriptionCheck, controller.CashierController.getCreateCashier);
router.post('/cashier/create',checkAuth,subscriptionCheck,singleImage,controller.CashierController.createCashier);
router.get('/cashier/list',checkAuth,subscriptionCheck, controller.CashierController.getCashier);
router.get('/cashier/edit/:id',checkAuth,subscriptionCheck, controller.CashierController.editCashier);
router.post('/cashier/update/:id',checkAuth,subscriptionCheck,singleImage,controller.CashierController.updateCashier);
router.get('/cashier/delete/:id',checkAuth,subscriptionCheck, controller.CashierController.deleteCashier);

// LoyaltyPointController
router.get('/loyalty/create',checkAuth,subscriptionCheck,controller.LoyaltyPointController.getCreateLoyaltyPoint);
router.post('/loyalty/create',checkAuth,subscriptionCheck,controller.LoyaltyPointController.createLoyaltyPoint);
router.get('/loyalty/list',checkAuth,subscriptionCheck,controller.LoyaltyPointController.getLoyaltyPoint);
router.get('/loyalty/edit/:id',checkAuth,subscriptionCheck,controller.LoyaltyPointController.editLoyaltyPoint);
router.post('/loyalty/update/:id',checkAuth,subscriptionCheck,controller.LoyaltyPointController.updateLoyaltyPoint);
router.get('/loyalty/delete/:id',checkAuth,subscriptionCheck,controller.LoyaltyPointController.deleteLoyaltyPoint);

// Point Per Dollar
router.post('/loyalty/pointperdollar/create',controller.LoyaltyPointController.upsertPointPerDollar);
router.get('/loyalty/pointperdollar',checkAuth,subscriptionCheck,controller.LoyaltyPointController.showUpsertPointPerDollarPage);


//RewardController
router.get('/reward/create',checkAuth,subscriptionCheck,controller.RewardController.getCreateReward);
router.post('/reward/create',checkAuth,subscriptionCheck,controller.RewardController.createReward);
router.get('/reward/list',checkAuth,subscriptionCheck,controller.RewardController.getReward);
router.get('/reward/edit/:id',checkAuth,subscriptionCheck,controller.RewardController.editReward);
router.post('/reward/update/:id',checkAuth,subscriptionCheck,controller.RewardController.updateReward);
router.get('/reward/delete/:id',checkAuth,subscriptionCheck,controller.RewardController.deleteReward);

// PromotionController
router.get('/promotion/create',checkAuth,subscriptionCheck,controller.PromotionController.getCreatePromotion);
router.post('/promotion/create',checkAuth,subscriptionCheck,controller.PromotionController.createPromotion);
router.get('/promotion/list',checkAuth,subscriptionCheck,controller.PromotionController.getPromotion);
router.get('/promotion/edit/:id',checkAuth,subscriptionCheck,controller.PromotionController.editPromotion);
router.get('/promotion/viewSmsList/:id',checkAuth,subscriptionCheck,controller.PromotionController.pramotionSmsList);
router.post('/promotion/update/:id',checkAuth,subscriptionCheck,controller.PromotionController.updatePromotion);
router.get('/promotion/delete/:id',checkAuth,subscriptionCheck,controller.PromotionController.deletePromotion);
router.post('/promotion/sendsms',controller.PromotionController.sendSmsApi)

// CustomerController
router.get('/customer/list',checkAuth,subscriptionCheck,controller.CustomerController.getCustomer);
router.get('/customer/detail/:id',checkAuth,subscriptionCheck,controller.CustomerController.getCustomerDetail);
router.get('/edit-customer/:id',checkAuth,subscriptionCheck,controller.CustomerController.editCustomer);
router.post('/customer/update/:id',checkAuth,subscriptionCheck,controller.CustomerController.updateCustomer);

// SettingController
router.get('/setting',checkAuth,subscriptionCheck,controller.SettingController.getSetting);
router.get('/setting/edit/:id',checkAuth,subscriptionCheck,controller.SettingController.editSetting);
router.post('/setting/update/:id',checkAuth,subscriptionCheck,logoImage,controller.SettingController.updateSetting);

// Login as Admin 
router.get('/login-SuperAdmin-as-admin/:admin_id',checkAuth,controller.AdminController.loginAsAdmin);
//subscriptioncontroller
router.get('/subscription/create',checkAuth,controller.SubscriptionController.getCreateSubscription);
router.post('/subscription/create',checkAuth,controller.SubscriptionController.createSubscription);
router.get('/subscription/list',checkAuth,controller.SubscriptionController.getSubscription);
router.get('/subscription/edit/:id',checkAuth,controller.SubscriptionController.editSubscription);
router.post('/subscription/update/:id',checkAuth,controller.SubscriptionController.updateSubscription);
router.get('/subscription/delete/:id',checkAuth,controller.SubscriptionController.deleteSubscription);
router.get('/available/subscription/list',checkAuth,controller.SubscriptionController.getAdminSubscriptions);
router.get('/purchase/subscription/:id',checkAuth,controller.SubscriptionController.getAdminPurchaseSubscription);
router.post('/purchase/subscription/:id',checkAuth,controller.SubscriptionController.postProcessSubscription);
router.post('/cencelpurchase/subscription/:stripe_subscription_id',checkAuth,controller.SubscriptionController.cencelProcessSubscription);
router.post('/webhook',controller.SubscriptionController.subscriptionWebhook);

module.exports = router;