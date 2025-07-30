const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

// Get customer by phone with invoice history and dues
router.get("/:phone", async (req, res) => {
  const { phone } = req.params;

  const customer = await Customer.findOne({ phone });
  if (!customer) return res.status(404).json({ message: "Customer not found" });

  const invoices = await Invoice.find({ customer: customer._id }).populate(
    "product"
  );

  res.json({
    customer,
    invoices,
  });
});

// Adjust customer due endpoint
// Adjust customer due endpoint
router.post("/adjust-due", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    if (!phone || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone or amount" });
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Reduce due by amount paid, but due cannot go below 0
    customer.dues = Math.max(customer.dues - amount, 0);
    await customer.save();

    // 🔥 Log this adjustment in the invoice history
    await Invoice.create({
      customer: customer._id,
      phone,
      type: "adjustment",
      amount: amount,
      date: new Date(),
    });

    return res.json({
      success: true,
      message: "Customer dues adjusted",
      dues: customer.dues,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
