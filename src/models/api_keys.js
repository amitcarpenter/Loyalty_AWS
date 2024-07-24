'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class API_Key extends Model {
    // Define associations here if necessary
  }

  API_Key.init({
    service_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'api_keys',
    modelName: 'API_Key',
    paranoid: true
  });

  return API_Key;
};
