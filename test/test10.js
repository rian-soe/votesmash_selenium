const { Builder, By, until } = require("selenium-webdriver");
const config = require("../config/config");
const setupDriver = require("../utils/driver_setup");
const { logStep, logSuccess, logFailure } = require("../utils/test_utils");

async function testActiveTourDetail() {
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

    logStep("Clicking Active filter");

    const activeFilterBtn = await driver.wait(
    until.elementLocated(By.xpath("//a[contains(text(), 'Active') and contains(@class, 'btn')]")),
    10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", activeFilterBtn);
    await driver.executeScript("arguments[0].click();", activeFilterBtn);

    // Wait for Alpine.js to update the tour list
    await driver.sleep(1000);
    await driver.wait(until.elementLocated(By.css("table tbody tr")), 10000);

    const tourRows = await driver.findElements(By.css("table tbody tr"));
    if (tourRows.length === 0) throw new Error("No active tours found in list");

    logStep("Searching for a visible Active button");
    let activeBtn = null;
    let tourId = null;

    for (const row of tourRows) {
      const buttons = await row.findElements(By.xpath(".//td[6]/a[contains(text(), 'Active')]"));
      if (buttons.length > 0 && await buttons[0].isDisplayed()) {
        activeBtn = buttons[0];
        tourId = await row.findElement(By.css("td:nth-child(3)")).getText();
        break;
      }
    }

    if (!activeBtn) throw new Error("No visible Active button found");

    logStep(`Clicking Active button for tour ID ${tourId}`);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", activeBtn);
    await driver.executeScript("arguments[0].click();", activeBtn);
    await driver.wait(until.urlContains(`/tour/${tourId}/visit`), 10000);

    logStep("Verifying tour detail page content");
    const tourHeader = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Attract votes for your MVC in this tour!')]")),
      10000
    );
    const isVisible = await tourHeader.isDisplayed();
    if (!isVisible) throw new Error("Tour detail header not visible");

    logSuccess(`Active tour detail page verified for tour ID ${tourId}`);

  } catch (error) {
    logFailure(error.message);
  } finally {
    if (driver) {
      logStep("Closing WebDriver");
      await driver.quit();
    }
  }
}

testActiveTourDetail();
