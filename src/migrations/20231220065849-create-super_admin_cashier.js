'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Super_Admin_Cashier', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      contact_number: {
        type: Sequelize.STRING
      },
      logo: {
        type: Sequelize.STRING
      },
      theme_color: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING
      },
      date_of_birth:{
        type: Sequelize.STRING
      },
      role_id:{
        type: Sequelize.INTEGER
      },
      token: {
        type: Sequelize.STRING
      },
      reset_token:{
        type: Sequelize.STRING
      },
      reset_token_expires:{
        type: Sequelize.DATE
      },
      stripe_customer_id:{
        type: Sequelize.STRING
      },
      trial_start_date:{
        type: Sequelize.DATE
      },
      trial_end_date:{
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      is_superadmin:{
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('Super_Admin_Cashier');
  }
};