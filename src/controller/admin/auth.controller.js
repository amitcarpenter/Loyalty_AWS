const { Super_Admin_Cashier,Otp } = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let {sendMail} =require("../../utils/helper");
const utils = require("../../utils/helper");
const crypto = require('crypto');
const { Op } = require("sequelize");
const { ACTIVE, BLOCKED, CREDENTIAL,FORGOT_PASSWORD } = require("../../utils/constants");

exports.getCustomerMobile = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    return res.render("partials/sinch.ejs", { message, error, formValue });
  } catch (err) {
    next(err);
  }
};
exports.getLogin = async (req, res, next) => {
  try {
    const { message, error, formValue } = req.query;
    return res.render("admin/auth/login.ejs", { message, error, formValue });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const admin = await Super_Admin_Cashier.findOne({
      where: { email: req.body.email.trim()},
    });
    if (!admin) {
      throw new Error("Invalid user name.");
    }
    if (admin.status !== ACTIVE) { 
      throw new Error('Your account is not active or blocked.'); 
    }
    let result = await bcrypt.compare(req.body.password, admin.password);
    if (result) {
      const superAdmin = await Super_Admin_Cashier.update(
        { is_superadmin: false}, 
        { where: { id: admin.id } }
      );
      let token = jwt.sign(
        { id: admin.id, email: admin.email, role_id: admin.role_id },
        process.env.SECRET,
        { expiresIn: "365d" }
      );
      console.log("token", token);
      await Super_Admin_Cashier.update(
        { token: token },
        { where: { id: admin.id } }
      );
      res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
      // res.clearCookie("dd-user");
      switch (admin.role_id) {
        case 0:
          return res.redirect("/admin/list");
        case 1:
          return res.redirect("/admin/dashboard");
        default:
          return res.redirect("/admin/login");
      }
    } else {
      throw new Error("Invalid password.");
    }
  } catch (err) {
    next(err);
  }
};

