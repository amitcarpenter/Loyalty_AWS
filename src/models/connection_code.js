'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class connection_code extends Model {
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

  connection_code.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    org_id: DataTypes.INTEGER,
    cashier_id: DataTypes.INTEGER,
    socket_id: DataTypes.INTEGER,
    code: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: StatusEnum,
      allowNull: false,
    },
    connection_route: DataTypes.STRING,
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
  
  }, {
    timestamps: false,
    sequelize,
    tableName: 'connection_code',
    modelName: 'connection_code',
  });
  return connection_code;
};