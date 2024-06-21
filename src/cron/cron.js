const {
  Promotion,
  Customer,
  sms_details,
  Subscription,
  Organization,
} = require("../models");
const cron = require("node-cron");
const { connection } = require("../utils/constantwords");
const { twilio_Auth } = require("../utils/constantwords");
const client = require("twilio")(twilio_Auth.accountSid, twilio_Auth.authToken);
const { Op, Sequelize } = require("sequelize");
const momentTimezone = require("moment-timezone");
// Set time zone to GMT-6 (Central Standard Time)
const now = momentTimezone().tz("GMT-6");
console.log("Current date and time in GMT-6 time zone", now.format()); // Current date and time in GMT-6 time zone
// const currentDateGMTMinus6 = moment().tz('GMT-6').format('YYYY-MM-DD');
const currentDate = momentTimezone().tz("America/Chicago").format("YYYY-MM-DD");

// cron.schedule("*/10 * * * *", sendSMSJOB);
// cron.schedule('0 * * * *', sendSMSJOB);
// cron.schedule("* * * * *", sendSMSJOB);

forwardEmail: async () => {
  try {
    // let limit =100
    let PromotionList;
    let options = {
      // attributes: ["id", "name", "email", "password", "date_of_birth","image","contact_number"],
      distinct: true,
      // offset: page * limit,
      // limit: limit,
      order: [["id", "DESC"]],
      status: connection.status,
      // where: {organization_id:adminOraganizationID}
    };
    PromotionList = await Promotion.findAndCountAll(options);
    console.log("PromotionList", PromotionList);
  } catch (error) {
    console.log("error", error);
  }
  console.log("Cron job executed every minute!");
};

// forwardEmail();
async function updateSmsStatus() {
  const SMS_DETAILS = await sms_details.findAll({
    where: {
      ms_status: "queued",
    },
  });
  // let index = 0;  // Initialize the index outside the loop

  async function updateStatus() {
    let index = 0;

    while (index < SMS_DETAILS.length) {
      try {
        let sms_id = SMS_DETAILS[index].dataValues.sms_id;
        const updatedMessage = await client.messages(sms_id).fetch();

        if (promotionInfo && promotionInfo.Organization) {
          const orgSubscription = await sms_details.findOne({
            where: { sms_id: updatedMessage.sid },
          });
          if (orgSubscription) {
            await orgSubscription.update({
              ms_status: updatedMessage.status,
              status: 1,
            });
            console.log("Status updated successfully");
          } else {
            console.log("Org_Subscription not found");
          }
        }

        console.log(`Updated Message Status: ${updatedMessage.status}`);
      } catch (error) {
        console.error(
          `Error fetching or updating message status: ${error.message}`
        );
      }
      // Increment the index inside the loop body
      index++;
    }
  }

  // Call the asynchronous function
  // updateStatus();
}

