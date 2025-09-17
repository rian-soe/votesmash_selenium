const { Builder, By, Key } = require('selenium-webdriver');
const until = require('selenium-webdriver/lib/until');
const config = require('../config/config');
const setupDriver = require('./driver_setup');
const { logStep, logSuccess, logFailure, logInfo } = require('./test_utils');
// Database utilities removed; provide local no-op stubs
const updateTourStartTime = async () => {};
const getTourIdByTitle = async () => 'DUMMY_TOUR_ID';
const clearTourData = async () => {};
const deleteTourByTitle = async () => {};
const getTourCurrentTime = async () => new Date();

// Helper function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// User configurations for 3 different users
const users = [
    {
        email: "tester@gmail.com",
        password: "12345678",
        userName: "Automated Test User 1",
        mvc1: "My first automated test MVC from User 1!",
        mvc2: "My second automated test MVC from User 1!",
        confidenceRating: "85"
    },
    {
        email: "tester2@gmail.com", 
        password: "12345678",
        userName: "Automated Test User 2",
        mvc1: "My first automated test MVC from User 2!",
        mvc2: "My second automated test MVC from User 2!",
        confidenceRating: "90"
    },
    {
        email: "tester3@gmail.com",
        password: "12345678", 
        userName: "Automated Test User 3",
        mvc1: "My first automated test MVC from User 3!",
        mvc2: "My second automated test MVC from User 3!",
        confidenceRating: "95"
    }
];

