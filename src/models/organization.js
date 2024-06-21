"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Organization extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Define association
      Organization.belongsTo(models.Subscription, {
        foreignKey: "subscription_id",
      });
      Organization.belongsToMany(models.Super_Admin_Cashier, {
        through: "Organization_User",
        foreignKey: "organization_id",
      });
      Organization.hasMany(models.Subscription, {
        foreignKey: "organization_id",
      });
      Organization.hasMany(models.Loyalty_Point_Rule, {
        foreignKey: "organization_id",
      });
      Organization.hasMany(models.Reward, { foreignKey: "organization_id" });
      Organization.hasMany(models.Promotion, { foreignKey: "organization_id" });
      // Organization model definition
      Organization.hasMany(models.Admin_Subscription, {
        foreignKey: "organization_id",
      });
    }
  }

  Organization.init(
    {
      business_name: DataTypes.STRING,
      logo: {
        type: DataTypes.STRING,
        get() {
          const image = this.getDataValue("logo");
          if (image) {
            return process.env.BACKEND_URL + "upload/" + image;
          } else {
            return null;
          }
        },
      },
      theme_color: DataTypes.STRING,
      welcome_message: DataTypes.STRING,
      instagram_handle: DataTypes.STRING,
      facebook_handle: DataTypes.STRING,
      subscription_id: DataTypes.INTEGER,
      business_id: DataTypes.STRING,
      trial_start_date: DataTypes.DATE,
      trial_end_date: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "organization",
      modelName: "Organization",
      paranoid: true,
    }
  );
  return Organization;
};
