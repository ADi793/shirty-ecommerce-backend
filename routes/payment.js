const config = require("config");
const stripe = require("stripe")(config.get("stripePrivateKey"));
const { Product } = require("../models/product");
const auth = require("../middlewares/auth");
const Joi = require("joi");
const express = require("express");
require("express-async-errors");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { error } = validateOrderRequest(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const products = await mapToProducts(req.body.products, res);

  const customer = await stripe.customers.create({
    name: req.user.name,
    email: req.user.email,
  });

  // Create a PaymentIntent with the order amount and currency
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateAmount(products) * 100,
      currency: "inr",
      shipping: {
        name: req.user.name,
        address: {
          line1: req.body.address,
        },
      },
      description: "Shirty payment service.",
      customer: customer.id,
    });

    res.send(paymentIntent.client_secret);
  } catch (ex) {
    console.log(ex);
  }
});

function mapToProducts(products, res) {
  return Promise.all(
    products.map(async (product) => {
      const originalProduct = await Product.findById(product._id);
      if (!originalProduct) return res.status(400).send("Invalid product.");
      if (originalProduct.stock < product.quantity)
        return res
          .status(400)
          .send("That quantity of product is not available.");

      product.name = originalProduct.name;
      product.unit_price = originalProduct.amount;
      return product;
    })
  );
}

function calculateAmount(products) {
  let amount = 0;
  products.forEach((product) => {
    amount = product.unit_price * product.quantity;
  });

  return amount;
}

function validateOrderRequest(orderRequestData) {
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
  };

  return Joi.validate(orderRequestData, schema);
}

module.exports = router;
