const { Builder, By, Key, until } = require('selenium-webdriver');
const config = require('../config/config');
const setupDriver = require('../utils/driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('../utils/test_utils');

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

    logStep("Navigating to Add Tour page via dropdown");

    const tourDropdownToggle = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Tour Management')]")),
      10000
    );
    await tourDropdownToggle.click();

    const addTourLink = await driver.wait(
      until.elementLocated(By.xpath("//a[contains(text(), 'Add Tour')]")),
      10000
    );
    await addTourLink.click();


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
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const yyyy = pastDate.getFullYear();
    const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
    const dd = String(pastDate.getDate()).padStart(2, '0');
    const formattedPastDate = `${yyyy}-${mm}-${dd}`;

    await driver.executeScript(`
      const dateInput = document.getElementById('tour_date');
      dateInput.value = '${formattedPastDate}';
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    `);


    await driver.wait(until.elementLocated(By.id("tour_time")), 5000);
    await driver.wait(until.elementIsVisible(await driver.findElement(By.id("tour_time"))), 5000);
    await driver.executeScript("document.getElementById('tour_time').value = '11:00'");
    
    logStep("Uploading cover image");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("cover_image")));
    await driver.findElement(By.id("cover_image")).sendKeys("C:\\Users\\riansoe\\Pictures\\RianSoe.png");
    
    logStep("Adding video and event links");
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("video_link")));
    await driver.findElement(By.id("video_link")).sendKeys("http://youtube/videolink");
    
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", await driver.findElement(By.id("live_event_link")));
    await driver.findElement(By.id("live_event_link")).sendKeys("http://zoom/eventlink");
    
    logStep("Filling dynamic question and options");

    const questionInput = await driver.wait(until.elementLocated(By.css("input[placeholder='Enter your question here']")), 10000);
    await questionInput.sendKeys("Is this date valid?");

    const optionInputs = await driver.findElements(By.css("input[placeholder^='Enter option']"));
    const optionTexts = ["Yes", "No", "Maybe", "Not sure"];

    for (let i = 0; i < optionInputs.length && i < optionTexts.length; i++) {
      await optionInputs[i].sendKeys(optionTexts[i]);
    }

    
    // Submit tour form
    logStep("Submitting tour form");
    const submitButton = await driver.wait(until.elementLocated(By.id("createTourBtn")), 10000);
    await driver.wait(until.elementIsVisible(submitButton), 10000);
    await driver.wait(until.elementIsEnabled(submitButton), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); arguments[0].click();", submitButton);
    await driver.sleep(3000); 

    logStep("Verifying date validation error");

    const dateInput = await driver.findElement(By.id("tour_date"));
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", dateInput);
    await driver.sleep(500); // Let Alpine render the error


    const dateErrorElement = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'The tour must start at least 5 hours from now.')]")),
      10000
    );
    await driver.wait(until.elementIsVisible(dateErrorElement), 10000);
    
    const errorMessage = await dateErrorElement.getText();
    const expectedError = "The tour must start at least 5 hours from now.";
    
    if (errorMessage.includes(expectedError)) {
      logSuccess(`Expected error message '${expectedError}' was displayed`);
    } else {
      logFailure(`Expected '${expectedError}', but got '${errorMessage}'`);
    }
    

    const allErrors = await driver.findElements(By.className("invalid-feedback"));
    for (let i = 0; i < allErrors.length; i++) {
      const msg = await allErrors[i].getText();
      logInfo(`Validation error ${i + 1}: ${msg}`);
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


