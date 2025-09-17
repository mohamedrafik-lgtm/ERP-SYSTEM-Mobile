#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class MetroTroubleshooter {
  constructor() {
    this.projectRoot = process.cwd();
    this.platform = os.platform();
    this.issues = [];
    this.solutions = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async checkPortAvailability(port = 8081) {
    this.log(`Checking if port ${port} is available...`);
    try {
      if (this.platform === 'win32') {
        const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        if (result.trim()) {
          this.issues.push(`Port ${port} is already in use`);
          this.solutions.push(`Kill process using port ${port}`);
          return false;
        }
      } else {
        const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
        if (result.trim()) {
          this.issues.push(`Port ${port} is already in use`);
          this.solutions.push(`Kill process using port ${port}`);
          return false;
        }
      }
      this.log(`Port ${port} is available`, 'success');
      return true;
    } catch (error) {
      this.log(`Port ${port} is available`, 'success');
      return true;
    }
  }

  async killPortProcess(port = 8081) {
    this.log(`Attempting to kill process on port ${port}...`);
    try {
      if (this.platform === 'win32') {
        const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        const lines = result.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            execSync(`taskkill /F /PID ${pid}`);
            this.log(`Killed process ${pid}`, 'success');
          }
        }
      } else {
        execSync(`kill -9 $(lsof -ti:${port})`);
        this.log(`Killed process on port ${port}`, 'success');
      }
    } catch (error) {
      this.log(`No process found on port ${port} or already killed`, 'info');
    }
  }

  async clearMetroCache() {
    this.log('Clearing Metro cache...');
    try {
      // Clear Metro cache
      execSync('npx react-native start --reset-cache', { stdio: 'pipe' });
      this.log('Metro cache cleared', 'success');
    } catch (error) {
      this.log('Error clearing Metro cache, trying alternative method...', 'error');
      try {
        // Alternative cache clearing
        const cacheDir = path.join(os.tmpdir(), 'metro-cache');
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true });
          this.log('Metro cache directory removed', 'success');
        }
      } catch (altError) {
        this.log('Could not clear cache automatically', 'error');
      }
    }
  }

  async clearReactNativeCache() {
    this.log('Clearing React Native cache...');
    try {
      // Clear React Native cache
      if (this.platform === 'win32') {
        execSync('rmdir /s /q node_modules && npm install', { stdio: 'pipe' });
      } else {
        execSync('rm -rf node_modules && npm install', { stdio: 'pipe' });
      }
      this.log('React Native cache cleared', 'success');
    } catch (error) {
      this.log('Error clearing React Native cache', 'error');
    }
  }

  async setupADBForwarding() {
    this.log('Setting up ADB port forwarding...');
    try {
      // Check if ADB is available
      execSync('adb version', { stdio: 'pipe' });
      
      // Setup port forwarding
      execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'pipe' });
      this.log('ADB port forwarding setup successful', 'success');
      
      // List connected devices
      const devices = execSync('adb devices', { encoding: 'utf8' });
      this.log(`Connected devices:\n${devices}`);
      
    } catch (error) {
      this.log('ADB not available or no devices connected', 'error');
      this.issues.push('ADB port forwarding failed');
      this.solutions.push('Connect Android device and enable USB debugging');
    }
  }

  async checkNetworkConnectivity() {
    this.log('Checking network connectivity...');
    try {
      const networkInterfaces = os.networkInterfaces();
      const addresses = [];
      
      for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
          }
        }
      }
      
      this.log(`Available network addresses: ${addresses.join(', ')}`);
      
      if (addresses.length === 0) {
        this.issues.push('No external network interfaces found');
        this.solutions.push('Check network connection');
      }
      
    } catch (error) {
      this.log('Error checking network connectivity', 'error');
    }
  }

  async updateMetroConfig() {
    this.log('Updating Metro configuration...');
    const configPath = path.join(this.projectRoot, 'metro.config.js');
    
    const newConfig = `const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8081,
    host: '0.0.0.0', // Allow connections from any IP
  },
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'gif', 'webp', 'svg'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
`;

    try {
      fs.writeFileSync(configPath, newConfig);
      this.log('Metro configuration updated', 'success');
    } catch (error) {
      this.log('Error updating Metro configuration', 'error');
    }
  }

  async startMetroServer() {
    this.log('Starting Metro server...');
    try {
      // Start Metro with reset cache
      const metro = spawn('npx', ['react-native', 'start', '--reset-cache', '--verbose'], {
        stdio: 'inherit',
        shell: true
      });

      metro.on('error', (error) => {
        this.log(`Metro server error: ${error.message}`, 'error');
      });

      this.log('Metro server started. Check the output above for any errors.', 'success');
      this.log('If successful, you should see "Metro waiting on exp://..." or similar message', 'info');
      
    } catch (error) {
      this.log(`Error starting Metro server: ${error.message}`, 'error');
    }
  }

  async runDiagnostics() {
    this.log('🔍 Starting Metro Bundler Diagnostics...', 'info');
    this.log('=====================================', 'info');

    // Run all diagnostic checks
    await this.checkPortAvailability();
    await this.checkNetworkConnectivity();
    
    // Display issues and solutions
    if (this.issues.length > 0) {
      this.log('\n🚨 Issues Found:', 'error');
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'error');
      });
      
      this.log('\n💡 Suggested Solutions:', 'info');
      this.solutions.forEach((solution, index) => {
        this.log(`${index + 1}. ${solution}`, 'info');
      });
    } else {
      this.log('\n✅ No issues detected with basic checks', 'success');
    }
  }

  async runFullFix() {
    this.log('🔧 Starting Full Metro Fix Process...', 'info');
    this.log('===================================', 'info');

    // Step 1: Kill any existing Metro processes
    await this.killPortProcess(8081);
    
    // Step 2: Clear caches
    await this.clearMetroCache();
    
    // Step 3: Setup ADB forwarding
    await this.setupADBForwarding();
    
    // Step 4: Update Metro config
    await this.updateMetroConfig();
    
    // Step 5: Start Metro server
    this.log('\n🚀 Starting Metro server with fresh configuration...', 'info');
    await this.startMetroServer();
  }
}

// CLI Interface
const args = process.argv.slice(2);
const troubleshooter = new MetroTroubleshooter();

if (args.includes('--diagnose') || args.includes('-d')) {
  troubleshooter.runDiagnostics();
} else if (args.includes('--fix') || args.includes('-f')) {
  troubleshooter.runFullFix();
} else {
  console.log(`
🔧 Metro Bundler Troubleshooter

Usage:
  node scripts/metro-fix.js --diagnose    Run diagnostics only
  node scripts/metro-fix.js --fix         Run full fix process

Options:
  -d, --diagnose    Check for common Metro issues
  -f, --fix         Attempt to fix Metro bundler issues automatically
  
Examples:
  node scripts/metro-fix.js -d
  node scripts/metro-fix.js -f
`);
}