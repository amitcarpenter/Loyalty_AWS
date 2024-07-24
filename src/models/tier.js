'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TierSystem extends Model {
    static associate(models) {
      // Define association here
      TierSystem.belongsTo(models.Organization, { foreignKey: 'organization_id' });
      
    }
  }
  
  TierSystem.init({
    Gold: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Silver: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Bronze: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Organizations',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'TierSystem',
    tableName: 'tier_systems',
    timestamps: true,
    underscored: true,
    paranoid: true  // Enables soft deletes
  });

  return TierSystem;
};