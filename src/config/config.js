
const config = {
  development: {
    username:"root",
    password:"root",
    database: "loyalty_aws",
    // port: process.env.DEVELOPMENT_PORT,
    host: "localhost",
    dialect: "mysql",
  },
  test: {
    username: "loyaltydb",
    password: "fttrisha@!123",
    database: "loyalty",
    host: "localhost",
    dialect: "mysql",
    // dialectOptions: {
    //  useUTC: false,
    // },
    // timezone: "-06:00",
    // for india timezone
    // timezone: "+05:30",
  },
  production: {
    username: process.env.PRODUCTION_USERNAME,
    password: process.env.PRODUCTION_PASSWORD,
    database: process.env.PRODUCTION_DATABASE,
    host: process.env.PRODUCTION_HOST,
    dialect: process.env.PRODUCTION_DIALECT,
  },
};

module.exports = config;
