FROM node:22-alpine3.19

WORKDIR /client
COPY client/package.json client/package-lock.json ./

RUN npm install

WORKDIR /client
COPY client .
COPY shared /shared

ARG SERVER_URL
ENV SERVER ${SERVER_URL}

RUN npm run build
CMD ["npm", "run", "start"]