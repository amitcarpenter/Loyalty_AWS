const momentTimezone = require('moment-timezone');
// Set time zone to GMT-6 (Central Standard Time)
const now = momentTimezone().tz('GMT-6');
console.log("Current date and time in GMT-6 time zone",now.format()); // Current date and time in GMT-6 time zone
// const currentDateGMTMinus6 = moment().tz('GMT-6').format('YYYY-MM-DD');
const currentDate = momentTimezone().tz('America/Chicago').format('YYYY-MM-DD');
console.log("currentDateGMTMinus6---------",currentDate); 

module.exports = {
    currentDate
}