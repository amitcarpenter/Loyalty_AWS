'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subscription', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      currency: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.INTEGER
      },
      subscription_type: {
        type: Sequelize.STRING
      },
      trial_period: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      stripe_product_id: {
        type: Sequelize.STRING
      },
      stripe_price_id:{
        type: Sequelize.STRING
      },
      stripe_plan_id:{
        type: Sequelize.STRING
      },
      organization_id:{
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subscription');
  }
};