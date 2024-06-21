var nodemailer = require("nodemailer");
const {
  VERIFY_EMAIL,
  FORGOT_PASSWORD,
  TOURNAMENT_REGISTER,
  CREDENTIAL,
} = require("./constants");
const { Hole } = require("../models");
const ejs = require("ejs");
var path = require("path");
const crypto = require("crypto");
const algorithm = process.env.ALGORITHM;
const secret_key = "secretKey";
const secret_iv = "secretIV";
const ecnryption_method = "aes-256-cbc";
const key = crypto
  .createHash("sha512")
  .update(secret_key)
  .digest("hex")
  .substring(0, 32);

const encryptionIV = crypto
  .createHash("sha512")
  .update(secret_iv)
  .digest("hex")
  .substring(0, 16);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVICE_HOST,
  port: process.env.SMTP_SERVICE_PORT,
  secure: process.env.SEND_EMAIL,
  auth: {
    user: process.env.SMTP_USER_NAME,
    pass: process.env.SMTP_USER_PASSWORD,
  },
});
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_SERVICE_HOST,
  port: process.env.SMTP_SERVICE_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER_NAME,
    pass: process.env.SMTP_USER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
module.exports = {
  adminError(message, firebaseToken) {
    console.log(err);
    req.flash("formValue", req.body);
    req.flash("error", res.locals.__(err.message));
    return res.redirect(req.header("Referer"));
  },
  getPagingData(res, data, page, limit) {
    const { count: totalItems, rows: items } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);
    return { totalItems, items, totalPages, currentPage };
  },
  getcookie(req) {
    var cookie = req.cookies;
    if (cookie) {
      if (Object.keys(cookie).includes("dd-user")) {
        return cookie["dd-user"];
      } else {
        return false;
      }
    }
  },
  getcookieAdmin(req) {
    var cookie = req.cookies;
    if (cookie) {
      if (Object.keys(cookie).includes("dd-token")) {
        return cookie["dd-token"];
      } else {
        return false;
      }
    }
  },
  async sendCredentialMail(data, adminPassword, businessId, businessName) {
    console.log("data.email", data.email);
    let adminEmail = data.email;
    console.log("businessName", businessName);
    console.log("adminPassword", adminPassword);
    // console.log("businessId",businessId);
    let error, message;
    let template = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Account on Loyalty App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    p {
      margin-bottom: 10px;
    }
    .bold {
      font-weight: bold;
    }
    .list {
      margin-left: 20px;
    }
    .list-item {
      margin-bottom: 5px;
    }
    .credentials {
      margin-top: 20px;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .credentials label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Hello ${businessName ? businessName : ""}</h1>
  <p>We have created an admin account for you on the loyalty app.</p>
  <p>From the admin dashboard, you can:</p>
  <ul class="list">
    <li class="list-item">Create Cashiers</li>
    <li class="list-item">Manage SMS Promotions</li>
    <li class="list-item">Update your business logo and other details</li>
    <li class="list-item">Check dashboard</li>
    <li class="list-item">Buy subscription</li>
    <li class="list-item">Manage Rewards and Loyalty points</li>
  </ul>
  <h2>Your login credentials are:</h2>
  <div class="credentials">
    <label for="url">Dashboard URL : http://loyalty-prod.hackerkernel.co/admin/login</label>
    <span id="url"></span><br>
    <label for="email">Email : ${adminEmail ? adminEmail : ""}</label>
    <span id="email"></span><br>
    <label for="password">Password : ${
      adminPassword ? adminPassword : ""
    }</label>
    <span id="password"></span>
    <label for="business" style="padding-top: 15px;">Business ID : ${
      businessId ? businessId : ""
    }</label>
    <span id="business"></span>
  </div>
  <p class="bold">Thanks,</p>
  <p class="bold">Team Loyalty App</p>
</body>
</html>
`;
    console.log("template", template);
    let subject;
    subject = "Admin Credentials";
    console.log("subject", subject);
    let result = await transporter
      .sendMail({
        to: adminEmail,
        from: "Loyalty",
        subject: subject,
        html: template,
      })
      .then(() => {
        console.log("Mail send successfully.");
      })
      .catch((err) => console.log("Mail Error = ", err.message));
  },
  async sendSubscriptionNoftifyMail(userEmail, businessName, subscriptionName, planEndDate) {
    // console.log("businessId",businessId);
    let error, message;
    let template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Subscription Expired</title>
      <style>
        /* CSS styles go here */
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
        }
    
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
        }
    
        h1 {
          color: #333;
          text-align: center;
          margin-top: 0;
        }
    
        p {
          line-height: 1.5;
          color: #555;
        }
    
        .cta-button {
          display: inline-block;
          background-color: #007bff;
          color: #fff;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.3s ease;
        }
    
        .cta-button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Subscription Expired</h1>
        <p>Hi ${businessName ? businessName : ""}</p>
        <p>This is a friendly reminder that your subscription for ${subscriptionName ? subscriptionName : ""} has expired on ${planEndDate ? planEndDate : ""}.</p>
        <p>Without an active subscription, you may lose access to certain features and benefits. To continue enjoying uninterrupted service, please renew your subscription by clicking the button below:</p>
        <p style="text-align: center;"><a href="https://loyalty-prod.hackerkernel.co/admin/login" class="cta-button">Renew Subscription</a></p>
        <p class="bold">Thanks,</p>
        <p class="bold">Team Loyalty App</p>
      </div>
    </body>
    </html>
`;
    // console.log("template", template);
    let subject;
    subject = "Subscription Notify";
    // console.log("subject", subject);
    let result = await transporter
      .sendMail({
        to: userEmail,
        from: "Loyalty",
        subject: subject,
        html: template,
      })
      .then(() => {
        console.log("Mail send successfully.");
      })
      .catch((err) => console.log("Mail Error = ", err.message));
  },
  async sendMail(data, template_key, otp) {
    let template;
    let subject;

    if (template_key === FORGOT_PASSWORD) {
      subject = "Forgot password otp";
      template = await ejs.renderFile(
        path.join(__dirname, "../views/emails/forgot-password.ejs"),
        {
          name: data.name,
          otp: otp,
        }
      );
    }
    let adminEmail = data.email;
    let result = transporter
      .sendMail({
        to: adminEmail,
        from: "Loyalty App",
        subject: subject,
        html: template,
      })
      .then(() => {
        console.log("Mail send successfully.");
      })
      .catch((err) => console.log("Mail Error = ", err.message));
  },

  isEmail(email) {
    var emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (email !== "" && email.match(emailFormat)) {
      return true;
    }

    return false;
  },
  encryptData(data) {
    const cipher = crypto.createCipheriv(ecnryption_method, key, encryptionIV);
    return Buffer.from(
      cipher.update(data, "utf8", "hex") + cipher.final("hex")
    ).toString("base64");
  },
  decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, "base64");
    const decipher = crypto.createDecipheriv(
      ecnryption_method,
      key,
      encryptionIV
    );
    return (
      decipher.update(buff.toString("utf8"), "hex", "utf8") +
      decipher.final("utf8")
    );
  }, // C6   //B14             // C4          //C3
  calculateNetScore(stroke, handicap_index, doubleAdvantage, advantage) {
    if (stroke === "") {
      return "";
    } else {
      if (handicap_index > 18 && handicap_index >= doubleAdvantage) {
        return stroke - 2;
      } else if (handicap_index >= advantage) {
        return stroke - 1;
      } else {
        return stroke;
      }
    }
  },
};
