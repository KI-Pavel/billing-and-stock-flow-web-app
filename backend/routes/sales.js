const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// 🟢 Get today's product sales data for chart
router.get("/today", async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const sales = await Invoice.aggregate([
    { $match: { date: { $gte: start }, type: { $ne: "adjustment" } } }, // exclude adjustments
    {
      $group: {
        _id: "$product",
        totalQuantity: { $sum: "$quantity" },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productName: "$product.name",
        totalQuantity: 1,
      },
    },
    { $sort: { totalQuantity: -1 } },
  ]);

  res.json(sales);
});

// 🆕 Get weekly sales totals (amountPaid per day)
router.get("/week", async (req, res) => {
  const start = new Date();
  start.setDate(start.getDate() - 6); // last 7 days including today
  start.setHours(0, 0, 0, 0);

  try {
    const sales = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: start },
          type: { $ne: "adjustment" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$amountPaid" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalSales: 1,
        },
      },
    ]);

    res.json(sales);
  } catch (err) {
    console.error("Weekly sales error:", err);
    res.status(500).json({ message: "Error fetching weekly sales" });
  }
});


module.exports = router;
