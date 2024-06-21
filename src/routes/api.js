const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/admin.auth.js");
const multer = require('../middleware/file.upload.js');
const controller = require('../controller/api/index.js');
const singleImage = multer.upload.single("image");
const logoImage = multer.upload.single("logo");

// CustomerController
router.post("/customer/login", controller.CustomerController.customerLogin); //changes done
router.post("/customer/signup", controller.CustomerController.customerSignUp); //no change
router.post('/customer/businessID',controller.CustomerController.checkBusinessID);//no change

//userinfo
router.post("/customer/userinfo", controller.CustomerController.customerinfo); // changes done

//cashiercontroller 
router.post("/cashier/login", controller.CashierController.cashierLogin); // changes done
router.post("/cashier/userinfo", controller.CashierController.customerinfo); //changes done

//rewardcontroller
router.post('/reward/getAll',controller.RewardController.getAllReward); // no change
router.post('/reward/redeem',controller.RewardController.getRedeemReward); // changes done

//loyaltypointcontroller
router.post("/loyalty/transaction",controller.LoyaltyPointController.getRedeemLoyaltyPoints) // small change organization id in customer findone query
router.post("/loyalty/getLoyaltyPoints",controller.LoyaltyPointController.getLoyaltyPoints) // small change organization id in customer findone query

module.exports = router;