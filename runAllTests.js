const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");
const path = require("path");
const config = require('./config/config');

// Log file location based on new structure
const LOG_FILE = path.resolve(__dirname, "reports", "test_results", "test_results.log");
const LOG_DIR = path.dirname(LOG_FILE);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    console.log(`Creating log directory: ${LOG_DIR}`);
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Track success and failure
const successTests = [];
const failTests = [];

// Define test dependencies
const testDependencies = {
    'test07.js': ['test05.js'],
    'test08.js': ['test07.js']
};

// Helper: log messages to file (and optionally console)
function logMessage(message, testFile = null) {
    const timestamp = new Date().toISOString();
    const logEntry = testFile ? `${timestamp} | ${testFile} | ${message}` : message;
    fs.appendFileSync(LOG_FILE, logEntry + "\n");
    // Show only start message in console for brevity
    if (message.includes("Test Run Started")) console.log("\nRunning tests...\n");
}

// Validate existence of a test file
function validateTestFile(testFile) {
    const filePath = path.resolve(__dirname, testFile);
    if (!fs.existsSync(filePath)) {
        logMessage(`❌ File not found: ${filePath}`);
        return false;
    }
    return true;
}

// Get test execution order respecting dependencies
function getTestExecutionOrder() {
    const allTests = getTestFiles();
    const executionOrder = [];
    const processed = new Set();

    function processTest(test) {
        if (processed.has(test)) return;
        if (testDependencies[test]) {
            for (const dep of testDependencies[test]) processTest(dep);
        }
        executionOrder.push(test);
        processed.add(test);
    }

    for (const test of allTests) processTest(test);
    return executionOrder;
}

// Run a single test file
async function runTest(testFile) {
    const filePath = path.resolve(__dirname, testFile);
    if (!validateTestFile(testFile)) return 1;

    let success = 0;

    try {
        const stdout = execSync(`node "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' });
        const lines = stdout.split("\n");

        const successDetails = lines.filter(l => l.includes("✅")).map(l => l.trim());
        const failureDetails = lines.filter(l => l.includes("❌") || l.includes("Error:") || l.includes("fail")).map(l => l.trim());

        success = (successDetails.length > 0 && failureDetails.length === 0) ? 0 : 1;

        const timestamp = new Date().toISOString();
        const testResult = success === 0 ? "Success" : "Failure";
        const details = success === 0 ? successDetails.join(" | ") : failureDetails.join(" | ");

        fs.appendFileSync(LOG_FILE, `${timestamp} | ${testFile} | ${testResult} | ${details}\n`);

        // Mark dependent tests as skipped if current failed
        if (success === 1) {
            const dependents = Object.entries(testDependencies)
                .filter(([_, deps]) => deps.includes(testFile))
                .map(([test]) => test);
            dependents.forEach(dep => {
                fs.appendFileSync(LOG_FILE, `${timestamp} | ${dep} | Skipped | Due to failed dependencies\n`);
            });
        }

    } catch (error) {
        success = 1;
        const timestamp = new Date().toISOString();
        const errMsg = (error.stderr || error.stdout || "Unknown error").toString().trim();
        fs.appendFileSync(LOG_FILE, `${timestamp} | ${testFile} | Failure | ${errMsg}\n`);
    }

    return success;
}

// List of test files in the `test/` folder
function getTestFiles() {
    return [
        "test/test01.js",
        "test/test02.js",
        "test/test03.js",
        "test/test04.js",
        "test/test05.js",
        "test/test06.js",
        "test/test07.js",
        "test/test08.js",
        "test/test09.js",
        "test/test10.js",
        // Add more as needed
    ];
}

// Track test results
function logTestResult(testFile, resultCode) {
    if (resultCode === 0) successTests.push(testFile);
    else failTests.push(testFile);
}

// Main function
async function main() {
    console.log("\nTest Run Started\n");

    const presetChoice = process.env.TEST_CHOICE || (!process.stdin.isTTY ? '1' : null);

    const handleChoice = async (choice, rl) => {
        switch (choice.trim()) {
            case "1": // Run all tests
                const totalStartTime = Date.now();
                const executionOrder = getTestExecutionOrder();

                for (const testFile of executionOrder) {
                    const dependencies = testDependencies[testFile] || [];
                    const dependenciesFailed = dependencies.some(dep => failTests.includes(dep));
                    if (dependenciesFailed) {
                        const timestamp = new Date().toISOString();
                        fs.appendFileSync(LOG_FILE, `${timestamp} | ${testFile} | Skipped | Due to failed dependencies\n`);
                        failTests.push(testFile);
                        continue;
                    }
                    const result = await runTest(testFile);
                    logTestResult(testFile, result);
                }

                const totalEndTime = Date.now();
                console.log("Using Selenium Grid:", config.RemoteUrl ? config.RemoteUrl : "Local WebDriver");

                console.log("\nTest Results:");
                console.log(`Total: ${successTests.length + failTests.length}`);
                console.log(`Passed: ${successTests.length}`);
                console.log(`Failed: ${failTests.length}`);
                console.log(`Time: ${((totalEndTime - totalStartTime)/1000).toFixed(2)}s`);

                if (failTests.length > 0) {
                    console.log("\nFailed Tests:");
                    failTests.forEach(t => console.log(`- ${t}`));
                }

                if (rl) rl.close();
                break;

            case "2": // Run a single test
                if (!rl) { console.log("❌ TEST_FILE required for non-interactive mode"); process.exit(1); }
                rl.question("Enter test file name (e.g., test01.js): ", async (testFile) => {
                    const result = await runTest(`test/${testFile}`);
                    logTestResult(testFile, result);
                    console.log(`Result for ${testFile}: ${result === 0 ? "Passed" : "Failed"}`);
                    rl.close();
                });
                break;

            case "3": // Run range
                if (!rl) { console.log("❌ START_NUM and END_NUM required for non-interactive mode"); process.exit(1); }
                rl.question("Enter start number: ", (startNum) => {
                    rl.question("Enter end number: ", async (endNum) => {
                        for (let i = parseInt(startNum); i <= parseInt(endNum); i++) {
                            const testFile = `test/test${i.toString().padStart(2,'0')}.js`;
                            if (fs.existsSync(path.resolve(__dirname, testFile))) {
                                const result = await runTest(testFile);
                                logTestResult(testFile, result);
                            }
                        }
                        rl.close();
                    });
                });
                break;

            default:
                console.log("❌ Invalid choice. Use 1 (all), 2 (single), 3 (range).");
                if (rl) rl.close();
        }
    };

    if (presetChoice) await handleChoice(presetChoice, null);
    else {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question("Choose option: 1-All, 2-Single, 3-Range: ", async (choice) => { await handleChoice(choice, rl); });
    }

    // Exit with code 1 if any tests failed
    process.exit(failTests.length > 0 ? 1 : 0);
}

main();
