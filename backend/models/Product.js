const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
