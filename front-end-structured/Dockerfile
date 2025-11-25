# Step 1: Build stage
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies including dev tools (Vite)
RUN npm ci --include=dev

# Copy the rest of the code
COPY . .

# Run Vite build using full binary path
RUN node ./node_modules/vite/bin/vite.js build

# Step 2: Serve using NGINX
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
