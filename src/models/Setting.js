const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    shippingFee: {
      type: Number,
      default: 25,
      min: 0,
    },
    freeShippingThreshold: {
      type: Number,
      default: 200,
      min: 0,
    },
    storeNotice: {
      type: String,
      default: 'Artesanato Exclusivo Feito à Mão em Família',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
