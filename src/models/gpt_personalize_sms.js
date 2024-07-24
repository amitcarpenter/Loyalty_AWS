'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GptPersonalizeSms extends Model {
    // Define associations here if needed
  }

  GptPersonalizeSms.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_contact_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    personalize_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    timestamps: true,
    sequelize,
    tableName: 'gpt_personalize_sms',
    modelName: 'GptPersonalizeSms',
  });

  // Define associations if any

  return GptPersonalizeSms;
};
