const { Order, validate } = require("../models/order");
const { Product } = require("../models/product");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const Joi = require("joi");
const express = require("express");
require("express-async-errors");
const router = express.Router();

router.get("/", async (req, res) => {
  const orders = await Order.find().sort("-createdAt").select("-__v");

  res.send(orders);
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = req.user;
  const products = await mapToProducts(req.body.products);
  const amount = calculateAmount(products);
  const address = req.body.address;
  const transaction_id = req.body.transaction_id;

  const order = new Order({
    user,
    products,
    amount,
    address,
    transaction_id,
  });

  await order.save();
  await adjustProductStocks(products);

  const eventEmitter = req.app.get("eventEmitter");
  eventEmitter.emit("orderPlaced", order);

  res.send(order);
});

router.get("/user", auth, async (req, res) => {
  const orders = await Order.find({ "user._id": req.user._id })
    .sort("-createdAt")
    .select("-__v");

  res.send(orders);
});

router.get("/:id", auth, async (req, res) => {
  const order = await Order.findOne({
    "user._id": req.user._id,
    _id: req.params.id,
  }).select("-__v");

  if (!order)
    return res.status(404).send("The order with the given ID was not found.");

  res.send(order);
});

router.put("/:id/status", [auth, admin], async (req, res) => {
  const { error } = validateOrderStatus(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: req.body.status,
      },
    },
    { new: true }
  );
  if (!order)
    return res.status(404).send("The order with the given ID was not found.");

  const eventEmitter = req.app.get("eventEmitter");
  eventEmitter.emit("orderUpdated", order);

  res.send(order);
});

function validateOrderStatus(status) {
  const shema = {
    status: Joi.string().min(5).max(55).required(),
  };

  return Joi.validate(status, shema);
}

function mapToProducts(products) {
  return Promise.all(
    products.map(async (product) => {
      const originalProduct = await Product.findById(product._id);
      if (!originalProduct) return res.status(400).send("Invalid product.");

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

async function adjustProductStocks(products) {
  return Promise.all(
    products.map(async (product) => {
      const originalProduct = await Product.findById(product._id).select(
        "-image"
      );
      originalProduct.stock = originalProduct.stock - product.quantity;
      await originalProduct.save();
      return originalProduct;
    })
  );
}

module.exports = router;
