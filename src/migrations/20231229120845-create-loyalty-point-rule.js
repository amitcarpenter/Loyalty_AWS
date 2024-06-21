'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Loyalty_Point_Rule', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      organization_id: {
        type: Sequelize.INTEGER
      },
      start_transaction_amount: {
        type: Sequelize.INTEGER
      },
      end_transaction_amount: {
        type: Sequelize.INTEGER
      },
      loyalty_point: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      organization_id:{
        type: Sequelize.INTEGER
      },
      type:{
        type: Sequelize.STRING
      },
      loyalty_point: {
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
    await queryInterface.dropTable('Loyalty_Point_Rule');
  }
};