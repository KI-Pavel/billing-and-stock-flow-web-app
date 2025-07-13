const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  quantity: { type: Number, required: true },
  amountPaid: { type: Number, required: true },
  dues: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
