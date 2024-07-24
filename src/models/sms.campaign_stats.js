'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Campaign_Stats extends Model {
        static associate(models) {
            Campaign_Stats.belongsTo(models.Campaign, { foreignKey: 'campaign_id' });
        }
    }
    Campaign_Stats.init({
        campaign_id: DataTypes.INTEGER,
        total_sms_sent: DataTypes.INTEGER,
        sms_delivered: DataTypes.INTEGER,
        offers_redeemed: DataTypes.INTEGER,
        conversion_rate: DataTypes.FLOAT,
        organization_id: DataTypes.INTEGER
    }, {
        sequelize,
        tableName: 'campaign_stats',
        modelName: 'Campaign_Stats',
        paranoid: true
    });
    return Campaign_Stats;
};
