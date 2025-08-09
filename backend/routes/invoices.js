const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const generateInvoicePDF = require('../utils/pdfGenerator');

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

// Download invoice PDF route
router.get('/download/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Populate product, customer, and seller info
    const invoice = await Invoice.findById(invoiceId)
      .populate('product')
      .populate('customer')
      .populate('seller');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice_${invoiceId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating invoice PDF' });
  }
});

module.exports = router;
