FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm build
RUN pnpm prune --prod
EXPOSE 3000
CMD ["node", "dist/server.js"]