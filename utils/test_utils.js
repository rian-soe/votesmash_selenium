const fs = require('fs');
const path = require('path');

// Directory to store logs
const LOG_FILE = path.resolve(__dirname, "..", "reports", "test_results", "test_results.log");
const LOG_DIR = path.dirname(LOG_FILE);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Get current test name from stack trace
function getTestName() {
    const stack = new Error().stack;
    const callerLine = stack.split('\n')[3];
    const fileMatch = callerLine.match(/\(([^)]+)\)/);
    const functionMatch = callerLine.match(/at\s+(\w+)\s+\(/);
    
    let fileName = 'Unknown';
    if (fileMatch) {
        const fullPath = fileMatch[1];
        fileName = path.basename(fullPath);
    }
    
    const functionName = functionMatch ? functionMatch[1] : 'Unknown';
    return `${fileName} - ${functionName}`;
}

// Test step logging
function logStep(step) {
    const testName = getTestName();
    const message = `[${testName}] ${step}`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + "\n");
}

// Test success logging
function logSuccess(message) {
    const testName = getTestName();
    const formattedMessage = `[${testName}] ✅ ${message}`;
    console.log(formattedMessage);
    fs.appendFileSync(LOG_FILE, formattedMessage + "\n");
}

// Test failure logging
function logFailure(message, error = null) {
    const testName = getTestName();
    const formattedMessage = `[${testName}] ❌ ${message}`;
    console.log(formattedMessage);
    if (error) {
        console.log(`[${testName}] Error: ${error.message || error}`);
    }
    
    fs.appendFileSync(LOG_FILE, formattedMessage + "\n");
    if (error) {
        fs.appendFileSync(LOG_FILE, `[${testName}] Error: ${error.message || error}\n`);
    }
}

// Test info logging
function logInfo(message) {
    const testName = getTestName();
    const formattedMessage = `[${testName}] ℹ️ ${message}`;
    console.log(formattedMessage);
    fs.appendFileSync(LOG_FILE, formattedMessage + "\n");
}

// Test warning logging
function logWarning(message) {
    const testName = getTestName();
    const formattedMessage = `[${testName}] ⚠️ ${message}`;
    console.log(formattedMessage);
    fs.appendFileSync(LOG_FILE, formattedMessage + "\n");
}

module.exports = {
    logStep,
    logSuccess,
    logFailure,
    logInfo,
    logWarning
}; 