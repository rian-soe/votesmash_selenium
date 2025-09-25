const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const config = require('../config/config');

async function setupDriver(browserName) {
    // Decide whether to use remote Selenium (Grid) or local
    let builder = config.RemoteUrl
        ? new Builder().usingServer(config.RemoteUrl).forBrowser(browserName)
        : new Builder().forBrowser(browserName);

    if (browserName === 'chrome') {
        const options = new chrome.Options();

        // Only add headless if environment requires it
        if (config.Headless) {
            options.addArguments('--headless=new'); // Chrome 109+ headless mode
        }

        // Set window size
        if (config.WindowSize) {
            options.addArguments(`--window-size=${config.WindowSize}`);
        }

        // Basic server-friendly arguments
        options.addArguments(
            '--no-sandbox',
            '--disable-extensions',
            '--disable-popup-blocking'
        );

        // Attach options to builder
        builder.setChromeOptions(options);

    } else if (browserName === 'firefox') {
        const options = new firefox.Options();
        if (config.Headless) {
            options.addArguments('--headless');
        }
        builder.setFirefoxOptions(options);
    } else {
        throw new Error(`Unsupported browser: ${browserName}`);
    }

    return await builder.build();
}

module.exports = setupDriver;
