# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG BACKEND_DOMAIN
ENV BACKEND_DOMAIN=${BACKEND_DOMAIN}
RUN npx ng build --configuration=production

# Production stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist/neighborhood-marketplace /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
