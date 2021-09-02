FROM node:16-buster
RUN apt update && apt install -y default-mysql-client

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./
RUN npm run db:generate
COPY . /app

EXPOSE 8000
CMD npm start
