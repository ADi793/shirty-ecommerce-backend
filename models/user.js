const jwt = require("jsonwebtoken");
const config = require("config");
const _ = require("underscore");
const Joi = require("joi");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 255,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    minlength: 5,
    maxlength: 255,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    minlength: 5,
    maxlength: 1024,
    required: true,
  },
  isAdmin: Boolean,
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    _.pick(this, ["_id", "name", "email", "isAdmin"]),
    config.get("jwtPrivateKey")
  );

  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const shema = {
    name: Joi.string().min(5).max(255).required(),
    email: Joi.string().email().min(5).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
  };

  return Joi.validate(user, shema);
}

module.exports.User = User;
module.exports.validate = validateUser;
