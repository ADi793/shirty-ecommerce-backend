const { categorySchema } = require("./category");
const Joi = require("joi");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 55,
    trim: true,
    unique: true,
    required: true,
  },
  category: {
    type: categorySchema,
    required: true,
  },
  description: {
    type: String,
    minlength: 5,
    maxlength: 2048,
    trim: true,
    required: true,
  },
  amount: {
    type: Number,
    min: 0,
    required: true,
  },
  stock: {
    type: Number,
    min: 0,
    required: true,
  },
  sold: {
    type: Number,
    default: 0,
  },
  image: {
    type: Buffer,
    required: true,
  },
  imageType: {
    type: String,
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

function validateProduct(product) {
  const shema = {
    name: Joi.string().min(5).max(55).required(),
    categoryId: Joi.objectId().required(),
    description: Joi.string().min(5).max(2048).required(),
    amount: Joi.number().min(0).required(),
    stock: Joi.number().min(0).required(),
  };

  return Joi.validate(product, shema);
}

module.exports.Product = Product;
module.exports.validate = validateProduct;
