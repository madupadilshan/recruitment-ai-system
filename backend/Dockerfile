FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]