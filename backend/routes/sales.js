const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get today's product sales data for chart
router.get('/today', async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const sales = await Invoice.aggregate([
    { $match: { date: { $gte: start } } },
    {
      $group: {
        _id: '$product',
        totalQuantity: { $sum: '$quantity' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $project: {
        _id: 0,
        productName: '$product.name',
        totalQuantity: 1
      }
    },
    { $sort: { totalQuantity: -1 } }
  ]);

  res.json(sales);
});

module.exports = router;
