FROM node:20-alpine

WORKDIR /app

# --- Build Frontend ---
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
# Build creates /app/frontend/dist
RUN npm run build

# --- Setup Backend ---
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./

# Expose port
EXPOSE 3000

# Start backend
CMD ["npm", "start"]
