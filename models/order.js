const Joi = require("joi");
const mongoose = require("mongoose");

const productCartSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 55,
    trim: true,
    required: true,
  },
  unit_price: {
    type: Number,
    min: 0,
    required: true,
  },
  quantity: {
    type: Number,
    min: 1,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: new mongoose.Schema({
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
      }),
      required: true,
    },

    products: {
      type: [productCartSchema],
      validate: {
        validator: function (products) {
          return Array.isArray(products) && products.length > 0;
        },
        message: (props) => `In products array one product object is required.`,
      },
      required: true,
    },

    amount: {
      type: Number,
      min: 0,
      required: true,
    },

    address: {
      type: String,
      minlength: 5,
      maxlength: 512,
      trim: true,
      required: true,
    },

    status: {
      type: String,
      default: "Recieved",
      enum: ["Cancelled", "Delivered", "Shipped", "Processing", "Recieved"],
    },

    transaction_id: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

function validateOrder(order) {
  const schema = {
    products: Joi.array()
      .items(
        Joi.object()
          .keys({
            _id: Joi.objectId().required(),
            quantity: Joi.number().min(1).max(100).required(),
          })
          .required()
      )
      .required(),
    address: Joi.string().min(5).max(555).required(),
    transaction_id: Joi.string().required(),
  };

  return Joi.validate(order, schema);
}

module.exports.Order = Order;
module.exports.validate = validateOrder;
