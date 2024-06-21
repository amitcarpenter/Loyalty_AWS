'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Loyalty_Point_Rule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Loyalty_Point_Rule.belongsTo(models.Organization, { foreignKey: 'organization_id' });
    }
  }
  Loyalty_Point_Rule.init({
    organization_id: DataTypes.INTEGER,
    start_transaction_amount: DataTypes.INTEGER,
    end_transaction_amount: DataTypes.INTEGER,
    loyalty_point: DataTypes.STRING,
    status:DataTypes.STRING,
    organization_id:DataTypes.INTEGER
  }, {
    sequelize,
    tableName:'loyalty_point_rule',
    modelName: 'Loyalty_Point_Rule',
    paranoid: true
  });
  return Loyalty_Point_Rule;
};