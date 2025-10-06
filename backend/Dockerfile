# Use Node.js 18 (LTS version)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port 5000
EXPOSE 5000

# Start the server
CMD ["npm", "run", "backend"]
