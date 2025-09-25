const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const setupDriver = require('../utils/driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('../utils/test_utils');

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
logStep("Navigating to Add Tour page via dropdown");

// Wait for the dropdown toggle button
const tourDropdownToggle = await driver.wait(
  until.elementLocated(By.xpath("//button[contains(text(), 'Tour Management')]")),
  10000
);
await driver.wait(until.elementIsVisible(tourDropdownToggle), 10000);
await tourDropdownToggle.click();

// Wait for the "Add Tour" link to appear and click it
const addTourLink = await driver.wait(
  until.elementLocated(By.xpath("//a[contains(text(), 'Add Tour')]")),
  10000
);
await driver.wait(until.elementIsVisible(addTourLink), 10000);
await addTourLink.click();


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

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const nextDay = `${yyyy}-${mm}-${dd}`;

    await driver.executeScript(`
      const dateInput = document.getElementById('tour_date');
      dateInput.value = '${nextDay}';
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    `);


    await driver.wait(until.elementLocated(By.id("tour_time")), 5000);
    await driver.wait(until.elementIsVisible(await driver.findElement(By.id("tour_time"))), 5000);
    await driver.executeScript("document.getElementById('tour_time').value = '11:00'");
    logSuccess("Tour details filled successfully");

    // Upload cover image
    logStep("Adding media and options");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("cover_image")));
    await driver.findElement(By.id("cover_image")).sendKeys("C:\\Users\\riansoe\\Pictures\\RianSoe.png");
    
    // Add video and event links
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("video_link")));
    await driver.findElement(By.id("video_link")).sendKeys("http://youtube/videolink");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("live_event_link")));
    await driver.findElement(By.id("live_event_link")).sendKeys("http://zoom/eventlink");
    
    // Add tour options
    logStep("Filling dynamic question and options");

    // Wait for the first question input
    const questionInput = await driver.wait(until.elementLocated(By.css("input[placeholder='Enter your question here']")), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", questionInput);
    await questionInput.sendKeys("How do you feel about this tour?");
    
    // Fill options
    const optionInputs = await driver.findElements(By.css("input[placeholder^='Enter option']"));
    const optionTexts = ["Excellent", "Good", "Average", "Poor"];
    
    for (let i = 0; i < optionInputs.length && i < optionTexts.length; i++) {
      await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", optionInputs[i]);
      await optionInputs[i].sendKeys(optionTexts[i]);
    }
    

    logSuccess("Media and options added successfully");
    
    // Submit tour form
    logStep("Submitting tour form");
    const submitButton = await driver.wait(until.elementLocated(By.id("createTourBtn")), 10000);
    await driver.wait(until.elementIsVisible(submitButton), 10000);
    await driver.wait(until.elementIsEnabled(submitButton), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); arguments[0].click();", submitButton);
    await driver.sleep(3000); 

    // Verify tour creation
    logStep("Verifying tour creation");
    const confirmationText = "Are you ready to go on a challenge & consensus tour?";
    await driver.wait(until.elementTextContains(
      driver.findElement(By.tagName("body")), confirmationText
    ), 15000);
    logSuccess("Tour creation verified");


    logStep("Filtering tour list to 'Active'");

    // Click the "Active" filter button
    const activeFilterBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Active')]")),
      10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", activeFilterBtn);
    await activeFilterBtn.click();
    await driver.sleep(1000); // Let Alpine update the view

    logStep("Verifying tour in active list");

    // Wait for the tour title span to appear
    const tourTitleSpan = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(text(), 'Testing Tour1')]")),
      10000
    );
    await driver.wait(until.elementIsVisible(tourTitleSpan), 10000);

    // Click the parent <a> tag
    const tourLink = await tourTitleSpan.findElement(By.xpath("ancestor::a"));
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", tourLink);
    await driver.sleep(1000);
    await tourLink.click();

    logSuccess("Tour found in active list");


    
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
