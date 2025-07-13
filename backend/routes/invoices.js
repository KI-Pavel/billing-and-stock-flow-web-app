const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Create a new invoice and update stock, customer dues
router.post('/create', async (req, res) => {
  try {
    const { productId, quantity, amountPaid, phone, sellerId } = req.body;

    if (!productId || !quantity || !amountPaid || !phone || !sellerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({ phone, dues: 0 });
    }

    const totalCost = product.price * quantity;
    const dues = totalCost - amountPaid;

    // Update product stock
    product.quantity -= quantity;
    await product.save();

    // Update customer dues
    customer.dues += dues;
    await customer.save();

    // Create invoice
    const invoice = new Invoice({
      product: product._id,
      customer: customer._id,
      quantity,
      amountPaid,
      dues,
      seller: sellerId
    });

    await invoice.save();

    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
