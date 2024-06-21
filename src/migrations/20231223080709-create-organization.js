'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Organization', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      business_name: {
        type: Sequelize.STRING
      },
      logo: {
        type: Sequelize.STRING
      },
      theme_color: {
        type: Sequelize.STRING
      },
      welcome_message:{
        type: Sequelize.STRING
      },
      instagram_handle: {
        type: Sequelize.STRING
      },
      facebook_handle: {
        type: Sequelize.STRING
      },
      subscription_id:{
        type: Sequelize.INTEGER
      },
      business_id:{
        type: Sequelize.STRING
      },
      trial_start_date:{
        type: Sequelize.DATE
      },
      trial_end_date:{
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Organization');
  }
};