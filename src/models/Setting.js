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
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceTitle: {
      type: String,
      default: 'Estamos em Manutenção Programada',
    },
    maintenanceMessage: {
      type: String,
      default: 'Estamos preparando novidades e melhorias em nossas peças artesanais. Voltaremos muito em breve!',
    },
    maintenanceEstimatedReturn: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
