'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Campaign extends Model {
        static associate(models) {
            Campaign.belongsTo(models.Customer, { foreignKey: 'customer_id' });
            Campaign.hasMany(models.Campaign_Stats, { foreignKey: 'campaign_id' });
        }
    }
    Campaign.init({
        name: DataTypes.STRING,
        target_audience: DataTypes.STRING,
        message_content: DataTypes.TEXT,
        start_date: DataTypes.DATE,
        end_date: DataTypes.DATE,
        status: DataTypes.STRING,
        customer_id: DataTypes.INTEGER,
        organization_id: DataTypes.INTEGER
    }, {
        sequelize,
        tableName: 'campaign',
        modelName: 'Campaign',
        paranoid: true
    });
    return Campaign;
};
