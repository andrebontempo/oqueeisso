const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do artesão é obrigatório'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'O vínculo/função é obrigatório (Ex: Esposa, Irmão, Cunhada)'],
      trim: true,
    },
    specialty: {
      type: String,
      required: [true, 'A especialidade é obrigatória (Ex: Crochê, Trabalhos em Madeira)'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'O resumo/biografia é obrigatório'],
    },
    avatar: {
      type: String,
      default: '/images/artisan-default.jpg',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artisan', artisanSchema);
