# ✅ Use a stable Node base image
FROM node:20-slim

# ✅ Install Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# ✅ Install latest Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb

# ✅ Set Puppeteer to use system Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_DOWNLOAD=true

# ✅ Create app directory
WORKDIR /usr/src/app

# ✅ Install dependencies
COPY package*.json ./
RUN npm ci

# ✅ Copy app source
COPY . .

# ✅ Build NestJS app
RUN npm run build

# ✅ Run app
CMD [ "node", "dist/main.js" ]
