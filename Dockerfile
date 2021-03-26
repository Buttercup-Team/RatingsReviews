FROM node:latest
RUN mkdir /app
ADD . /app

WORKDIR /app


RUN npm install

EXPOSE 3003
CMD [ "node", "server"]