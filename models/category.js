const Joi = require("joi");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 55,
    trim: true,
    required: true,
  },
});

const Category = mongoose.model("Category", categorySchema);

function validateCategory(category) {
  const shema = {
    name: Joi.string().min(5).max(55).required(),
  };

  return Joi.validate(category, shema);
}

module.exports.categorySchema = categorySchema;
module.exports.Category = Category;
module.exports.validate = validateCategory;
