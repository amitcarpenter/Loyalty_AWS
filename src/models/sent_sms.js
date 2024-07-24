'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sent_SMS extends Model {
    static associate(models) {
      Sent_SMS.belongsTo(models.Customer, { foreignKey: 'customer_id' });
    //   Sent_SMS.belongsTo(models.SmsOffer, { foreignKey: 'offer_id' });
    }
  }

  Sent_SMS.init({
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'id'
      }
    },
    offer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SmsOffer',
        key: 'id'
      }
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
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
    tableName: 'sent_sms',
    modelName: 'Sent_SMS',
    paranoid: true
  });

  return Sent_SMS;
};
