'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Customer', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      date_of_birth: {
        type: Sequelize.STRING
      },
      age: {
        type: Sequelize.STRING
      },
      contact_number: {
        type: Sequelize.STRING
      },
      total_loyalty_point: {
        type: Sequelize.INTEGER
      },
      overall_total_loyalty_point: {
        type: Sequelize.INTEGER
      },
      total_redeem_loyalty_point: {
        type: Sequelize.INTEGER
      },
      total_remaining_loyalty_point:{
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      token:{
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
    await queryInterface.dropTable('Customer');
  }
};