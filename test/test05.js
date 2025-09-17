const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const setupDriver = require('./driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('./test_utils');

async function testTourCreate() {
  let driver;

  try {
    logStep("Starting tour creation test");
    driver = await setupDriver(config.Browser);
    await driver.get(config.URL);
    await driver.manage().window().maximize();

    // Login
    logStep("Logging in with valid credentials");
    await driver.findElement(By.linkText("Login")).click();
    await driver.findElement(By.id("email")).sendKeys("james@gmail.com");
    await driver.findElement(By.id("password")).click();
    await driver.findElement(By.id("password")).sendKeys("james123");
    await driver.findElement(By.css("button[type='submit']")).click();
    logSuccess("Login successful");

    // Add Tour
    logStep("Navigating to Add Tour page");
    await driver.findElement(By.linkText("Add Tour")).click();

    // Fill tour details
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
    await driver.findElement(By.id("tour_date")).sendKeys("2025-12-10");

    await driver.wait(until.elementLocated(By.id("tour_time")), 5000);
    await driver.wait(until.elementIsVisible(await driver.findElement(By.id("tour_time"))), 5000);
    await driver.executeScript("document.getElementById('tour_time').value = '11:00'");
    logSuccess("Tour details filled successfully");

    // Upload cover image
    logStep("Adding media and options");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("cover_image")));
    await driver.findElement(By.id("cover_image")).sendKeys("C:\\Users\\Administrator\\Pictures\\Screenshots\\p3.png");
    
    // Add video and event links
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("video_link")));
    await driver.findElement(By.id("video_link")).sendKeys("http://youtube/videolink");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("live_event_link")));
    await driver.findElement(By.id("live_event_link")).sendKeys("http://zoom/eventlink");
    
    // Add tour options
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".mb-2")));
    await driver.findElement(By.css(".mb-2")).sendKeys("how are you");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(4)")));
    await driver.findElement(By.css(".border:nth-child(4)")).sendKeys("yes");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(5)")));
    await driver.findElement(By.css(".border:nth-child(5)")).sendKeys("no");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(6)")));
    await driver.findElement(By.css(".border:nth-child(6)")).sendKeys("very good");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(7)")));
    await driver.findElement(By.css(".border:nth-child(7)")).sendKeys("not bad");

    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.css(".border:nth-child(8)")));
    await driver.findElement(By.css(".border:nth-child(8)")).sendKeys("very bad");
    logSuccess("Media and options added successfully");
    
    // Submit tour form
    logStep("Submitting tour form");
    const submitButton = await driver.wait(until.elementLocated(By.css('button.btn.btn-secondary.mb-3')), 10000);
    await driver.wait(until.elementIsVisible(submitButton), 10000);
    await driver.wait(until.elementIsEnabled(submitButton), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); arguments[0].click();", submitButton);
    await driver.sleep(3000); 

    // Verify tour creation
    logStep("Verifying tour creation");
    const element = await driver.wait(until.elementLocated(
      By.xpath("//*[contains(text(), 'Ready to reimage your diversity & equality platform?')]")
    ), 10000);

    const isVisible = await element.isDisplayed();
    if (!isVisible) {
      throw new Error("Tour creation failed - text is present but not visible");
    }
    logSuccess("Tour creation verified");

    // Verify tour in list
    logStep("Verifying tour in list");
    const testTitleLink = await driver.findElement(By.linkText("Testing Tour1"));
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", testTitleLink);
    await driver.sleep(1000);
    await testTitleLink.click();
    logSuccess("Tour found in list");
    
    // Verify tour details page
    logStep("Verifying tour details page");
    const tourTitle = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Attract votes for your MVC in this tour!')]")), 15000);
    const isTour = await tourTitle.isDisplayed();
    
    if (!isTour) {
      throw new Error("Failed to find tour details page");
    }
    logSuccess("Tour details page verified");

    logSuccess("Tour creation test completed successfully");

  } catch (error) {
    logFailure(error.message);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

testTourCreate();
