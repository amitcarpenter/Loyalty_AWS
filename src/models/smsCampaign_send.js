'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class smsCampaign_send extends Model {
    // Define associations here
  }

  smsCampaign_send.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sms_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sended_message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    send_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    timestamps: true,
    sequelize,
    tableName: 'smsCampaign_send',
    modelName: 'smsCampaign_send',
  });
  // In smsCampaign_send model file
  smsCampaign_send.associate = function (models) {
    smsCampaign_send.belongsTo(models.Customer, { foreignKey: 'customer_id' });
  };


  return smsCampaign_send;
};
