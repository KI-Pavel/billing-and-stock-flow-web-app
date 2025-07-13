const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  dues: { type: Number, default: 0 },
});

module.exports = mongoose.model("Customer", customerSchema);
