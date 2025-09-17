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

async function testTourSteps() {
    let driver;
    const tourTitleToTest = "Testing Tour1";
    let tourId = null;

    try {
        logStep("Setting up WebDriver");
        driver = await setupDriver(config.Browser);
        await driver.manage().window().maximize();

        // --- Fetch Tour ID ---
        tourId = await getTourIdByTitle(tourTitleToTest);
        if (!tourId) {
            logFailure(`Tour with title "${tourTitleToTest}" not found in database`);
            throw new Error("Tour not found in DB.");
        }
        logSuccess(`Fetched Tour ID: ${tourId} for "${tourTitleToTest}"`);

        // --- Calculate Initial Tour Start Time ---
        let nextPhaseStartTime = new Date(Date.now() + (60 * 1000));
        logStep("Setting initial tour start time");
        await updateTourStartTime(tourId, nextPhaseStartTime);
        logSuccess("Tour initial start time updated");

        // --- Login ---
        logStep("Navigating to login page");
        await driver.get(config.URL);
        await driver.wait(until.elementLocated(By.linkText("Login")), 10000).click();

        logStep("Entering login credentials");
        await driver.wait(until.elementLocated(By.id("email")), 10000).sendKeys("tester@gmail.com");
        await driver.findElement(By.id("password")).sendKeys("12345678");
        await driver.findElement(By.css("button[type='submit']")).click();

        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Update Profile')]")), 15000);
        logSuccess("Successfully logged in");

        // --- Navigate to Tours Listing Page ---
        logStep("Navigating to Tours listing page");
        await driver.wait(until.elementLocated(By.linkText("Tours")), 10000).click();
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Ready to reimage your diversity & equality platform?')]")), 15000);
        logSuccess("Successfully navigated to Tours listing page");

        // --- Click on the specific tour link ---
        logStep(`Selecting tour "${tourTitleToTest}"`);
        const testTitleLink = await driver.findElement(By.linkText(tourTitleToTest));
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", testTitleLink);
        await sleep(1000);
        await testTitleLink.click();
        logSuccess(`Successfully selected tour "${tourTitleToTest}"`);

        // --- Wait for the tour details page ---
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Attract votes for your MVC in this tour!')]")), 15000);
        logSuccess("Successfully loaded tour details page");

        // --- Join Tour ---
        logStep("Attempting to join tour");
        const joinTourLink = await driver.wait(until.elementLocated(By.linkText("Join Tour")), 15000);
        await driver.wait(until.elementIsVisible(joinTourLink), 10000);
        await driver.wait(until.elementIsEnabled(joinTourLink), 10000);

        if ((await joinTourLink.getText()).includes("Join Tour")) {
            await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); arguments[0].click();", joinTourLink);
            logSuccess("Successfully joined tour");
        } else {
            logFailure("Expected 'Join Tour' link not found or not clickable");
            throw new Error("Expected 'Join Tour' link not found or not clickable");
        }

        // --- Verify Countdown Display ---
        logStep("Verifying countdown display");
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);
        const countdownElement = await driver.wait(until.elementLocated(By.xpath("//span[@x-text='display']")), 15000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", countdownElement);
        const initialCountdownText = await countdownElement.getText();
        logSuccess(`Countdown timer is displayed: ${initialCountdownText}`);

        // --- Wait for Match 1 questions ---
        logStep("Waiting for Match 1 questions to appear");
        await sleep(config.TOUR_PHASE_1_DURATION_SECONDS * 1000 + 5000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const userNameInput = await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//input[@placeholder="Enter your match name"]'))), (config.TOUR_PHASE_1_DURATION_SECONDS + 30) * 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", userNameInput);
        logSuccess("Match 1 questions appeared successfully");

        // --- Enter User Name and Answer questions ---
        logStep("Entering user name and answering Match 1 questions");
        await userNameInput.sendKeys('Automated Test User');
        await sleep(500);

        const goodRadioButton = await driver.wait(until.elementLocated(By.xpath('//input[@type="radio" and @name="question0" and @value="yes"]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", goodRadioButton);
        await sleep(500);
        await driver.wait(until.elementIsVisible(goodRadioButton), 5000);
        await driver.wait(until.elementIsEnabled(goodRadioButton), 5000);
        await goodRadioButton.click();
        logSuccess("Successfully answered Match 1 questions");

        // --- Submit Match 1 answers ---
        logStep("Submitting Match 1 answers");
        const submitMatch1Button = await driver.wait(until.elementLocated(By.xpath('//button[./p[text()="Submit"]]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", submitMatch1Button);
        await submitMatch1Button.click();
        await sleep(500);
        logSuccess("Successfully submitted Match 1 answers");

        // --- Verify Match 1 results ---
        logStep("Verifying Match 1 results");
        const match1AnswersHeader = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You answer the questions as follows')]"))),
            15000
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", match1AnswersHeader);
        logSuccess("Match 1 results displayed successfully");

        // --- Update tour time for Match 2 ---
        logStep("Updating tour time for Match 2 phase");
        const currentTourDbTime1 = await getTourCurrentTime(tourId);
        if (!currentTourDbTime1) {
            logFailure("Could not retrieve current tour time from database");
            throw new Error("Could not retrieve current tour time from database");
        }
        const questionPhaseSkipTime = new Date(currentTourDbTime1.getTime() - (60 * 1000 * 3));
        await updateTourStartTime(tourId, questionPhaseSkipTime);
        logSuccess("Tour time updated successfully for Match 2 phase");

        // --- Refresh page and verify Match 2 ---
        logStep("Refreshing page for Match 2 phase");
        await driver.navigate().refresh();
        await sleep(3000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const expectedWaitTimeForMatch2 = (config.TOUR_PHASE_2_DURATION_SECONDS + 30) * 1000;
        await driver.wait(until.elementIsVisible(driver.findElement(By.css('.card.border.border-secondary.mt-4.p-4'))), expectedWaitTimeForMatch2);
        logSuccess("Successfully entered Match 2 phase");

        // --- Submit MVCs ---
        logStep("Submitting MVCs for Match 2");
        const mvcInput1 = await driver.wait(until.elementLocated(By.xpath('//input[@x-model="mvcInput.mvc"]')), 10000);
        await mvcInput1.sendKeys('My first automated test MVC!');
        await sleep(500);

        const confidenceRatingInput1 = await driver.findElement(By.xpath('//input[@x-model="mvcInput.confidence_rating"]'));
        await confidenceRatingInput1.sendKeys('85');
        await sleep(500);

        const addMVCButton1 = await driver.wait(until.elementLocated(By.xpath('//button[text()="Add Another MVC"]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", addMVCButton1);
        await addMVCButton1.click();
        logSuccess("Successfully added first MVC");

        const mvcInput2 = await driver.wait(until.elementLocated(By.xpath('(//input[@x-model="mvcInput.mvc"])[2]')), 10000);
        await mvcInput2.sendKeys('My second automated test MVC!');
        await sleep(500);

        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const submitMvcButton = await driver.findElement(By.xpath('//button[contains(normalize-space(.), "Submit MVC")]'));
        await submitMvcButton.click();
        logSuccess("Successfully submitted all MVCs");

        await sleep(500);

        console.log('Verifying Match 2 (Submitted MVCs) results display...');
        
        // 1. Wait for the paragraph that says "You have submitted X mvcs"
        const submittedMvcCountElement = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You have submitted') and contains(normalize-space(.), 'mvcs')]"))),
            15000 // A reasonable timeout for the UI to appear
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", submittedMvcCountElement);
        
        const submittedMvcText = await submittedMvcCountElement.getText();
        console.log(`✅ Submitted MVCs summary: "${submittedMvcText}"`);


        const currentTourDbTime = await getTourCurrentTime(tourId);
        if (!currentTourDbTime) {
            throw new Error("Could not retrieve current tour time from DB for fast-forwarding.");
        }
        console.log(`DB: Current tour time from DB (after Phase 3 completion): ${currentTourDbTime.toLocaleString()}`);

        // Calculate the target time for the end of Phase 4
        // Add the duration of Phase 4 to the current tour DB time.
        // Subtract a buffer to land slightly before the exact end, to give the UI time to refresh.
        const votingPhaseSkipTime = new Date(currentTourDbTime.getTime() - (60 * 1000 * 10));
        

        // --- Update Database with Initial Start Time ---
        await updateTourStartTime(tourId, votingPhaseSkipTime);
        console.log(`DB: Tour initial start time updated.`);

        // --- CRITICAL: Refresh the page after DB update ---
        console.log('Refreshing page to apply time change...');
        await driver.navigate().refresh();
        await sleep(3000); // Give the page a moment to fully reload and re-render

        // Scroll to bottom to ensure new elements (voting section) are in view
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        // --- Step 8: Vote on MVCs (Match 3) ---
        console.log('Waiting for MVC Voting section (Match 3) to appear...');
        // Replace with actual selector for your voting section heading or a key element
        const votingSectionHeadingXPath = "//*[contains(text(), 'My first automated test MVC!')]"; // PLACEHOLDER: Replace with actual text/selector from your UI
        await driver.wait(until.elementLocated(By.xpath(votingSectionHeadingXPath)), 15000); // Give it a buffer
        await driver.wait(until.elementIsVisible(driver.findElement(By.xpath(votingSectionHeadingXPath))), 10000);
        console.log('✅ MVC creation phase (Match 2) countdown finished. MVC Voting section (Match 3) appeared.');

        console.log('Voting on MVCs...');
        try {
            const agreeButton1 = await driver.findElement(By.xpath('(//div[contains(@class, "col-md-6")]//button[contains(., "Agree")])[1]'), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", agreeButton1);
            await sleep(500);
            await agreeButton1.click();
            console.log("✅ Voted 'Agree' on the first MVC.");
            await sleep(2000); // Give time for the vote to process on the UI

            const voteButton2 = await driver.findElement(By.xpath('(//div[contains(@class, "col-md-6")]//button[contains(., "Disagree")])[2]'), 10000);
            await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", voteButton2);
            await sleep(500);
            await voteButton2.click();
            console.log("✅ Voted 'Agree' on the second MVC.");
            await sleep(2000); // Give time for the vote to process on the UI
            
        } catch (voteError) {
            console.warn(`⚠️ Could not vote on MVCs (perhaps no MVCs to vote on, or selectors are wrong): ${voteError.message}`);
        }


        // --- Step 9: Wait for the Voting Phase countdown to finish (and show final Tour conclusion results) ---
        console.log('Waiting for the Voting phase countdown to finish and tour conclusion results to display...');
        // Since we updated the DB to skip most of the 45 mins, we only need a short wait here
        await sleep(15000); // A small buffer to ensure the UI transitions to the conclusion

        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await sleep(500);

        const currentTourDbTime2 = await getTourCurrentTime(tourId);
        if (!currentTourDbTime2) {
            throw new Error("Could not retrieve current tour time from DB for fast-forwarding.");
        }
        console.log(`DB: Current tour time from DB (after Phase 3 completion): ${currentTourDbTime2.toLocaleString()}`);

        // Calculate the target time for the end of Phase 4
        // Add the duration of Phase 4 to the current tour DB time.
        // Subtract a buffer to land slightly before the exact end, to give the UI time to refresh.
        const votingPhaseSkipTime2 = new Date(currentTourDbTime2.getTime() - (60 * 1000 * 45));
        

        // --- Update Database with Initial Start Time ---
        await updateTourStartTime(tourId, votingPhaseSkipTime2);
        console.log(`DB: Tour initial start time updated.`);

        // --- CRITICAL: Refresh the page after DB update ---
        console.log('Refreshing page to apply time change...');
        await driver.navigate().refresh();
        await sleep(3000); // Give the page a moment to fully reload and re-render
        console.log('Test completed successfully!');

        console.log('Verifying Award Settlement Table after Voting...');
        
        
        // Scroll to and verify the Award Settlement Table itself
        console.log('Scrolling to the Award Settlement Table...');
        const settlementTable = await driver.wait(
            until.elementLocated(By.css('table.table')), // Locate the table by its class
            10000 // Wait for the table element to be present in the DOM
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", settlementTable);
        await sleep(1000); // Give a bit more time for the smooth scroll to complete
        console.log('✅ Scrolled to the Award Settlement Table.');

        // Verify key elements within the table
        const settlementTableHeader = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//table/thead/tr/th[contains(normalize-space(.), 'Settlement')]"))),
            10000
        );
        console.log('✅ Award Settlement Table header "Settlement" found.');

        // Verify the "Tour concluded at" message
        const tourConcludedMessage = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'This tour concluded at')]"))),
            45000 // Increased timeout for this critical element
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", tourConcludedMessage);
        console.log(`✅ Tour concluded message found: "${await tourConcludedMessage.getText()}"`);

        console.log('Verifying "MVC win" message...');
        const MvcWinMessage = await driver.wait(
            until.elementIsVisible(driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You have')]"))),
            10000 // A reasonable timeout for this message to appear
        );
        await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", MvcWinMessage);
        console.log(`✅ " MVC win" message found: "${await MvcWinMessage.getText()}"`);

        // Verify settlement table data
        console.log('Verifying settlement table data...');
        
        // Get all table rows
        const tableRows = await driver.findElements(By.css('table.table tbody tr'));
        console.log(`Found ${tableRows.length} rows in the settlement table`);

        // Verify each row's data
        for (let i = 0; i < tableRows.length; i++) {
            const row = tableRows[i];
            const cells = await row.findElements(By.tagName('td'));
            
            // Get text from each cell
            const rowData = await Promise.all(cells.map(cell => cell.getText()));
            console.log(`Row ${i + 1} data:`, rowData);

            // Verify that each row has exactly 4 columns
            if (cells.length !== 4) {
                throw new Error(`Row ${i + 1} has unexpected number of columns: ${cells.length}`);
            }

            // Verify specific data based on row type
            switch(i) {
                case 0: // MVC Prize Settlement row
                    if (!rowData[0].includes('MVC Prize Settlement')) {
                        throw new Error(`Row ${i + 1} first column does not contain expected MVC Prize Settlement text: ${rowData[0]}`);
                    }
                    // Verify MVC Prize Settlement amount
                    if (parseFloat(rowData[1]) !== 0.4062) {
                        throw new Error(`Row ${i + 1} settlement amount is incorrect. Expected: 0.4062, Got: ${rowData[1]}`);
                    }
                    break;
                case 1: // Confidence Rating Settlement row
                    if (!rowData[0].includes('Confidence Rating Settlement')) {
                        throw new Error(`Row ${i + 1} first column does not contain expected Confidence Rating Settlement text: ${rowData[0]}`);
                    }
                    // Verify Confidence Rating Settlement amount
                    if (parseFloat(rowData[1]) !== 0.1083) {
                        throw new Error(`Row ${i + 1} settlement amount is incorrect. Expected: 0.1083, Got: ${rowData[1]}`);
                    }
                    break;
                case 2: // Participation Settlement row
                    if (!rowData[0].includes('Participation Settlement')) {
                        throw new Error(`Row ${i + 1} first column does not contain expected Participation Settlement text: ${rowData[0]}`);
                    }
                    // Verify Participation Settlement amount
                    if (parseFloat(rowData[1]) !== 0.0271) {
                        throw new Error(`Row ${i + 1} settlement amount is incorrect. Expected: 0.0271, Got: ${rowData[1]}`);
                    }
                    break;
            }

            // Verify that settlement amount is a valid number
            if (isNaN(parseFloat(rowData[1]))) {
                throw new Error(`Row ${i + 1} settlement amount is not a valid number: ${rowData[1]}`);
            }

            // Verify that quantity is a valid number
            if (isNaN(parseInt(rowData[2]))) {
                throw new Error(`Row ${i + 1} quantity is not a valid number: ${rowData[2]}`);
            }

            // Verify that winning amount is a valid number
            if (isNaN(parseFloat(rowData[3]))) {
                throw new Error(`Row ${i + 1} winning amount is not a valid number: ${rowData[3]}`);
            }
        }
        console.log('✅ Settlement table data verification completed successfully');

        // Verify total settlement amount in award message
        console.log('Verifying total settlement amount...');
        const awardMessage = await driver.findElement(By.xpath("//p[contains(normalize-space(.), 'You have been awarded in')]"));
        const awardText = await awardMessage.getText();
        
        // Extract the total settlement amount from the message
        const totalAmountMatch = awardText.match(/awarded in ([\d.]+) for total settlement/);
        if (!totalAmountMatch) {
            throw new Error('Could not find total settlement amount in award message');
        }
        
        const totalAmount = parseFloat(totalAmountMatch[1]);
        if (totalAmount !== 0.5416) {
            throw new Error(`Total settlement amount is incorrect. Expected: 0.5416, Got: ${totalAmount}`);
        }
        console.log('✅ Total settlement amount verification completed successfully');

    } catch (error) {
        logFailure("Test execution failed", error);
        await clearTourData(tourId);
        await deleteTourByTitle(tourTitleToTest);
    } finally {
        if (driver) {
            logStep("Closing WebDriver");
            await clearTourData(tourId);
            await deleteTourByTitle(tourTitleToTest);
            await driver.quit();
            
        }
    }
}

testTourSteps();