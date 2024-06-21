// "use strict";

// /** @type {import('sequelize-cli').Migration} */
// const bcrypt = require("bcrypt");
// module.exports = {
//   async up(queryInterface, Sequelize) {
//     let hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
//     await queryInterface.bulkInsert("super_admin_cashier", [
//       {
//         name: "Super Admin",
//         email: process.env.ADMIN_MAIL,
//         password: hash,
//         role_id: false,
//         status: "ACTIVE",
//         createdAt: Sequelize.literal("CURRENT_TIMESTAMP"),
//         updatedAt: Sequelize.literal("CURRENT_TIMESTAMP"),
//       },
//     ]);
//   },

//   async down(queryInterface, Sequelize) {
//     await queryInterface.bulkDelete("super_admin_cashier", null, {});
//   },
// };



"use strict";

/** @type {import('sequelize-cli').Migration} */
const bcrypt = require("bcrypt");
require('dotenv').config();  // Ensure this line is included at the top to load .env variables

module.exports = {
  async up(queryInterface, Sequelize) {
    // Log environment variables to ensure they are set
    console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);
    console.log('ADMIN_MAIL:', process.env.ADMIN_MAIL);
    
    // Error handling for missing environment variables
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_MAIL) {
      throw new Error("ADMIN_PASSWORD and ADMIN_MAIL environment variables are required.");
    }

    let hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await queryInterface.bulkInsert("super_admin_cashier", [
      {
        name: "Super Admin",
        email: process.env.ADMIN_MAIL,
        password: hash,
        role_id: false,
        status: "ACTIVE",
        createdAt: Sequelize.literal("CURRENT_TIMESTAMP"),
        updatedAt: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("super_admin_cashier", null, {});
  },
};
