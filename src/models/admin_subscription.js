"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Admin_Subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Admin_Subscription.belongsTo(models.Subscription, {
        foreignKey: "subscription_id",
      });
      Admin_Subscription.belongsTo(models.Super_Admin_Cashier, {
        foreignKey: "admin_id",
      });
      // Admin_Subscription model definition
      Admin_Subscription.belongsTo(models.Organization, {
        foreignKey: "organization_id",
      });
    }
  }
  Admin_Subscription.init(
    {
      admin_id: DataTypes.INTEGER,
      organization_id: DataTypes.INTEGER,
      subscription_id: DataTypes.INTEGER,
      stripe_customer_id: DataTypes.STRING,
      stripe_plan_price_id: DataTypes.STRING,
      stripe_plan_id: DataTypes.STRING,
      stripe_payment_id: DataTypes.STRING,
      stripe_card_token: DataTypes.STRING,
      stripe_subscription_id: DataTypes.STRING,
      default_paymnet_method: DataTypes.STRING,
      default_source: DataTypes.STRING,
      paid_amount: DataTypes.STRING,
      paid_amount_currency: DataTypes.STRING,
      plan_interval: DataTypes.STRING,
      plan_interval_count: DataTypes.INTEGER,
      customer_care: DataTypes.STRING,
      customer_email: DataTypes.STRING,
      customer_address: DataTypes.STRING,
      postal_code: DataTypes.INTEGER,
      customer_city: DataTypes.STRING,
      customer_state: DataTypes.STRING,
      plan_period_start: DataTypes.DATE,
      plan_period_end: DataTypes.DATE,
      cancel_at_period_end: DataTypes.BOOLEAN,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "admin_subscription",
      modelName: "Admin_Subscription",
      paranoid: true,
    }
  );
  return Admin_Subscription;
};
