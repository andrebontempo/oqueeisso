const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do produto é obrigatório'],
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
      required: [true, 'A descrição do produto é obrigatória'],
    },
    price: {
      type: Number,
      required: [true, 'O preço é obrigatório'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    artisan: {
      type: String,
      enum: ['Esposa (Fernanda)', 'Irmão (Rodrigo)', 'Cunhada (Márcia)', 'Cunhada (Juliana)', 'Família O Que É Isso'],
      default: 'Família O Que É Isso',
    },
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    images: {
      type: [String],
      default: ['/images/product-placeholder.jpg'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    dimensions: {
      type: String,
      default: '',
    },
    materials: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
