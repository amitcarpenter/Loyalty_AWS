const Joi = require('joi')
const CustomerSignUp = Joi.object({
  username: Joi.string().trim().min(1).required(),
  contact_number: Joi.string().trim().min(5).required(),
  dob: Joi.string(),
  organization_id: Joi.string().required(),
  }).unknown(true)
const CheckuserId = Joi.object({
  userId: Joi.string().trim().min(1).required(),
  organization_id: Joi.number().integer().required(),
  }).unknown(true)

const CreatePramotion = Joi.object({
  message: Joi.string().trim().min(2).required(),
  start_date: Joi.string().required(),
  status: Joi.string().required(),
  // organizationId: Joi.string().valid(Joi.ref('admin.Organizations[0].id')).required()
  }).unknown(true)

  module.exports  ={
    CustomerSignUp,CheckuserId,CreatePramotion
  }