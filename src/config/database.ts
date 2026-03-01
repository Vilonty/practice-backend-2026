import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'booking_db',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  NODE_ENV = 'development'
} = process.env;

console.log({ 
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD: '***' 
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;