module.exports = {
    // Application URL - can be overridden by environment variable
    URL: process.env.APP_URL || "http://localhost:8083/",
    
    // Browser configuration
    Browser: process.env.BROWSER || "chrome",
    
    // Driver paths are now managed automatically by Selenium WebDriver
    // No need to specify Chrome_Path or FireFox_Path - Selenium handles driver management
    
    // Headless mode for server environments
    Headless: process.env.HEADLESS === 'true' || false,
    
    // Window size for headless mode
    WindowSize: process.env.WINDOW_SIZE || "1920,1080",
    
    // Remote Selenium URL (e.g., http://selenium:4444/wd/hub)
    RemoteUrl: process.env.REMOTE_URL || "",
    
    // Tour Phase Durations (in seconds)
    TOUR_PHASE_1_DURATION_SECONDS: parseInt(process.env.TOUR_PHASE_1_DURATION) || 60,  // Initial Countdown (1 minute)
    TOUR_PHASE_2_DURATION_SECONDS: parseInt(process.env.TOUR_PHASE_2_DURATION) || 180, // Question Phase (3 minutes)
    TOUR_PHASE_3_DURATION_SECONDS: parseInt(process.env.TOUR_PHASE_3_DURATION) || 420, // MVC Creation Phase (7 minutes)
    TOUR_PHASE_4_DURATION_SECONDS: parseInt(process.env.TOUR_PHASE_4_DURATION) || 2700 // Voting Phase (45 minutes = 45 * 60 seconds)
};