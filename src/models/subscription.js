'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Subscription.hasOne(models.Organization, { foreignKey: "subscription_id" });
      Subscription.hasMany(models.Admin_Subscription, { foreignKey: "subscription_id" });
      // Subscription.belongsToMany(models.Super_Admin_Cashier, {
      //   through: "User_Subscription",
      //   foreignKey: 'super_admin_cashier_id',
      //   sourceKey: "id",
      // });
      
      // Subscription.hasMany(models.Transaction_History, { foreignKey: 'subscription_id' });
      // Subscription.belongsToMany(models.Organization, { through: 'Organization_Subscription', foreignKey: 'subscription_id' });
      // Subscription.belongsTo(models.User_Subscription, { foreignKey: 'subscription_id' });
      // Subscription.hasMany(models.Super_Admin_Cashier, { foreignKey: 'super_admin_cashier_id' });
    }
  }
  Subscription.init({
    name: DataTypes.STRING,
    description:DataTypes.STRING,
    currency: DataTypes.STRING,
    price: DataTypes.INTEGER,
    subscription_type: DataTypes.STRING,
    trial_period: DataTypes.STRING,
    status: DataTypes.STRING,
    stripe_product_id: DataTypes.STRING,
    stripe_price_id:DataTypes.STRING,
    stripe_plan_id:DataTypes.STRING,
    organization_id:DataTypes.INTEGER
  }, {
    sequelize,
    tableName: 'subscription',
    modelName: 'Subscription',
    paranoid: true
  });
  return Subscription;
};