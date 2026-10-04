const Setting = require('../models/Setting');

const getSettings = async () => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        shippingFee: 25,
        freeShippingThreshold: 200,
        storeNotice: 'Artesanato Exclusivo Feito à Mão em Família',
      });
    }
    return settings;
  } catch (error) {
    console.error('Erro ao buscar configurações da loja:', error);
    return {
      shippingFee: 25,
      freeShippingThreshold: 200,
      storeNotice: 'Artesanato Exclusivo Feito à Mão em Família',
    };
  }
};

const updateSettings = async (data) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting();
  }

  if (typeof data.shippingFee !== 'undefined') {
    settings.shippingFee = Number(data.shippingFee) >= 0 ? Number(data.shippingFee) : 0;
  }
  if (typeof data.freeShippingThreshold !== 'undefined') {
    settings.freeShippingThreshold = Number(data.freeShippingThreshold) >= 0 ? Number(data.freeShippingThreshold) : 0;
  }
  if (typeof data.storeNotice !== 'undefined') {
    settings.storeNotice = data.storeNotice;
  }

  await settings.save();
  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
};
