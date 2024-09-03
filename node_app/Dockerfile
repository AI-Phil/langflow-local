# Stage 1: Build the application
FROM node:22-alpine3.20 as builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

# Stage 2: Run the application
FROM node:22-alpine3.20

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