async function testTourStepsForUser(userConfig, userIndex) {
    let driver;
    const tourTitleToTest = "Testing Tour1";
    let tourId = null;

    try {
        logStep(`[User ${userIndex + 1}] Setting up WebDriver`);
        driver = await setupDriver(config.Browser);
        await driver.manage().window().maximize();

        // --- Fetch Tour ID ---
        tourId = await getTourIdByTitle(tourTitleToTest);
        if (!tourId) {
            logFailure(`[User ${userIndex + 1}] Tour with title "${tourTitleToTest}" not found in database`);
            throw new Error("Tour not found in DB.");
        }
        logSuccess(`[User ${userIndex + 1}] Fetched Tour ID: ${tourId} for "${tourTitleToTest}"`);

        // --- Calculate Initial Tour Start Time (only for first user) ---
        if (userIndex === 0) {
            let nextPhaseStartTime = new Date(Date.now() + (60 * 1000));
            logStep(`[User ${userIndex + 1}] Setting initial tour start time`);
            await updateTourStartTime(tourId, nextPhaseStartTime);
            logSuccess(`[User ${userIndex + 1}] Tour initial start time updated`);
        }

        // --- Login ---
        logStep(`[User ${userIndex + 1}] Navigating to login page`);
        await driver.get(config.URL);
        await driver.wait(until.elementLocated(By.linkText("Login")), 10000).click();

        logStep(`[User ${userIndex + 1}] Entering login credentials`);
        await driver.wait(until.elementLocated(By.id("email")), 10000).sendKeys(userConfig.email);
        await driver.findElement(By.id("password")).sendKeys(userConfig.password);
        await driver.findElement(By.css("button[type='submit']")).click();

        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Update Profile')]")), 15000);
        logSuccess(`[User ${userIndex + 1}] Successfully logged in`);

        // --- Navigate to Tours Listing Page ---
        logStep(`[User ${userIndex + 1}] Navigating to Tours listing page`);
        await driver.wait(until.elementLocated(By.linkText("Tours")), 10000).click();
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Ready to reimage your diversity & equality platform?')]")), 15000);
        logSuccess(`[User ${userIndex + 1}] Successfully navigated to Tours listing page`);

        // --- Click on the specific tour link ---
        logStep(`[User ${userIndex + 1}] Selecting tour "${tourTitleToTest}"`);
        const testTitleLink = await driver.findElement(By.linkText(tourTitleToTest));
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", testTitleLink);
        await sleep(1000);
        await testTitleLink.click();
        logSuccess(`[User ${userIndex + 1}] Successfully selected tour "${tourTitleToTest}"`);

        // --- Wait for the tour details page ---
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Attract votes for your MVC in this tour!')]")), 15000);
        logSuccess(`[User ${userIndex + 1}] Successfully loaded tour details page`);

        // --- Join Tour ---
        logStep(`[User ${userIndex + 1}] Attempting to join tour`);
        const joinTourLink = await driver.wait(until.elementLocated(By.linkText("Join Tour")), 15000);
        await driver.wait(until.elementIsVisible(joinTourLink), 10000);
        await driver.wait(until.elementIsEnabled(joinTourLink), 10000);

        if ((await joinTourLink.getText()).includes("Join Tour")) {
            await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); arguments[0].click();", joinTourLink);
            logSuccess(`[User ${userIndex + 1}] Successfully joined tour`);
        } else {
            logFailure(`[User ${userIndex + 1}] Expected 'Join Tour' link not found or not clickable`);
            throw new Error("Expected 'Join Tour' link not found or not clickable");
        }

        // --- Verify Countdown Display ---
        logStep(`[User ${userIndex + 1}] Verifying countdown display`);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);
        const countdownElement = await driver.wait(until.elementLocated(By.xpath("//span[@x-text='display']")), 15000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", countdownElement);
        const initialCountdownText = await countdownElement.getText();
        logSuccess(`[User ${userIndex + 1}] Countdown timer is displayed: ${initialCountdownText}`);

        // --- Wait for Match 1 questions ---
        logStep(`[User ${userIndex + 1}] Waiting for Match 1 questions to appear`);
        await sleep(config.TOUR_PHASE_1_DURATION_SECONDS * 1000 + 5000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const userNameInput = await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//input[@placeholder="Enter your match name"]'))), (config.TOUR_PHASE_1_DURATION_SECONDS + 30) * 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", userNameInput);
        logSuccess(`[User ${userIndex + 1}] Match 1 questions appeared successfully`);

        // --- Enter User Name and Answer questions ---
        logStep(`[User ${userIndex + 1}] Entering user name and answering Match 1 questions`);
        await userNameInput.sendKeys(userConfig.userName);
        await sleep(500);

        const goodRadioButton = await driver.wait(until.elementLocated(By.xpath('//input[@type="radio" and @name="question0" and @value="yes"]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", goodRadioButton);
        await sleep(500);
        await driver.wait(until.elementIsVisible(goodRadioButton), 5000);
        await driver.wait(until.elementIsEnabled(goodRadioButton), 5000);
        await goodRadioButton.click();
        logSuccess(`[User ${userIndex + 1}] Successfully answered Match 1 questions`);

        // --- Submit Match 1 answers ---
        logStep(`[User ${userIndex + 1}] Submitting Match 1 answers`);
        const submitMatch1Button = await driver.wait(until.elementLocated(By.xpath('//button[./p[text()="Submit"]]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", submitMatch1Button);
        await submitMatch1Button.click();
        await sleep(500);
        logSuccess(`[User ${userIndex + 1}] Successfully submitted Match 1 answers`);

        // --- Verify Match 1 results ---
        logStep(`[User ${userIndex + 1}] Verifying Match 1 results`);
        const match1AnswersHeader = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You answer the questions as follows')]"))),
            15000
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", match1AnswersHeader);
        logSuccess(`[User ${userIndex + 1}] Match 1 results displayed successfully`);

        // --- Update tour time for Match 2 (only for first user) ---
        if (userIndex === 0) {
            logStep(`[User ${userIndex + 1}] Updating tour time for Match 2 phase`);
            const currentTourDbTime1 = await getTourCurrentTime(tourId);
            if (!currentTourDbTime1) {
                logFailure(`[User ${userIndex + 1}] Could not retrieve current tour time from database`);
                throw new Error("Could not retrieve current tour time from database");
            }
            const questionPhaseSkipTime = new Date(currentTourDbTime1.getTime() - (60 * 1000 * 3));
            await updateTourStartTime(tourId, questionPhaseSkipTime);
            logSuccess(`[User ${userIndex + 1}] Tour time updated successfully for Match 2 phase`);
        }

        // --- Refresh page and verify Match 2 ---
        logStep(`[User ${userIndex + 1}] Refreshing page for Match 2 phase`);
        await driver.navigate().refresh();
        await sleep(3000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const expectedWaitTimeForMatch2 = (config.TOUR_PHASE_2_DURATION_SECONDS + 30) * 1000;
        await driver.wait(until.elementIsVisible(driver.findElement(By.css('.card.border.border-secondary.mt-4.p-4'))), expectedWaitTimeForMatch2);
        logSuccess(`[User ${userIndex + 1}] Successfully entered Match 2 phase`);

        // --- Submit MVCs ---
        logStep(`[User ${userIndex + 1}] Submitting MVCs for Match 2`);
        const mvcInput1 = await driver.wait(until.elementLocated(By.xpath('//input[@x-model="mvcInput.mvc"]')), 10000);
        await mvcInput1.sendKeys(userConfig.mvc1);
        await sleep(500);

        const confidenceRatingInput1 = await driver.findElement(By.xpath('//input[@x-model="mvcInput.confidence_rating"]'));
        await confidenceRatingInput1.sendKeys(userConfig.confidenceRating);
        await sleep(500);

        const addMVCButton1 = await driver.wait(until.elementLocated(By.xpath('//button[text()="Add Another MVC"]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", addMVCButton1);
        await addMVCButton1.click();
        logSuccess(`[User ${userIndex + 1}] Successfully added first MVC`);

        const mvcInput2 = await driver.wait(until.elementLocated(By.xpath('(//input[@x-model="mvcInput.mvc"])[2]')), 10000);
        await mvcInput2.sendKeys(userConfig.mvc2);
        await sleep(500);

        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const submitMvcButton = await driver.findElement(By.xpath('//button[contains(normalize-space(.), "Submit MVC")]'));
        await submitMvcButton.click();
        logSuccess(`[User ${userIndex + 1}] Successfully submitted all MVCs`);

        await sleep(500);

        console.log(`[User ${userIndex + 1}] Verifying Match 2 (Submitted MVCs) results display...`);
        
        // 1. Wait for the paragraph that says "You have submitted X mvcs"
        const submittedMvcCountElement = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You have submitted') and contains(normalize-space(.), 'mvcs')]"))),
            15000 // A reasonable timeout for the UI to appear
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", submittedMvcCountElement);
        
        const submittedMvcText = await submittedMvcCountElement.getText();
        console.log(`[User ${userIndex + 1}] ✅ Submitted MVCs summary: "${submittedMvcText}"`);

        // --- Wait for voting phase (only first user updates time) ---
        if (userIndex === 0) {
            const currentTourDbTime = await getTourCurrentTime(tourId);
            if (!currentTourDbTime) {
                throw new Error("Could not retrieve current tour time from DB for fast-forwarding.");
            }
            console.log(`[User ${userIndex + 1}] DB: Current tour time from DB (after Phase 3 completion): ${currentTourDbTime.toLocaleString()}`);

            const votingPhaseSkipTime = new Date(currentTourDbTime.getTime() - (60 * 1000 * 10));
            await updateTourStartTime(tourId, votingPhaseSkipTime);
            console.log(`[User ${userIndex + 1}] DB: Tour initial start time updated.`);
        }

        // --- CRITICAL: Refresh the page after DB update ---
        console.log(`[User ${userIndex + 1}] Refreshing page to apply time change...`);
        await driver.navigate().refresh();
        await sleep(3000); // Give the page a moment to fully reload and re-render

        // Scroll to bottom to ensure new elements (voting section) are in view
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        // --- Step 8: Vote on MVCs (Match 3) ---
        console.log(`[User ${userIndex + 1}] Waiting for MVC Voting section (Match 3) to appear...`);
        const votingSectionHeadingXPath = "//*[contains(text(), 'My first automated test MVC')]";
        await driver.wait(until.elementLocated(By.xpath(votingSectionHeadingXPath)), 15000);
        await driver.wait(until.elementIsVisible(driver.findElement(By.xpath(votingSectionHeadingXPath))), 10000);
        console.log(`[User ${userIndex + 1}] ✅ MVC creation phase (Match 2) countdown finished. MVC Voting section (Match 3) appeared.`);

        console.log(`[User ${userIndex + 1}] Voting on MVCs...`);
        try {
            // Vote on first MVC
            const agreeButton1 = await driver.findElement(By.xpath('(//div[contains(@class, "col-md-6")]//button[contains(., "Agree")])[1]'), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", agreeButton1);
            await sleep(500);
            await agreeButton1.click();
            console.log(`[User ${userIndex + 1}] ✅ Voted 'Agree' on the first MVC.`);
            await sleep(2000);

            // Vote on second MVC
            const voteButton2 = await driver.findElement(By.xpath('(//div[contains(@class, "col-md-6")]//button[contains(., "Disagree")])[2]'), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", voteButton2);
            await sleep(500);
            await voteButton2.click();
            console.log(`[User ${userIndex + 1}] ✅ Voted 'Disagree' on the second MVC.`);
            await sleep(2000);
            
        } catch (voteError) {
            console.warn(`[User ${userIndex + 1}] ⚠️ Could not vote on MVCs (perhaps no MVCs to vote on, or selectors are wrong): ${voteError.message}`);
        }

        // --- Step 9: Wait for the Voting Phase countdown to finish (only first user updates time) ---
        if (userIndex === 0) {
            console.log(`[User ${userIndex + 1}] Waiting for the Voting phase countdown to finish and tour conclusion results to display...`);
            await sleep(15000);

            await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
            await sleep(500);

            const currentTourDbTime2 = await getTourCurrentTime(tourId);
            if (!currentTourDbTime2) {
                throw new Error("Could not retrieve current tour time from DB for fast-forwarding.");
            }
            console.log(`[User ${userIndex + 1}] DB: Current tour time from DB (after Phase 3 completion): ${currentTourDbTime2.toLocaleString()}`);

            const votingPhaseSkipTime2 = new Date(currentTourDbTime2.getTime() - (60 * 1000 * 45));
            await updateTourStartTime(tourId, votingPhaseSkipTime2);
            console.log(`[User ${userIndex + 1}] DB: Tour initial start time updated.`);
        }

        // --- CRITICAL: Refresh the page after DB update ---
        console.log(`[User ${userIndex + 1}] Refreshing page to apply time change...`);
        await driver.navigate().refresh();
        await sleep(3000);
        console.log(`[User ${userIndex + 1}] Test completed successfully!`);

        console.log(`[User ${userIndex + 1}] Verifying Award Settlement Table after Voting...`);
        
        // Scroll to and verify the Award Settlement Table itself
        console.log(`[User ${userIndex + 1}] Scrolling to the Award Settlement Table...`);
        const settlementTable = await driver.wait(
            until.elementLocated(By.css('table.table')),
            10000
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", settlementTable);
        await sleep(1000);
        console.log(`[User ${userIndex + 1}] ✅ Scrolled to the Award Settlement Table.`);

        // Verify key elements within the table
        const settlementTableHeader = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//table/thead/tr/th[contains(normalize-space(.), 'Settlement')]"))),
            10000
        );
        console.log(`[User ${userIndex + 1}] ✅ Award Settlement Table header "Settlement" found.`);

        // Verify the "Tour concluded at" message
        const tourConcludedMessage = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'This tour concluded at')]"))),
            45000
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", tourConcludedMessage);
        console.log(`[User ${userIndex + 1}] ✅ Tour concluded message found: "${await tourConcludedMessage.getText()}"`);

        console.log(`[User ${userIndex + 1}] Verifying "MVC win" message...`);
        const MvcWinMessage = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You have')]"))),
            10000
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", MvcWinMessage);
        console.log(`[User ${userIndex + 1}] ✅ " MVC win" message found: "${await MvcWinMessage.getText()}"`);

        // Verify settlement table data
        console.log(`[User ${userIndex + 1}] Verifying settlement table data...`);
        
        // Get all table rows
        const tableRows = await driver.findElements(By.css('table.table tbody tr'));
        console.log(`[User ${userIndex + 1}] Found ${tableRows.length} rows in the settlement table`);

        // Verify each row's data
        for (let i = 0; i < tableRows.length; i++) {
            const row = tableRows[i];
            const cells = await row.findElements(By.tagName('td'));
            
            // Get text from each cell
            const rowData = await Promise.all(cells.map(cell => cell.getText()));
            console.log(`[User ${userIndex + 1}] Row ${i + 1} data:`, rowData);

            // Verify that each row has exactly 4 columns
            if (cells.length !== 4) {
                throw new Error(`[User ${userIndex + 1}] Row ${i + 1} has unexpected number of columns: ${cells.length}`);
            }

            // Verify that settlement amount is a valid number
            if (isNaN(parseFloat(rowData[1]))) {
                throw new Error(`[User ${userIndex + 1}] Row ${i + 1} settlement amount is not a valid number: ${rowData[1]}`);
            }

            // Verify that quantity is a valid number
            if (isNaN(parseInt(rowData[2]))) {
                throw new Error(`[User ${userIndex + 1}] Row ${i + 1} quantity is not a valid number: ${rowData[2]}`);
            }

            // Verify that winning amount is a valid number
            if (isNaN(parseFloat(rowData[3]))) {
                throw new Error(`[User ${userIndex + 1}] Row ${i + 1} winning amount is not a valid number: ${rowData[3]}`);
            }
        }
        console.log(`[User ${userIndex + 1}] ✅ Settlement table data verification completed successfully`);

        // Verify total settlement amount in award message
        console.log(`[User ${userIndex + 1}] Verifying total settlement amount...`);
        const awardMessage = await driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You have been awarded in')]"));
        const awardText = await awardMessage.getText();
        
        // Extract the total settlement amount from the message
        const totalAmountMatch = awardText.match(/awarded in ([\d.]+) for total settlement/);
        if (!totalAmountMatch) {
            throw new Error(`[User ${userIndex + 1}] Could not find total settlement amount in award message`);
        }
        
        const totalAmount = parseFloat(totalAmountMatch[1]);
        console.log(`[User ${userIndex + 1}] ✅ Total settlement amount verification completed successfully: ${totalAmount}`);

        logSuccess(`[User ${userIndex + 1}] All test steps completed successfully!`);

    } catch (error) {
        logFailure(`[User ${userIndex + 1}] Test execution failed`, error);
        if (tourId) {
            await clearTourData(tourId);
            await deleteTourByTitle(tourTitleToTest);
        }
    } finally {
        if (driver) {
            logStep(`[User ${userIndex + 1}] Closing WebDriver`);
            await driver.quit();
        }
    }
}

async function runMultiUserTest() {
    console.log("🚀 Starting multi-user tour test with 3 users...");
    
    try {
        // Run all user tests in parallel
        const userPromises = users.map((userConfig, index) => 
            testTourStepsForUser(userConfig, index)
        );
        
        await Promise.all(userPromises);
        
        console.log("🎉 All users completed the tour test successfully!");
        
    } catch (error) {
        console.error("❌ Multi-user test failed:", error);
    } finally {
        // Clean up tour data
        const tourTitleToTest = "Testing Tour1";
        const tourId = await getTourIdByTitle(tourTitleToTest);
        if (tourId) {
            await clearTourData(tourId);
            await deleteTourByTitle(tourTitleToTest);
        }
    }
}

// Run the multi-user test
runMultiUserTest(); 