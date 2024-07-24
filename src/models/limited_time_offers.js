'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LimitedTimeOffer extends Model {
    // Define associations here
  }

  LimitedTimeOffer.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    discount_percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
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
    tableName: 'limited_time_offers',
    modelName: 'LimitedTimeOffer',
  });

  // Define associations if any (e.g., linking to Customer or Product)

  return LimitedTimeOffer;
};
``
