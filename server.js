const http = require('http');
const app = require("./src/index")
const { sequelize } = require('./src/models');
const corn = require("./src/cron/cron");
const subscriptionCron = require('./src/cron/subscription.cron');
const cors = require('cors');
const {createSocketServer} = require("./src/socket/connection")
require('dotenv').config()
const port = process.env.PORT || 6008
const server = http.createServer(app)
createSocketServer(server);
process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err)
    process.exit(1) // mandatory (as per the Node.js docs)
})
app.use(cors());

server.listen(port, async () => {
    console.log(`Example app listening at http://localhost:${port}`)
    // sequelize.sync().then(() => { 
    //     console.log("Database connected")
    // }).catch((err) => {
    //     console.log("Database not connected", err)
    // })
})
