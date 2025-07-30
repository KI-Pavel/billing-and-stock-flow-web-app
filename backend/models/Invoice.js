const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // 👇 Common fields
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  phone: { type: String }, // Optional but useful for adjustments
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['sale', 'adjustment'], default: 'sale' },

  // 👇 Only for sales
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number },
  amountPaid: { type: Number },
  dues: { type: Number },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // 👇 Only for adjustments
  amount: { type: Number }, // amount paid to adjust due
});

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
