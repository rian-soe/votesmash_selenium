// Direct database connection (for local development)
const directDbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',      
    user: process.env.DB_USER || 'sail',      
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'votesmash', 
    port: parseInt(process.env.DB_PORT) || 3308         
};

// SSH tunnel configuration (for remote database access)
const tunnel = require('tunnel-ssh');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const sshConfig = {
  host: process.env.SSH_HOST || '13.51.177.101',   // SSH server public IP
  port: parseInt(process.env.SSH_PORT) || 22,                // SSH port (default 22)
  username: process.env.SSH_USERNAME || 'ubuntu',      // SSH user
  privateKey: process.env.SSH_PRIVATE_KEY_PATH ? 
    fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH) :
    fs.readFileSync(path.join(__dirname, '../improtant/votesmash_test.pem'))
};

const dbServer = {
  host: process.env.DB_REMOTE_HOST || '127.0.0.1', // MySQL host as seen from the SSH server
  port: parseInt(process.env.DB_REMOTE_PORT) || 3306,
  user: process.env.DB_REMOTE_USER || 'user',      // MySQL username
  password: process.env.DB_REMOTE_PASSWORD || 'password',
  database: process.env.DB_REMOTE_NAME || 'votesmash'
};

// Create direct database connection (for local/CI environments)
async function createDirectConnection() {
  try {
    const connection = await mysql.createConnection(directDbConfig);
    console.log('✅ Direct MySQL connection established');
    return connection;
  } catch (err) {
    console.error('❌ Direct MySQL connection error:', err);
    throw err;
  }
}

// Create SSH tunnel connection (for remote database access)
async function createTunnelConnection() {
  return new Promise((resolve, reject) => {
    tunnel.createTunnel(
      {
        ...sshConfig,
        dstHost: dbServer.host,
        dstPort: dbServer.port,
        localHost: '127.0.0.1',
        localPort: 3308 // free local port
      },
      async (error, server) => {
        if (error) {
          console.error('❌ SSH tunnel error:', error);
          return reject(error);
        }
        console.log('✅ SSH tunnel established on localhost:3308');

        try {
          const connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3308,
            user: dbServer.user,
            password: dbServer.password,
            database: dbServer.database
          });

          console.log('✅ MySQL connection established through tunnel');
          resolve(connection);
        } catch (err) {
          console.error('❌ MySQL connection error:', err);
          reject(err);
        }
      }
    );
  });
}

// Main connection function - chooses between direct and tunnel based on environment
async function createConnection() {
  // Use direct connection if SSH_HOST is not set or if we're in CI environment
  if (!process.env.SSH_HOST || process.env.CI === 'true') {
    return await createDirectConnection();
  } else {
    return await createTunnelConnection();
  }
}

module.exports = { 
  createConnection, 
  createDirectConnection, 
  createTunnelConnection,
  directDbConfig,
  sshConfig,
  dbServer
};
