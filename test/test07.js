const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const setupDriver = require('../utils/driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('../utils/test_utils');

async function testBuyTour() {
  let driver;

  try {
    logStep("Setting up WebDriver");
    driver = await setupDriver(config.Browser);

    logStep("Navigating to application URL");
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    logStep("Navigating to login page");
    const loginLink = await driver.wait(until.elementLocated(By.linkText("Login")), 10000);
    await loginLink.click();

    logStep("Entering login credentials");
    const emailInput = await driver.wait(until.elementLocated(By.id("email")), 10000);
    await emailInput.sendKeys("tester@gmail.com");

    const passwordInput = await driver.wait(until.elementLocated(By.id("password")), 10000);
    await passwordInput.sendKeys("12345678");

    logStep("Submitting login form");
    await driver.findElement(By.css("button[type='submit']")).click();

    logStep("Verifying successful login");
    const updateProfile = await driver.wait(until.elementLocated(
      By.xpath("//*[contains(text(), 'Update Profile')]")
    ), 10000);

    const isLoggedin = await updateProfile.isDisplayed();
    if (isLoggedin) {
      logSuccess("Successfully logged in");
    } else {
      logFailure("Failed to login");
      throw new Error("Login failed - Update Profile element not visible");
    }

    logStep("Navigating to Tours page");
    await driver.wait(until.elementLocated(By.linkText("Tours")), 10000);
    const tourLink = await driver.findElement(By.linkText("Tours"));
    await tourLink.click();

    logStep("Verifying Tours page load");
    const element = await driver.wait(until.elementLocated(
      By.xpath("//*[contains(text(), 'Ready to reimage your diversity & equality platform?')]")
    ), 10000);

    const isVisible = await element.isDisplayed();
    if (isVisible) {
      logSuccess("Tours page loaded successfully");
    } else {
      logFailure("Tours page failed to load");
    }

    logStep("Selecting test tour");
    const testTitleLink = await driver.findElement(By.linkText("Testing Tour1"));
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", testTitleLink);
    await driver.sleep(1000);
    await testTitleLink.click();

    logStep("Verifying tour details page");
    const tourTitle = await driver.wait(until.elementLocated(By.css('.fw-bold')), 10000);
    const isTour = await tourTitle.isDisplayed();

    if (isTour) {
      logSuccess("Successfully navigated to tour details");
    } else {
      logFailure("Failed to navigate to tour details");
    }

    logStep("Purchasing tour");
    const purchaseTourButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Purchase Tour')]")), 10000);
    await purchaseTourButton.click();

    logStep("Confirming purchase");
    await driver.wait(until.elementLocated(By.id("userConfirm")), 10000);
    await driver.findElement(By.id("userConfirm")).click();
    await driver.findElement(By.id("userConfirm")).sendKeys("yes");

    logStep("Submitting purchase");
    await driver.wait(until.elementLocated(By.css(".px-2")), 10000);
    await driver.findElement(By.css(".px-2")).click();

    logStep("Verifying purchase completion");
    const joinTourSelector = await driver.findElement(By.linkText("Join Tour"));
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", joinTourSelector);
    const linkText = await joinTourSelector.getText();

    if (linkText.includes("Join Tour")) {
      logSuccess("Tour purchase completed successfully");
    } else {
      logFailure("Tour purchase failed - Join Tour link not found");
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

testBuyTour();
