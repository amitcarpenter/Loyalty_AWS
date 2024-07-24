'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SingleUseOffer extends Model {

    }

    SingleUseOffer.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        offer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        customer_id: {
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
        },
    }, {
        timestamps: true,
        sequelize,
        tableName: 'single_use_offers',
        modelName: 'SingleUseOffer',
    });

    SingleUseOffer.associate = function (models) {
        SingleUseOffer.belongsTo(models.Customer, { foreignKey: 'customer_id' });
    };

    return SingleUseOffer;

};
