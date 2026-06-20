FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 👈 أضيفي هذين السطرين هنا (بين COPY . . و RUN npm run build)
ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY

RUN npm run build

# المرحلة الثانية: التشغيل باستخدام Nginx (اتركيها كما هي تماماً بدون تغيير)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]