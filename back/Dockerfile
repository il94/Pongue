FROM node:lts

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g npm@10.4.0 prisma

COPY . .

COPY defaultChannelAvatar ./defaultChannelAvatar
COPY defaultUserAvatars ./defaultUserAvatars
RUN mkdir -p uploads && chmod 755 uploads

COPY ./start.sh /usr/local/bin
RUN chmod +x /usr/local/bin/start.sh

ENTRYPOINT ["start.sh"]
