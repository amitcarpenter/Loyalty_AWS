'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_subscription', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      admin_id: {
        type: Sequelize.INTEGER
      },
      organization_id: {
        type: Sequelize.INTEGER
      },
      subscription_id: {
        type: Sequelize.INTEGER
      },
      stripe_customer_id: {
        type: Sequelize.STRING
      },
      stripe_plan_price_id: {
        type: Sequelize.STRING
      },
      stripe_plan_id: {
        type: Sequelize.STRING
      },
      stripe_payment_id: {
        type: Sequelize.STRING
      },
      stripe_card_token: {
        type: Sequelize.STRING
      },
      stripe_subscription_id: {
        type: Sequelize.STRING
      },
      default_paymnet_method: {
        type: Sequelize.STRING
      },
      default_source: {
        type: Sequelize.STRING
      },
      paid_amount: {
        type: Sequelize.STRING
      },
      paid_amount_currency: {
        type: Sequelize.STRING
      },
      plan_interval: {
        type: Sequelize.STRING
      },
      plan_interval_count: {
        type: Sequelize.INTEGER
      },
      customer_care: {
        type: Sequelize.STRING
      },
      customer_email: {
        type: Sequelize.STRING
      },
      customer_address: {
        type: Sequelize.STRING
      },
      postal_code: {
        type: Sequelize.INTEGER
      },
      customer_city: {
        type: Sequelize.STRING
      },
      customer_state: {
        type: Sequelize.STRING
      },
      plan_period_start: {
        type: Sequelize.DATE
      },
      plan_period_end: {
        type: Sequelize.DATE
      },
      cancel_at_period_end: 
      {
        type: Sequelize.BOOLEAN
      },
      status: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('admin_subscription');
  }
};