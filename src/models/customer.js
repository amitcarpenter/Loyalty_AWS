'use strict';
const {
  Model
} = require('sequelize');
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.hasMany(models.Customer_Visit, { foreignKey: 'customer_id' });
    }
  }
  Customer.init({
    name: DataTypes.STRING,
    date_of_birth: DataTypes.STRING,
    age: {
      type: Sequelize.VIRTUAL(Sequelize.fn('YEAR', Sequelize.col('date_of_birth'))), // Example for MySQL
      get() {
        if (this.date_of_birth === null) {
          return null; // Or any default value you prefer (e.g., "Unknown")
        }
        const today = new Date();
        const birthDate = new Date(this.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const month = today.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
    },
    contact_number: {
      type: DataTypes.STRING,
      unique: true, // Set this to true to make it unique
    },
    total_loyalty_point: DataTypes.INTEGER,
    overall_total_loyalty_point: DataTypes.INTEGER,
    total_redeem_loyalty_point: DataTypes.INTEGER,
    total_remaining_loyalty_point:DataTypes.INTEGER,
    status: DataTypes.STRING,
    organization_id:DataTypes.INTEGER,
    token: DataTypes.STRING,
  }, {
    sequelize,
    tableName: 'customer',
    modelName: 'Customer',
    paranoid: true
  });
  return Customer;
};