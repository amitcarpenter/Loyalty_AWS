'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Reward.belongsTo(models.Organization, { foreignKey: 'organization_id' });
    }
  }
  Reward.init({
    title: DataTypes.STRING,
    image:DataTypes.STRING,
    loyalty_point: DataTypes.INTEGER,
    start_date: DataTypes.STRING,
    end_date: DataTypes.STRING,
    status: DataTypes.STRING,
    organization_id : DataTypes.INTEGER
  }, {
    sequelize,
    tableName:'reward',
    modelName: 'Reward',
    paranoid: true
  });
  return Reward;
};