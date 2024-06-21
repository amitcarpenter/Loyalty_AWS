'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Organization_User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Organization_User.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
      });
      Organization_User.belongsTo(models.Super_Admin_Cashier, {
        foreignKey: 'super_admin_cashier_id',
      });
    }
  }
  Organization_User.init({
    super_admin_cashier_type: DataTypes.STRING,
    super_admin_cashier_id: DataTypes.INTEGER,
    organization_id: DataTypes.INTEGER
  }, {
    sequelize,
    tableName:'organization_user',
    modelName: 'Organization_User',
    paranoid: true
  });
  return Organization_User;
};