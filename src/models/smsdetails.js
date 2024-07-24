'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sms_details extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // static associate(models) {
    //   // define association here
    //   connection_code.hasMany(models.Customer_Visit, { foreignKey: 'customer_id' });
    // }
  }
  const StatusEnum = ['0', '1']; // Add your desired status values

  sms_details.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: DataTypes.INTEGER,
    organization_id: DataTypes.INTEGER,
    subscription_id: DataTypes.INTEGER,
    promotion_id: DataTypes.INTEGER,
    sms_id: DataTypes.STRING,
    sended_message: DataTypes.STRING,
    ms_status: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: StatusEnum,
      allowNull: false,
    }  
  }, {
    timestamps: false,
    sequelize,
    tableName: 'sms_details',
    modelName: 'sms_details',
  });
  return sms_details;
};