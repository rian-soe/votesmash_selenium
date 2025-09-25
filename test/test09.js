const { Builder, By, until } = require("selenium-webdriver");
const config = require("../config/config");
const setupDriver = require("../utils/driver_setup");
const { logStep, logSuccess, logFailure } = require("../utils/test_utils");

async function testCompletedTourResult() {
  let driver;

  try {
    logStep("Setting up WebDriver");
    driver = await setupDriver(config.Browser);

    logStep("Navigating to homepage");
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    logStep("Logging in with valid credentials");
    await driver.findElement(By.linkText("Login")).click();
    await driver.findElement(By.id("email")).sendKeys("james@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("james123");
    await driver.findElement(By.css("button[type='submit']")).click();
    logSuccess("Login successful");

    logStep("Navigating to Tour List via dropdown");
    const tourDropdownToggle = await driver.findElement(By.xpath("//button[contains(text(), 'Tour Management')]"));
    await tourDropdownToggle.click();
    await driver.findElement(By.linkText("Tour List")).click();

    await driver.wait(until.elementLocated(By.css("table")), 10000);
    const tourRows = await driver.findElements(By.css("table tbody tr"));
    if (tourRows.length === 0) throw new Error("No tours found in list");

    logStep("Searching for a visible Completed button");
    let completedBtn = null;
    let tourId = null;

    for (const row of tourRows) {
      const buttons = await row.findElements(By.xpath(".//td[6]/a[contains(text(), 'Completed')]"));
      if (buttons.length > 0 && await buttons[0].isDisplayed()) {
        completedBtn = buttons[0];
        tourId = await row.findElement(By.css("td:nth-child(3)")).getText();
        break;
      }
    }

    if (!completedBtn) throw new Error("No visible Completed button found");

    logStep(`Clicking Completed button for tour ID ${tourId}`);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", completedBtn);
    await driver.executeScript("arguments[0].click();", completedBtn);
    await driver.wait(until.urlContains(`/admin/tour/${tourId}`), 10000);

    logStep("Verifying result table on completed tour page");
    const resultTable = await driver.wait(until.elementLocated(By.css("table.table-striped")), 10000);
    const headers = await resultTable.findElements(By.css("thead th"));
    const headerTexts = await Promise.all(headers.map(h => h.getText()));

    const expectedHeaders = ["Settlement", "Quantity", "Winning Amount"];
    const missingHeaders = expectedHeaders.filter(h => !headerTexts.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing expected headers: ${missingHeaders.join(", ")}`);
    }

    logSuccess(`Completed tour result table verified for tour ID ${tourId}`);

  } catch (error) {
    logFailure(error.message);
  } finally {
    if (driver) {
      logStep("Closing WebDriver");
      await driver.quit();
    }
  }
}

testCompletedTourResult();
