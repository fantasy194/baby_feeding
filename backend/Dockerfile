FROM node:18-bullseye-slim AS build
WORKDIR /usr/src/app
COPY backend/package.json backend/tsconfig.json ./
RUN npm install
COPY backend/src ./src
RUN npm run build && mkdir -p public

FROM node:18-bullseye-slim
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public
COPY backend/package.json ./package.json
RUN npm install --production
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
