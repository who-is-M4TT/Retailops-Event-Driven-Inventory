# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# CRA bakes REACT_APP_* values in at build time
ARG REACT_APP_PRODUCT_API_URL
ARG REACT_APP_INVENTORY_API_URL
ARG REACT_APP_API_KEY
ARG REACT_APP_APPINSIGHTS_CONNECTION_STRING
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
