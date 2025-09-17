const { Builder, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const config = require('../config/config');

async function setupDriver(browserName) {
  let builder = new Builder().forBrowser(browserName);

  if (browserName === 'chrome') {
    const options = new chrome.Options();
    
    // Configure headless mode for server environments
    if (config.Headless) {
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--disable-extensions');
      options.addArguments('--disable-web-security');
      options.addArguments('--disable-features=VizDisplayCompositor');
    }
    
    // Set window size
    if (config.WindowSize) {
      options.addArguments(`--window-size=${config.WindowSize}`);
    }
    
    // Additional server-friendly options
    options.addArguments('--disable-background-timer-throttling');
    options.addArguments('--disable-backgrounding-occluded-windows');
    options.addArguments('--disable-renderer-backgrounding');
    options.addArguments('--disable-features=TranslateUI');
    options.addArguments('--disable-ipc-flooding-protection');
    
    builder.setChromeOptions(options);
    
    // Let Selenium manage the ChromeDriver automatically
    // No need to set Chrome service - Selenium will handle driver management
    
  } else if (browserName === 'firefox') {
    const options = new firefox.Options();
    
    // Configure headless mode for server environments
    if (config.Headless) {
      options.addArguments('--headless');
    }
    
    builder.setFirefoxOptions(options);
    
    // Let Selenium manage the GeckoDriver automatically
    // No need to set Firefox service - Selenium will handle driver management
    
  } else {
    throw new Error(`Unsupported browser: ${browserName}`);
  }

  return await builder.build();
}

module.exports = setupDriver;