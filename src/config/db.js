const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oqueeisso';
    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB] Conectado com sucesso: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Erro de conexão: ${error.message}`);
    // Não encerrar abruptamente para permitir visualização de erros em logs
  }
};

module.exports = connectDB;
