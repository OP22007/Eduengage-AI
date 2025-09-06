#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🧪 Testing MongoDB Connection...');
  console.log('Connection string:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    ssl: true,
    sslValidate: false,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  };

  try {
    console.log('🔗 Attempting connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Connection successful!');
    console.log(`📍 Connected to: ${conn.connection.host}`);
    console.log(`🗃️ Database: ${conn.connection.name}`);
    console.log(`🔢 Connection state: ${conn.connection.readyState}`);
    
    // Test a simple query
    const collections = await conn.connection.db.admin().listCollections().toArray();
    console.log(`📚 Available collections: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('🔧 SSL/TLS issue detected. Trying alternative approach...');
      
      // Try with different SSL settings
      const altOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
        ssl: false,
      };
      
      try {
        const altConn = await mongoose.connect(process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://'), altOptions);
        console.log('✅ Alternative connection successful!');
        await mongoose.connection.close();
      } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError.message);
      }
    }
    
    process.exit(1);
  }
}

testConnection();
