const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const locator = require('../config/locator');
const setupDriver = require('../utils/driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('../utils/test_utils');

async function testLoginFail() {
  let driver;

  try {
    logStep("Setting up WebDriver");
    driver = await setupDriver(config.Browser);

    logStep("Navigating to application URL");
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    logStep("Attempting to login with invalid credentials");
    await driver.findElement(By.linkText("Login")).click();
    const emailInput = await driver.findElement(By.id("email"));
    const passwordInput = await driver.findElement(By.id("password"));

    await emailInput.sendKeys("testuser1298@gmail.com");
    await passwordInput.sendKeys("123456");

    logStep("Submitting login form");
    await driver.findElement(By.css("button[type='submit']")).click();

    logStep("Verifying error message");
    await driver.wait(until.elementLocated(By.className("invalid-feedback")), 10000);
    const errorMessageElement = await driver.findElement(By.className("invalid-feedback"));
    const errorMessage = await errorMessageElement.getText();

    const expectedError = "These credentials do not match our records.";
    if (errorMessage.includes(expectedError)) {
      logSuccess(`Expected error message '${expectedError}' was displayed`);
    } else {
      logFailure(`Expected '${expectedError}', but got '${errorMessage}'`);
    }

  } catch (error) {
    logFailure("Test execution failed", error);
  } finally {
    if (driver) {
      logStep("Closing WebDriver");
      await driver.quit();
    }
  }
}

testLoginFail();