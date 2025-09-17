const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const locator = require('../config/locator');
const setupDriver = require('./driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('./test_utils');

async function testRegisterPassword() {
  let driver;

  try {
    logStep("Setting up WebDriver");
    driver = await setupDriver(config.Browser);

    logStep("Navigating to application URL");
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    logStep("Navigating to Sign Up page");
    await driver.findElement(By.linkText("Sign Up")).click();

    logStep("Filling registration form with short password");
    await driver.findElement(By.id("email")).sendKeys("tester99@gmail.com");
    await driver.findElement(By.id("password")).click();
    await driver.findElement(By.id("password")).sendKeys("12345");
    await driver.findElement(By.name("password_confirmation")).click();
    await driver.findElement(By.name("password_confirmation")).sendKeys("12345");

    logStep("Submitting registration form");
    await driver.findElement(By.css("button[type='submit']")).click();

    logStep("Verifying password length error message");
    await driver.wait(until.elementLocated(By.className("invalid-feedback")), 10000);
    const errorMessageElement = await driver.findElement(By.className("invalid-feedback"));
    const errorMessage = await errorMessageElement.getText();

    const expectedError = "The password field must be at least 8 characters.";
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

testRegisterPassword();