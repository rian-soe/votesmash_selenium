const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const setupDriver = require('./driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('./test_utils');

async function testInvalidDate() {
  let driver;

  try {
    logStep("Setting up WebDriver");
    driver = await setupDriver(config.Browser);

    logStep("Navigating to application URL");
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    logStep("Logging in with valid credentials");
    await driver.findElement(By.linkText("Login")).click();
    await driver.findElement(By.id("email")).sendKeys("james@gmail.com");
    await driver.findElement(By.id("password")).click();
    await driver.findElement(By.id("password")).sendKeys("james123");
    await driver.findElement(By.css("button[type='submit']")).click();

    logStep("Navigating to Add Tour page");
    await driver.findElement(By.linkText("Add Tour")).click();

    logStep("Filling tour details");
    await driver.findElement(By.id("title")).click();
    await driver.findElement(By.id("title")).sendKeys("Testing Tour1");

    await driver.findElement(By.name("category_id")).click();
    {
      const dropdown = await driver.findElement(By.name("category_id"));
      await dropdown.findElement(By.xpath("//option[. = 'Politics']")).click();
    }

    await driver.findElement(By.name("question")).click();
    await driver.findElement(By.name("question")).sendKeys("what is test question");

    await driver.findElement(By.id("tour_date")).click();
    await driver.findElement(By.id("tour_date")).sendKeys("2025-05-17");

    await driver.wait(until.elementLocated(By.id("tour_time")), 5000);
    await driver.wait(until.elementIsVisible(await driver.findElement(By.id("tour_time"))), 5000);
    await driver.executeScript("document.getElementById('tour_time').value = '11:00'");
    
    logStep("Uploading cover image");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("cover_image")));
    await driver.findElement(By.id("cover_image")).sendKeys("C:\\Users\\Administrator\\Pictures\\Screenshots\\p3.png");
    
    logStep("Adding video and event links");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("video_link")));
    await driver.findElement(By.id("video_link")).sendKeys("http://youtube/videolink");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("live_event_link")));
    await driver.findElement(By.id("live_event_link")).sendKeys("http://zoom/eventlink");
    
    logStep("Adding tour options");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".mb-2")));
    await driver.findElement(By.css(".mb-2")).sendKeys("how are you");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(4)")));
    await driver.findElement(By.css(".border:nth-child(4)")).sendKeys("good");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(5)")));
    await driver.findElement(By.css(".border:nth-child(5)")).sendKeys("yes");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(6)")));
    await driver.findElement(By.css(".border:nth-child(6)")).sendKeys("no");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(7)")));
    await driver.findElement(By.css(".border:nth-child(7)")).sendKeys("not bad");
    
    logStep("Submitting tour form");
    const submitButton = await driver.wait(until.elementLocated(By.css('button.btn.btn-secondary.mb-3')), 10000);

    // Ensure it's displayed and enabled
    await driver.wait(until.elementIsVisible(submitButton), 10000);
    await driver.wait(until.elementIsEnabled(submitButton), 10000);

    // Scroll it into view and then try to click using JavaScript
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); arguments[0].click();", submitButton);

    logStep("Verifying date validation error");
    await driver.wait(until.elementLocated(By.className("invalid-feedback")), 10000);
    const errorMessageElement = await driver.findElement(By.className("invalid-feedback"));
    const errorMessage = await errorMessageElement.getText();

    const expectedError = "The tour date field must be a date after today.";
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

testInvalidDate();


