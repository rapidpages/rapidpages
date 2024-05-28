# Use the official Node.js 18 (Alpine) image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port your Next.js app runs on (3000 by default)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
