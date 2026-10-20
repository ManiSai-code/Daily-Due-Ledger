import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI;

    if (!connStr) {
      throw new Error('MONGODB_URI is undefined. Please verify your .env file in the backend directory.');
    }

    // Clean up trailing spaces or quotes if any exist
    const cleanUri = connStr.trim().replace(/^["']|["']$/g, '');

    const conn = await mongoose.connect(cleanUri);

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};