# Use Node.js 20 based on Alpine Linux
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy backend package files first
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Copy the rest of the backend source code
COPY backend/ ./

# Expose the port the app runs on (Railway uses environment variable PORT)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
