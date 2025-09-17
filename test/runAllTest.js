const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");
const path = require("path");

// Directory to store logs
// Using __dirname to resolve path relative to the script's location
const LOG_FILE = path.resolve(__dirname, "test_results", "test_results.log");
const LOG_DIR = path.dirname(LOG_FILE);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    console.log(`Creating log directory: ${LOG_DIR}`);
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Store the success and failure counts, and the lists of test names
const successTests = [];
const failTests = [];

// Define test dependencies
const testDependencies = {
    'test07.js': ['test05.js'],
    'test08.js': ['test07.js']
};

// Helper to log messages to the log file and console
function logMessage(message, testFile = null) {
    const timestamp = new Date().toISOString();
    const logEntry = testFile ? `${timestamp} | ${testFile} | ${message}` : message;
    
    // Log everything to file
    fs.appendFileSync(LOG_FILE, logEntry + "\n");
    
    // Only show essential messages in console
    if (message.includes("Test Run Started")) {
        console.log("\nRunning tests...\n");
    }
}

// Function to validate the existence of a test file
function validateTestFile(testFile) {
    // Resolve test file path relative to the current script's directory
    const filePath = path.resolve(__dirname, testFile);
    if (!fs.existsSync(filePath)) {
        logMessage(`❌ File not found: ${filePath}`);
        return false;
    }
    return true;
}

// Function to get test execution order
function getTestExecutionOrder() {
    const allTests = getTestFiles();
    const executionOrder = [];
    const processed = new Set();

    function processTest(test) {
        if (processed.has(test)) return;
        
        // Process dependencies first
        if (testDependencies[test]) {
            for (const dependency of testDependencies[test]) {
                processTest(dependency);
            }
        }
        
        executionOrder.push(test);
        processed.add(test);
    }

    // Process all tests
    for (const test of allTests) {
        processTest(test);
    }

    return executionOrder;
}

