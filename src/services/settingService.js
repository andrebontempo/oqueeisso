const Setting = require('../models/Setting');

const getSettings = async () => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        shippingFee: 25,
        freeShippingThreshold: 200,
        storeNotice: 'Artesanato Exclusivo Feito à Mão em Família',
        isMaintenanceMode: false,
        maintenanceTitle: 'Estamos em Manutenção Programada',
        maintenanceMessage: 'Estamos preparando novidades e melhorias em nossas peças artesanais. Voltaremos muito em breve!',
        maintenanceEstimatedReturn: '',
      });
    }
    return settings;
  } catch (error) {
    console.error('Erro ao buscar configurações da loja:', error);
    return {
      shippingFee: 25,
      freeShippingThreshold: 200,
      storeNotice: 'Artesanato Exclusivo Feito à Mão em Família',
      isMaintenanceMode: false,
      maintenanceTitle: 'Estamos em Manutenção Programada',
      maintenanceMessage: 'Estamos preparando novidades e melhorias em nossas peças artesanais. Voltaremos muito em breve!',
      maintenanceEstimatedReturn: '',
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
  if (typeof data.isMaintenanceMode !== 'undefined') {
    settings.isMaintenanceMode = data.isMaintenanceMode === true || data.isMaintenanceMode === 'true' || data.isMaintenanceMode === 'on' || data.isMaintenanceMode === '1';
  }
  if (typeof data.maintenanceTitle !== 'undefined') {
    settings.maintenanceTitle = data.maintenanceTitle;
  }
  if (typeof data.maintenanceMessage !== 'undefined') {
    settings.maintenanceMessage = data.maintenanceMessage;
  }
  if (typeof data.maintenanceEstimatedReturn !== 'undefined') {
    settings.maintenanceEstimatedReturn = data.maintenanceEstimatedReturn;
  }

  await settings.save();
  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
};
