'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer_Visit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer_Visit.belongsTo(models.Customer, { foreignKey: 'customer_id' });
    }
  }
  Customer_Visit.init({
    customer_id: DataTypes.INTEGER,
    visit_date: DataTypes.STRING,
    transaction_amount: DataTypes.STRING,
    received_loyalty_point: DataTypes.INTEGER,
    redeem_loyalty_point: DataTypes.INTEGER,
    organization_id:DataTypes.INTEGER
  }, {
    sequelize,
    tableName:'customer_visit',
    modelName: 'Customer_Visit',
    paranoid: true
  });
  return Customer_Visit;
};