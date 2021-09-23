const { Category } = require("../models/category");
const { Product, validate } = require("../models/product");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const fs = require("fs");
const formidable = require("formidable");
const _ = require("underscore");
const express = require("express");
require("express-async-errors");
const router = express.Router();

router.get("/", async (req, res) => {
  const products = await Product.find()
    .sort("name")
    .select("-__v -image -imageType");

  res.send(products);
});

router.post("/", [auth, admin], async (req, res) => {
  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) return next(err);

    const { error } = validate(fields);
    if (error) return res.status(400).send(error.details[0].message);

    const category = await Category.findById(fields.categoryId);
    if (!category) return res.status(400).send("Invalid category.");

    const product = new Product({
      name: fields.name,
      category: {
        _id: category._id,
        name: category.name,
      },
      description: fields.description,
      amount: fields.amount,
      stock: fields.stock,
    });

    if (!files.image) return res.status(400).send("Image is required.");
    if (files.image.size > 3000000)
      return res.status(400).send("Image is too large.");

    product.image = fs.readFileSync(files.image.path);
    product.imageType = files.image.type;

    await product.save();
    res.send(product);
  });
});

router.put("/:id", [auth, admin], async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product)
    return res.status(404).send("The product with the given ID was not found.");

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) return next(err);

    const { error } = validate(fields);
    if (error) return res.status(400).send(error.details[0].message);

    const category = await Category.findById(fields.categoryId);
    if (!category) return res.status(400).send("Invalid category.");

    product.name = fields.name;
    product.category = {
      _id: category._id,
      name: category.name,
    };
    product.description = fields.description;
    product.amount = fields.amount;

    if (!files.image) return res.status(400).send("Image is required.");
    if (files.image.size > 3000000)
      return res.status(400).send("Image is too large.");

    product.image = fs.readFileSync(files.image.path);
    product.imageType = files.image.type;

    await product.save();
    res.send(product);
  });
});

router.delete("/:id", [auth, admin], async (req, res) => {
  const product = await Product.findByIdAndRemove(req.params.id);
  if (!product)
    return res.status(404).send("The product with the given ID was not found.");

  res.send(product);
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).select(
    "-image -imageType -__v"
  );
  if (!product)
    return res.status(404).send("The product with the given ID was not found");

  res.send(product);
});

router.get("/:id/image", async (req, res) => {
  const product = await Product.findById(req.params.id).select(
    "image imageType"
  );
  if (!product)
    return res
      .status(404)
      .send("The product image with the given ID was not found.");

  res.set("Content-Type", product.imageType);
  res.send(product.image);

  // res.send(product);
});
module.exports = router;