exports.GetforgotPasswordPage = async (req, res, next) =>{
  // let data,error,message;
  const { message, error, formValue } = req.query;
  try {
  } catch (error) {
    console.log('error',error)
  }
  // message='HIIIIIIIIIIIIIIIIIIII'
  return res.render("admin/emails/sendForgetEmail.ejs",{ message, error, formValue });
}
exports.SendforgotPasswordToken = async (req, res, next) =>{
  try {
    let data,error,message;
    let email = req.query.email
    console.log(email);
    if(!email)
    {
      return res.render("admin/emails/reset_password.ejs");
    }

    const admin = await Super_Admin_Cashier.findOne({
      where: { email: email },
    });
    if(!admin)
    {
      error ='Admin Not Found'
      return res.render("admin/emails/sendForgetEmail.ejs",{
        data,
        error,
        message
      });
      // return res.render("admin/emails/forgot-password.ejs");
    }
    const reset_token =  generateToken();
    const expirationTime = generateExpiryTime();
    if(admin && reset_token && expirationTime)
    {
      await Super_Admin_Cashier.update(
        { reset_token: reset_token ,reset_token_expires:expirationTime},
        { where: { id: admin.id } }
      );
     
      if(reset_token)
      {
        try {
          let email = await new Promise((resolve, reject) => {
             let data= sendMail(admin, reset_token,res)
                  .then(result => {
                      // Assuming sendMail resolves with the email
                      if(data && data==true)
                      {
                        return res.render("admin/emails/sendForgetEmail.ejs",{
                          data,
                          error,
                          message
                        });
                        resolve(result);
                      }
                  })
                  .catch(error => {
                      reject(error);
                  });
          });
  
          // Use the 'email' variable here
          console.log(email);
  
          // rest of the code
      } catch (error) {
          console.error("Error sending mail:", error);
      }
      if(email)
      {
        message='Email Send successfully';
        let data={};
        return res.render("admin/emails/reset_password.ejs",{
          data,
          error,
          message
        });
      }
      }
      console.log('admin',admin.email);

    }
    
  } catch (error) {
    console.log('error',error)
  }
}
function generateExpiryTime() {
  const now = new Date();
  // Set the expiration time (e.g., 1 hour from now)
  const expirationTime = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour in milliseconds
  return expirationTime;
}
function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}
exports.resetPasswordApi = async (req, res, next) =>{
  const { token } = req.params;
  let error,message
// Assuming your Super_Admin_Cashier model has fields reset_token and reset_token_expires
const admin = await Super_Admin_Cashier.findOne({
  where: {
      reset_token: token,
      reset_token_expires: { [Op.gt]: new Date().toISOString().split('T')[0] },
  },
});

let data={};
if(!admin)
{
  // console.log(admin.id);

  console.log('admin NOT FOUND');
  return
  // return res.render("admin/emails/reset_password.ejs",{
  //   data,
  //   error,
  //   message
  // });
}
 data ={
  // id:admin.id,
  // name:admin.name,
  url:'/reset/:token',
  name:admin.name,
  email:admin.email,
  resetToken:token,
  id:admin.id
}
return res.render("admin/emails/reset_password.ejs",{
  data,
  error,
  message
});
// res.render("super_admin/user/admin/edit-admin.ejs", {
//   data: data,
//   error,
//   message,
//   formValue
// });
  // Verify the token and check its validity (e.g., expiry time)
  // ...

  // Render a form to reset the password
  // res.sendFile(__dirname + '/reset.html');
}
exports.resetAdminPasswordApi = async (req, res, next) =>{
  try {
     // let {token,NewPassword} = req.params;
  const resetToken = req.query.resetToken;
  const NewPassword = req.query.newPassword;
  console.log('newPassword',NewPassword,'resetToken',resetToken)
  let message,error;
if(!NewPassword)
{
  console.log('Please Enter password');
  return
}
if(!resetToken)
{
  console.log('Please Enter resetToken');
  return
}
  const admin = await Super_Admin_Cashier.findOne({
    where: {
        reset_token: resetToken,
        reset_token_expires: { [Op.gt]: new Date().toISOString().split('T')[0] },
    },
  });
  if(!admin)
{
  console.log('Invalid Token');
  return
}
  if(admin)
  {
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(NewPassword, salt);
    console.log(admin);
  let update =  await Super_Admin_Cashier.update(
      { password: hashedPassword },
      { where: { id: admin.id } }
    );
    let data ={
      name:admin.name,
      email:admin.email,
      resetToken:resetToken,
      id:admin.id,
      password:true
    }
    message='Password Update Successfully'
    return res.render("admin/emails/reset_password.ejs",{
      data,
      error,
      message
    });
  }
  } catch (error) {
    console.log('error',error)
  }
}
exports.NavigateToresetPassword = async (req, res, next) =>{
console.log(req.body);
try {
  let message,error;
  const {adminId,token} = req.params
  if(!token)
  {
    console.log('Token Not Found')
    return
  }
const admin = await successfullyper_Admin_Cashier.findOne({
  where: {
      reset_token: token,
      reset_token_expires: { [Op.gt]: new Date().toISOString().split('T')[0] },
  },
});
console.log(admin);
if(!admin)
{
return
}
let data ={
  name:admin.name,
  email:admin.email,
  resetToken:token,
  id:admin.id
}
return res.render("admin/emails/reset_password.ejs",{
  data,
  error,
  message
});
} catch (error) {
  console.log('error',error)
}

}
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const super_admin_cashier = await Super_Admin_Cashier.findOne({
//       where: { email:req.body.email.trim()},
//     });

//     if (!super_admin_cashier) {
//       throw new Error("Invalid user name.");
//     }

//     const result = await bcrypt.compare(password, super_admin_cashier.password);

//     if (result) {
//       const token = jwt.sign(
//         { id: super_admin_cashier.id, email: super_admin_cashier.email, role_id: super_admin_cashier.role_id },
//         process.env.SECRET,
//         { expiresIn: "365d" }
//       );
//       console.log("token---------",token);
//       res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
//       // res.clearCookie("dd-user");
//       await Super_Admin_Cashier.update({ token }, { where: { id: super_admin_cashier.id } });
//       switch (super_admin_cashier.role_id) {
//         case 0:
//           return res.redirect("/admin/superadmin/dashboard");
//         case 1:
//           return res.redirect("/admin/dashboard");
//         case 2:
//           return res.redirect("/cashier/dashboard");
//         default:
//           console.log("Invalid role_id:", super_admin_cashier.role_id);
//       }
//     } else {
//       throw new Error("Invalid password.");
//     }

//   } catch (err) {
//     next(err);
//   }
// };
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const super_admin_cashier = await Super_Admin_Cashier.findOne({
//       where: { email },
//     });
//     console.log("super_admin_cashier----",super_admin_cashier);
//     if (!super_admin_cashier) {
//       throw new Error("Invalid user name.");
//     }

//     const result = await bcrypt.compare(password, super_admin_cashier.password);
//     console.log("result---",result);
//     if (result) {
//       const token = jwt.sign(
//         { id: super_admin_cashier.id, email: super_admin_cashier.email, role_id: super_admin_cashier.role_id },
//         process.env.SECRET,
//         { expiresIn: "365d" }
//       );
//       console.log("token----",token);
//       res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
//       // res.clearCookie("dd-user");

//       await Super_Admin_Cashier.update({ token }, { where: { id: super_admin_cashier.id } });

//       // Use a switch statement for clearer role-based redirection
//       switch (super_admin_cashier.role_id) {
//         case 0:
//           return res.redirect("/admin/superadmin/dashboard");
//         case 1:
//           return res.redirect("/admin/dashboard");
//         case 2:
//           return res.redirect("/cashier/dashboard");
//         default:
//           console.log("Invalid role_id:", super_admin_cashier.role_id);
//       }
//     } else {
//       throw new Error("Invalid password.");
//     }
//   } catch (err) {
//     next(err);
//   }
// };

// exports.login = async (req, res, next) => {
//   try {
//     const super_admin_cashier = await Super_Admin_Cashier.findOne({
//       where: { email: req.body.email.trim() },
//     });
//     // console.log("admin--------",admin);
//     // console.log("admin-role-------",admin.role_id);
//     if (!super_admin_cashier) {
//       throw new Error("Invalid user name.");
//     }
//     let result = await bcrypt.compare(req.body.password, super_admin_cashier.password);
//     if (result) {
//       let token = jwt.sign(
//         { id: super_admin_cashier.id, email: super_admin_cashier.email, role_id: super_admin_cashier.role_id },
//         process.env.SECRET,
//         { expiresIn: "365d" }
//       );
//       console.log("token---------",token);
//       if (super_admin_cashier.role_id == 0) {
//         await Super_Admin_Cashier.update({ token: token }, { where: { id: super_admin_cashier.id } });
//         return res.redirect("/admin/superadmin/dashboard");
//       } else if (super_admin_cashier.role_id == 1) {
//         // Admin
//         await Super_Admin_Cashier.update({ token: token }, { where: { id: super_admin_cashier.id } });
//         return res.redirect("/admin/dashboard");
//       } else if (super_admin_cashier.role_id == 2) {
//         // Cashier
//         await Super_Admin_Cashier.update({ token: token }, { where: { id: super_admin_cashier.id } });
//         return res.redirect("/admin/");
//       }

//       res.cookie("dd-token", token, { maxAge: 1000 * 60 * 60 * 24 * 365 });
//       res.clearCookie("dd-user");

//     } else {
//       throw new Error("Invalid password.");
//     }
//   } catch (err) {
//     next(err);
//   }
// };

exports.logOut = async (req, res, next) => {
  try {
    const { error, message, formValue } = req.query;
    res.clearCookie("dd-token");
    req.success = "Successfully LogOut.";
    // return res.redirect("/admin/login")
    next("last");
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { message, error, formValue, isLoggedIn } = req.query;
    return res.render("admin/auth/forget_password", {
      message,
      error,
      formValue,
      isLoggedIn
    });
  } catch (err) {
    next(err);
  }
};
// exports.forgotPassword = async (req, res) => {
//     try {
//         console.log("hello----------------");
//     //   const { error, message, formValue, isLoggedIn } = req.query;
//       return res.render("admin/auth/login.ejs");
//     } catch (err) {
//       next(err);
//     }
//   };

exports.userForgotPassword = async (req, res, next) => {
  try {
    const admin = await Super_Admin_Cashier.findOne({
      where: { email: req.body.email.trim() },
    });
    console.log("admin--------", admin);
    if (admin) {
      const random_number = (
        Math.floor(Math.random() * 1000000 + 1) + 100000
      ).toString();
      const data = {
        user_id: admin.id,
        otp: random_number,
        type: FORGOT_PASSWORD,
        status: false,
      };
      await Otp.create(data);
      await utils.sendMail(admin, FORGOT_PASSWORD, random_number);
      req.flash("success", "successfully send otp on mail.");
      return res.redirect("/admin/reset-password");
    } else {
      throw new Error("Email does not exist..");
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { error, message, formValue, isLoggedIn } = req.query;
    return res.render("admin/auth/reset_password", {
      error,
      message,
      formValue,
      isLoggedIn
    });
  } catch (err) {
    next(err);
  }
};

exports.userResetPassword = async (req, res, next) => {
  try {
    const { error, message, formValue, isLoggedIn } = req.query;
    console.log("req.body---------", req.body);
    if (req.body.new_password !== req.body.confirm_password) {
      throw new Error("New password and confirm password does not match.");
    }
    let otp = await Otp.findOne({
      otp: req.body.otp,
      type: FORGOT_PASSWORD,
      status: false,
    });
    if (otp) {
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(req.body.new_password, salt);
      await Super_Admin_Cashier.update({ password: hash }, { where: { id: otp.user_id } });
      otp.status = true;
      await otp.save();
      req.success = "Password update successfully.";
      next("last");
    } else {
      throw new Error("Invalid otp.");
    }
  } catch (err) {
    next(err);
  }
};