async function sendSMSJOB(req, res, next) {
  try {
    let Sendedemail = 0;
    let PromotionList;
    let options = {
      distinct: true,
      order: [["id", "DESC"]],
      status: connection.status,
      where: {
        start_date: {
          [Op.gte]: currentDate,
        },
      },
    };

    PromotionList = await Promotion.findAndCountAll(options);
    console.log("PromotionList---------", PromotionList);
    // return res.json(PromotionList)
    if (PromotionList) {
      let PromotionRows = PromotionList.rows;
      console.log("PromotionRows", PromotionRows);
      // return res.json(PromotionRows)
      try {
        let Org_Subscription;
        for (let i = 0; i < PromotionRows.length; i++) {
          console.log("PromotionRows.length----", i);
          if (PromotionRows[i] && PromotionRows[i].dataValues) {
            let promotionInfo = PromotionRows[i].dataValues;
            console.log("promotionInfo", promotionInfo);
            console.log(
              "promotionInfo organizationid----------",
              promotionInfo.organization_id
            );
            // console.log("PromotionList id ---------",PromotionList.rows.id);
            if (promotionInfo) {
              const usersList = await Customer.findAll({
                where: {
                  organization_id: promotionInfo.organization_id,
                },
              });
              // return res.json(usersList)
              if (usersList) {
                console.log("usersList", usersList);
                console.log("promotionInfo.id =====", promotionInfo.id);
                const checkUsers = await sms_details.findAll({
                  where: {
                    organization_id: promotionInfo.organization_id,
                    promotion_id: promotionInfo.id,
                  },
                });
                console.log(
                  "checkUsers---------------------------",
                  checkUsers
                );
                // return res.json(checkUsers)
                let removedData = usersList.filter(
                  (obj1) =>
                    !checkUsers.some(
                      (obj2) =>
                        obj1.dataValues.id === obj2.dataValues.customer_id
                    )
                );
                console.log("removedData-----", removedData);
                //Users list loop fo ms send
                let Sendedemail = 0; // Initialize the variable
                for (let j = 0; j < removedData.length; j++) {
                  if (removedData[j] && removedData[j].dataValues) {
                    let user = removedData[j].dataValues;
                    console.log("sending email", user);
                    try {
                      try {
                        await client.messages
                          .create({
                            body:
                              promotionInfo && promotionInfo.message
                                ? promotionInfo.message
                                : "",
                            from: twilio_Auth.from,
                            to: `+91${user.contact_number}`,
                          })
                          .then(async (message) => {
                            console.log("user", user);
                            // insert sms-details
                            await sms_details
                              .create({
                                customer_id: user.id,
                                organization_id: user.organization_id,
                                // subscription_id: promotionInfo.Organization.dataValues.subscription_id,
                                promotion_id: promotionInfo.id,
                                sms_id: message.sid,
                                sended_message: promotionInfo.message,
                                ms_status:
                                  message &&
                                  message.status &&
                                  message.status === "queued"
                                    ? "Sended"
                                    : message.status,
                                status: 0,
                              })
                              .then((insertedSms) => {
                                Sendedemail++;
                                // The 'insertedSms' variable now holds the inserted data
                                console.log("Data inserted:", insertedSms);
                              })
                              .catch((error) => {
                                // Handle any errors that occurred during the insertion
                                console.error("Error inserting data:", error);
                              });
                            // console.log(`insertSms ${insertSms} Message SID: ${message.sid}, Status: ${message.status}`);

                            // Check if the message was delivered successfully
                            if (message.status === "delivered") {
                              console.log("Message delivered successfully!");
                              // Your additional logic for a delivered message can go here
                            } else {
                              setTimeout(() => {
                                client
                                  .messages(message.sid)
                                  .fetch()
                                  .then(async (updatedMessage) => {
                                    if (
                                      promotionInfo &&
                                      promotionInfo.Organization
                                    ) {
                                      const orgSubscription =
                                        await sms_details.findOne({
                                          where: { sms_id: message.sid },
                                        });
                                      // Check if the Org_Subscription was found
                                      if (orgSubscription) {
                                        // Update the status
                                        await orgSubscription.update({
                                          ms_status: updatedMessage.status,
                                          status: 1,
                                        }); // Replace 'newStatus' with the desired status
                                        console.log(
                                          "Status updated successfully"
                                        );
                                      } else {
                                        console.log(
                                          "Org_Subscription not found"
                                        );
                                      }
                                      // jk47 ? restun sub not found
                                    }
                                    console.log(
                                      `Updated Message Status: ${updatedMessage.status}`
                                    );
                                    // Handle the updated status as needed
                                  })
                                  .catch((error) => {
                                    console.error(
                                      `Error fetching updated message status: ${error.message}`
                                    );
                                  });
                              }, 5000);
                              console.log(`Message status: ${message.status}`);
                              // Handle other statuses if needed
                            }
                          })
                          .catch(async (error) => {
                            console.error(
                              `Error sending SMS: ${user.id}:${user.contact_number}: ${error.message}`
                            );
                            // Update the status of the user with error
                            await sms_details
                              .create({
                                customer_id: user.id,
                                organization_id: user.organization_id,
                                promotion_id: promotionInfo.id,
                                sms_id: null,
                                sended_message: promotionInfo.message,
                                ms_status: "Not Sended (invalid region number)",
                                status: 0,
                                // error_message: error.message
                              })
                              .then((insertedSms) => {
                                console.log(
                                  "Error Data inserted:",
                                  insertedSms
                                );
                              })
                              .catch((error) => {
                                console.error(
                                  "Error inserting error data:",
                                  error
                                );
                              });
                          });
                      } catch (error) {
                        console.error(
                          `Error sending SMS to ${user.id}:`,
                          error.message
                        );
                      }
                    } catch (error) {
                      console.log("error in send mail", error);
                    }
                    // console.log('Printed after 10 seconds',j,'removedData',user.contact_number);
                  }
                }
              }
            }
          }
          if (i === PromotionRows.length - 1) {
            console.log("CRON IS COMPLEETED");
            console.log(
              `FOR Promotion =",PromotionRows.length`,
              PromotionRows.length
            );
            console.log(`'Email sended',Sendedemail`, Sendedemail);
            // Additional code to execute when at the last iteration
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  } catch (error) {
    console.log("error", error);
  }
}

module.exports = {
  sendSMSJOB,
};
