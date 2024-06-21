'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Otp.init({
    super_admin_id: DataTypes.INTEGER,
    user_id: DataTypes.STRING,
    otp: DataTypes.STRING,
    type: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    tableName: "otp",
    modelName: 'Otp',
    paranoid: true
  });
  return Otp;
};