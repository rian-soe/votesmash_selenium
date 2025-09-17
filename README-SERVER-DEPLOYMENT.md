# Server Deployment Guide for Selenium JS Tests

This guide explains how to deploy and run the Selenium JS test suite on a server for CI/CD purposes.

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure it:
```bash
cp env.example .env
# Edit .env with your specific configuration
```

### 2. Docker Deployment (Recommended)

```bash
# Build and run tests
npm run test:docker

# Clean build and run
npm run test:docker:clean
```

### 3. Direct Server Deployment

```bash
# Install dependencies
npm ci

# Run tests in headless mode
npm run test:ci
```

## 🔧 Configuration Changes Made

### Environment Variables
- **APP_URL**: Application URL to test against
- **HEADLESS**: Enable headless browser mode for servers
- **BROWSER**: Browser to use (chrome/firefox)
- **DB_HOST**: Database host for direct connections
- **SSH_HOST**: SSH server for tunnel connections

### Driver Configuration
- **Windows Development**: Uses `chromedriver.exe` from `driver/chromedriver-win64/`
- **Server/Linux**: Uses Linux binary `chromedriver` (no .exe extension)
- **Auto-Detection**: When `CHROME_DRIVER_PATH` is empty, Selenium auto-detects the driver
- **CI/CD**: Drivers installed via package managers or Docker

### Browser Configuration
- Added headless mode support
- Server-optimized Chrome options
- **Linux binary drivers** (not Windows .exe files)
- Automatic driver detection in CI environments

### Database Connections
- Direct connection for local/CI environments
- SSH tunnel for remote database access
- Environment-based connection selection

## 🐳 Docker Configuration

### Dockerfile Features
- Node.js 18 LTS base image
- Google Chrome installation
- **ChromeDriver Linux binary** auto-installation (not Windows .exe)
- Non-root user for security
- Headless mode by default

### Docker Compose Services
- **selenium-tests**: Main test container
- **mysql**: Database service
- **web-app**: Optional web application service

## 🔄 CI/CD Pipelines

### GitHub Actions (`.github/workflows/ci.yml`)
- Automated testing on push/PR
- MySQL service integration
- Chrome/ChromeDriver installation
- Test result artifacts

### GitLab CI (`.gitlab-ci.yml`)
- Multi-stage pipeline (test, build, deploy)
- Docker registry integration
- Manual deployment stage

## 📋 Available Scripts

```bash
npm test                 # Run all tests
npm run test:headless    # Run tests in headless mode
npm run test:ci          # Run tests for CI environment
npm run test:single      # Run interactive test runner
npm run test:docker      # Run tests in Docker
npm run test:docker:clean # Clean Docker run
```

## 🔐 Security Considerations

1. **SSH Keys**: Store private keys securely in CI/CD secrets
2. **Database Credentials**: Use environment variables, never hardcode
3. **Non-root User**: Docker runs as non-root user
4. **Network Isolation**: Use Docker networks for service communication

## 🐛 Troubleshooting

### Common Issues

1. **Chrome Driver Not Found**
   - Ensure ChromeDriver is in PATH
   - Check Chrome version compatibility

2. **Database Connection Failed**
   - Verify database credentials
   - Check network connectivity
   - Ensure SSH tunnel is working (if applicable)

3. **Headless Mode Issues**
   - Add `--no-sandbox` flag
   - Check display/X11 configuration

### Debug Mode

```bash
# Run with debug output
DEBUG=* npm test

# Run specific test
node test/test01.js
```

## 📊 Monitoring

- Test results are saved to `test/test_results/`
- CI/CD pipelines provide test artifacts
- Docker logs available for container debugging

## 🔄 Updates

To update the deployment:
1. Pull latest changes
2. Update environment variables if needed
3. Rebuild Docker images
4. Restart services

```bash
git pull
docker-compose down
docker-compose up --build
```
