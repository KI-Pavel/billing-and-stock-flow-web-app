const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const path = require("path");
const authMiddleware = require("../middleware/auth"); // your JWT auth middleware

// Route to download invoice PDF by invoice ID
router.get("/download/:invoiceId", authMiddleware, async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;

    // Find invoice and verify ownership if needed
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Example: assume invoice PDF files are saved in 'invoices/' folder by ID
    const invoiceFilePath = path.join(
      __dirname,
      "../invoices",
      `${invoiceId}.pdf`
    );

    // You can also dynamically generate PDF here if you prefer

    // Send file to client
    res.download(invoiceFilePath, `invoice_${invoiceId}.pdf`, (err) => {
      if (err) {
        console.error("Error sending invoice file:", err);
        res.status(500).send("Error sending invoice file");
      }
    });
  } catch (error) {
    console.error("Download invoice error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
