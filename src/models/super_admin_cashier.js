'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Super_Admin_Cashier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Super_Admin_Cashier.hasMany(models.Organization_User, {
        foreignKey: 'super_admin_cashier_id',
      });
      Super_Admin_Cashier.belongsToMany(models.Organization, { through:"Organization_User", foreignKey: 'super_admin_cashier_id' });
      Super_Admin_Cashier.hasOne(models.Admin_Subscription, {
        foreignKey: 'admin_id' // Define the foreign key in Admin_Subscription table
      });
    }
  }
  Super_Admin_Cashier.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    contact_number: DataTypes.STRING,
    logo: {
      type: DataTypes.STRING,
      get() {
        const logo = this.getDataValue('logo');
        if (logo) {
          return process.env.BACKEND_URL + 'upload/' + logo;
        } else {
          return null
        }
      }
    },
    theme_color: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      get() {
        const image = this.getDataValue('image');
        if (image) {
          return process.env.BACKEND_URL + 'upload/' + image;
        } else {
          return null
        }
      }
    },
    date_of_birth:DataTypes.INTEGER,
    role_id:DataTypes.INTEGER,
    token: DataTypes.STRING,
    reset_token: DataTypes.STRING,
    reset_token_expires: DataTypes.DATE,
    stripe_customer_id:DataTypes.STRING,
    trial_start_date:DataTypes.DATE,
    trial_end_date:DataTypes.DATE,
    status:DataTypes.STRING,
    is_superadmin:DataTypes.BOOLEAN,
  },{
    sequelize,
    tableName:'super_admin_cashier',
    modelName:'Super_Admin_Cashier',
    paranoid: true
  });
  return Super_Admin_Cashier;
};