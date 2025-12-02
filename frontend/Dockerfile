FROM node:18-bullseye-slim as build
WORKDIR /app
COPY frontend/package.json frontend/tsconfig.json frontend/vite.config.ts frontend/tailwind.config.cjs frontend/postcss.config.cjs frontend/index.html ./
COPY frontend/src ./src
RUN npm install && npm run build

FROM node:18-bullseye-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["bash", "-c", "cp -r /app/dist /dist && tail -f /dev/null"]
