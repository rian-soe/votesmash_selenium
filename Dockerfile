FROM node:18-slim

# Install dependencies for Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome (stable)
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci

# Copy app
COPY . .

# Create non-root user
RUN groupadd -r selenium && useradd -r -g selenium selenium \
    && chown -R selenium:selenium /app
USER selenium

# Headless defaults
ENV HEADLESS=true
ENV BROWSER=chrome
ENV WINDOW_SIZE=1920,1080
ENV CI=true

EXPOSE 3000
CMD ["npm", "test"]
