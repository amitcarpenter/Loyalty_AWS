'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Trend_Report extends Model {
        // Define associations here if necessary
    }

    Trend_Report.init({
        report_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        report_data: {
            type: DataTypes.TEXT,
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
        tableName: 'trend_reports',
        modelName: 'Trend_Report',
        paranoid: true
    });

    return Trend_Report;
};
