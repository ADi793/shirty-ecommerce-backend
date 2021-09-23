const { Category, validate } = require("../models/category");
const { Product } = require("../models/product");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const express = require("express");
require("express-async-errors");
const router = express.Router();

router.get("/", async (req, res) => {
  const categories = await Category.find().sort("name").select("-__v");

  res.send(categories);
});

router.post("/", [auth, admin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const category = new Category({ name: req.body.name });

  await category.save();
  res.send(category);
});

router.put("/:id", [auth, admin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
    },
    { new: true }
  );
  if (!category)
    return res
      .status(404)
      .send("The category with the given ID was not found.");

  res.send(category);
});

router.delete("/:id", [auth, admin], async (req, res) => {
  const product = await Product.findOne({ "category._id": req.params.id });
  if (product)
    return res.status(400).send("The movie with the given category is exists.");

  const category = await Category.findByIdAndRemove(req.params.id);
  if (!category)
    return res
      .status(404)
      .send("The category with the given ID was not found.");

  res.send(category);
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id).select("-__v");
  if (!category)
    return res
      .status(404)
      .send("The category with the given ID was not found.");

  res.send(category);
});

module.exports = router;
