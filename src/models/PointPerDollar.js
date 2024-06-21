'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PointPerDollar extends Model {
    static associate(models) {
      // Define associations if necessary
    }
  }
  PointPerDollar.init({
    pointPerDollarNumber: {
      type: DataTypes.INTEGER,
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
    }
  }, {
    sequelize,
    tableName: 'point_per_dollar',
    modelName: 'PointPerDollar',
    timestamps: true,
    paranoid: true // if you want soft deletes
  });
  return PointPerDollar;
};
