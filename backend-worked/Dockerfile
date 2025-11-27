# Use Node 18 LTS
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]