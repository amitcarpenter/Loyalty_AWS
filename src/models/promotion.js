'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Promotion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Promotion.belongsTo(models.Organization, { foreignKey: 'organization_id' });
    }
  }
  Promotion.init({
    message: DataTypes.STRING,
    age: DataTypes.STRING,
    start_date: DataTypes.DATE,
    status: DataTypes.STRING,
    organization_id:DataTypes.INTEGER
  }, {
    sequelize,
    tableName: "promotion",
    modelName: 'Promotion',
    paranoid: true
  });
  return Promotion;
};