const { Builder, By, until } = require("selenium-webdriver");
const config = require("../config/config");
const setupDriver = require("../utils/driver_setup");
const { logStep, logSuccess, logFailure, logInfo } = require("../utils/test_utils");

async function testTourListActions() {
  let driver;

  try {
    logStep("Setting up WebDriver");
    driver = await setupDriver(config.Browser);

    logStep("Navigating to homepage");
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    // Login
    logStep("Logging in with valid credentials");
    await driver.findElement(By.linkText("Login")).click();
    await driver.findElement(By.id("email")).sendKeys("james@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("james123");
    await driver.findElement(By.css("button[type='submit']")).click();
    logSuccess("Login successful");

    // Navigate to Tour List
    logStep("Navigating to Tour List via dropdown");
    const tourDropdownToggle = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Tour Management')]")),
      10000
    );
    await tourDropdownToggle.click();

    const tourListLink = await driver.wait(
      until.elementLocated(By.xpath("//a[contains(text(), 'Tour List')]")),
      10000
    );
    await tourListLink.click();

    // Wait for table to load
    await driver.wait(until.elementLocated(By.css("table")), 10000);

    // Pagination
    logStep("Clicking pagination link to page 2");

    const pageTwoLink = await driver.wait(
    until.elementLocated(By.xpath("//a[@class='page-link' and text()='2']")),
    10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", pageTwoLink);
    await driver.sleep(300); // Let layout settle
    await driver.executeScript("arguments[0].click();", pageTwoLink);


    logStep("Clicking back to pagination link to page 1");

    const pageOneLink = await driver.wait(
    until.elementLocated(By.xpath("//a[@class='page-link' and text()='1']")),
    10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", pageOneLink);
    await driver.sleep(300); // Let layout settle
    await driver.executeScript("arguments[0].click();", pageOneLink);


    // Actions on first tour
    logStep("Performing actions on first tour item");
    const tourRows = await driver.findElements(By.css("table tbody tr"));
    if (tourRows.length === 0) throw new Error("No tours found in list");

    await tourRows[0].findElement(By.css(".btn:nth-child(2)")).click(); // Edit or action button
    await driver.sleep(500);

    logStep("Viewing tour details");

    // Re-fetch the tour rows after pagination or reload
    const refreshedTourRows = await driver.findElements(By.css("table tbody tr"));
    if (refreshedTourRows.length === 0) throw new Error("No tours found after refresh");

    const viewIcon = await refreshedTourRows[0].findElement(By.css(".bi-eye-fill"));
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", viewIcon);
    await viewIcon.click();


    // Click additional detail element
    logStep("Clicking additional detail element");
    await driver.findElement(By.css(".col-md-6 > .text-secondary")).click();
    await driver.sleep(500);

    // Repeat navigation and actions
    logStep("Repeating navigation and actions");
    await tourDropdownToggle.click();
    await tourListLink.click();
    if (tourRows.length > 1) {
      await tourRows[1].findElement(By.css(".btn:nth-child(2)")).click();
      await driver.sleep(500);
    }

    // Completed tab
    logStep("Opening Completed tab");
    await driver.findElement(By.linkText("Completed")).click();
    await driver.sleep(1000);

    const completedRows = await driver.findElements(By.css("table tbody tr"));
    if (completedRows.length >= 6) {
      await completedRows[5].findElement(By.css(".btn:nth-child(2)")).click();
    }

    // Table cell clicks
    logStep("Clicking specific table cells");
    await driver.findElement(By.css("tr:nth-child(1) > td:nth-child(2)")).click();
    await driver.findElement(By.css("tr:nth-child(1) > td:nth-child(4)")).click();

    // Logout
    logStep("Logging out");
    await tourDropdownToggle.click();
    await driver.findElement(By.linkText("Logout")).click();
    logSuccess("Logout successful");

    logSuccess("Tour list actions test completed successfully");

  } catch (error) {
    logFailure(error.message);
  } finally {
    if (driver) {
      logStep("Closing WebDriver");
      await driver.quit();
    }
  }
}

testTourListActions();
