const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// Get top 5 products by quantity
router.get('/top5', async (req, res) => {
  const products = await Product.find({}).sort({ quantity: -1 }).limit(5);
  res.json(products);
});

// Add or remove product quantity
router.post('/update', async (req, res) => {
  const { name, price, quantity } = req.body;
  if (!name || !price || quantity == null) {
    return res.status(400).json({ message: 'Missing product data' });
  }

  let product = await Product.findOne({ name });

  if (!product) {
    product = new Product({ name, price, quantity });
  } else {
    product.quantity += quantity;
    if (product.quantity < 0) product.quantity = 0;
    product.price = price; // update price if changed
  }

  await product.save();
  res.json(product);
});

module.exports = router;