// Function to run a single test file
async function runTest(testFile) {
    const filePath = path.resolve(__dirname, testFile);
    
    if (!validateTestFile(testFile)) {
        return 1;
    }

    let success = 0;
    let stdout = '';
    let stderr = '';
    let successDetails = [];
    let failureDetails = [];

    try {
        const result = execSync(`node "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' });
        stdout = result;
        
        // Extract success and failure messages
        const lines = stdout.split('\n');
        lines.forEach(line => {
            if (line.includes("✅")) {
                successDetails.push(line.trim());
            } else if (line.includes("❌") || line.includes("Error:") || line.includes("fail")) {
                failureDetails.push(line.trim());
            }
        });

        // Determine test result
        success = (successDetails.length > 0 && failureDetails.length === 0) ? 0 : 1;

        // Log test result to file
        const timestamp = new Date().toISOString();
        const testResult = success === 0 ? "Success" : "Failure";
        const details = success === 0 ? 
            successDetails.join(" | ") : 
            failureDetails.join(" | ");
        
        fs.appendFileSync(LOG_FILE, 
            `${timestamp} | ${testFile} | ${testResult} | ${details}\n`
        );

        // Check for dependent tests
        if (success === 1) {
            const dependentTests = Object.entries(testDependencies)
                .filter(([_, deps]) => deps.includes(testFile))
                .map(([test]) => test);

            if (dependentTests.length > 0) {
                fs.appendFileSync(LOG_FILE, 
                    `${timestamp} | ${testFile} | Skipped | Due to failed dependencies\n`
                );
            }
        }

    } catch (error) {
        success = 1;
        stderr = error.stderr ? error.stderr.toString().trim() : '';
        stdout = error.stdout ? error.stdout.toString().trim() : '';
        
        // Log error to file
        const timestamp = new Date().toISOString();
        const errorMessage = stderr || stdout || "Unknown error";
        fs.appendFileSync(LOG_FILE, 
            `${timestamp} | ${testFile} | Failure | ${errorMessage}\n`
        );
    }

    return success;
}

// Get the list of test files
function getTestFiles() {
    return [
        "test01.js",
        "test02.js",
        "test03.js",
        "test04.js",
      //  "test05.js",
       // "test06.js",
       // "test07.js",
        //"test08.js"
    ];
}

// Log the result of a single test file
function logTestResult(testFile, resultCode, startTime) {
    const endTime = Date.now();
    const testingTime = ((endTime - startTime) / 1000).toFixed(2);
    const result = resultCode === 0 ? "Success" : "Failure";
    const timeStr = new Date().toISOString();

    // Track success/failure counts and lists
    if (resultCode === 0) {
        successTests.push(testFile);
    } else {
        failTests.push(testFile);
    }
}

// Modify the main function to use test dependencies
async function main() {
    console.log("\nRunning tests...\n");

    // Support non-interactive mode via env var or when stdin is not a TTY
    const presetChoice = process.env.TEST_CHOICE || (!process.stdin.isTTY ? '1' : null);

    const handleChoice = async (choice, rl) => {
        switch (choice.trim()) {
            case "1":
                const totalStartTime = Date.now();
                const executionOrder = getTestExecutionOrder();
                
                for (const testFile of executionOrder) {
                    // Skip tests if their dependencies failed
                    const dependencies = testDependencies[testFile] || [];
                    const dependenciesFailed = dependencies.some(dep => failTests.includes(dep));
                    
                    if (dependenciesFailed) {
                        const timestamp = new Date().toISOString();
                        fs.appendFileSync(LOG_FILE, 
                            `${timestamp} | ${testFile} | Skipped | Due to failed dependencies\n`
                        );
                        failTests.push(testFile);
                        continue;
                    }

                    const startTime = Date.now();
                    const result = await runTest(testFile);
                    logTestResult(testFile, result, startTime);
                }
                
                const totalEndTime = Date.now();
                const totalTestingTime = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
                
                // Print final summary
                console.log("\nTest Results:");
                console.log(`Total: ${successTests.length + failTests.length}`);
                console.log(`Passed: ${successTests.length}`);
                console.log(`Failed: ${failTests.length}`);
                console.log(`Time: ${totalTestingTime}s`);
                
                if (failTests.length > 0) {
                    console.log("\nFailed Tests:");
                    failTests.forEach(test => console.log(`- ${test}`));
                }
                
                if (rl) rl.close();
                break;

            case "2":
                if (!rl) { console.log("Non-interactive mode requires TEST_FILE for choice 2"); process.exit(1); }
                rl.question("Enter the name of the test file to run (e.g., 'test01.js'): ", async (testFile) => {
                    const startTime = Date.now();
                    const result = await runTest(testFile);
                    logTestResult(testFile, result, startTime);
                    
                    const endTime = Date.now();
                    const testingTime = ((endTime - startTime) / 1000).toFixed(2);
                    
                    console.log("\nTest Results:");
                    console.log(`Test: ${testFile}`);
                    console.log(`Result: ${result === 0 ? 'Passed' : 'Failed'}`);
                    console.log(`Time: ${testingTime}s`);
                    
                    rl.close();
                });
                break;

            case "3":
                if (!rl) { console.log("Non-interactive mode requires START_NUM and END_NUM for choice 3"); process.exit(1); }
                rl.question("Enter the starting test number (e.g., 2): ", async (startNum) => {
                    rl.question("Enter the ending test number (e.g., 5): ", async (endNum) => {
                        const totalStartTime = Date.now();
                        const start = parseInt(startNum);
                        const end = parseInt(endNum);
                        
                        for (let i = start; i <= end; i++) {
                            const testFile = `test${i.toString().padStart(2, '0')}.js`;
                            if (fs.existsSync(path.resolve(__dirname, testFile))) {
                                const startTime = Date.now();
                                const result = await runTest(testFile);
                                logTestResult(testFile, result, startTime);
                            }
                        }
                        
                        const totalEndTime = Date.now();
                        const totalTestingTime = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
                        
                        console.log("\nTest Results:");
                        console.log(`Total: ${successTests.length + failTests.length}`);
                        console.log(`Passed: ${successTests.length}`);
                        console.log(`Failed: ${failTests.length}`);
                        console.log(`Time: ${totalTestingTime}s`);
                        
                        if (failTests.length > 0) {
                            console.log("\nFailed Tests:");
                            failTests.forEach(test => console.log(`- ${test}`));
                        }
                        
                        rl.close();
                    });
                });
                break;

            default:
                console.log("❌ Invalid choice. Please select 1, 2, or 3.");
                if (rl) rl.close();
        }
    };

    if (presetChoice) {
        await handleChoice(presetChoice, null);
    } else {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("Choose an option (1: All tests, 2: Specific test, 3: Range): ", async (choice) => {
            await handleChoice(choice, rl);
        });

        rl.on("close", () => {
            const totalTests = successTests.length + failTests.length;
            
            console.log("\nTest Summary:");
            console.log(`Total Tests: ${totalTests}`);
            console.log(`Passed: ${successTests.length}`);
            console.log(`Failed: ${failTests.length}`);
            
            if (failTests.length > 0) {
                console.log("\nFailed Tests:");
                failTests.forEach(test => console.log(`- ${test}`));
            }
            
            // Exit with code 1 if any tests failed
            process.exit(failTests.length > 0 ? 1 : 0);
        });
        return;
    }

    // Non-interactive path: print summary and exit
        const totalTests = successTests.length + failTests.length;
        
        console.log("\nTest Summary:");
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${successTests.length}`);
        console.log(`Failed: ${failTests.length}`);
        
        if (failTests.length > 0) {
            console.log("\nFailed Tests:");
            failTests.forEach(test => console.log(`- ${test}`));
        }
        
        // Exit with code 1 if any tests failed
        process.exit(failTests.length > 0 ? 1 : 0);
}

main();