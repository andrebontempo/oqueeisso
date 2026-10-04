const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome da categoria é obrigatório'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '/images/category-default.jpg',
    },
    icon: {
      type: String,
      default: 'fa-shapes',
    },
    order: {
      type: Number,
      default: 99,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
