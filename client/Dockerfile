# المرحلة الأولى: مرحلة البناء (Build Stage)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY

RUN npm run build

# المرحلة الثانية: التشغيل عبر خادم Nginx السريع والخفيف
FROM nginx:alpine

# نسخ ملفات الواجهة النهائية فقط إلى مسار Nginx الافتراضي
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ ملف إعدادات Nginx المخصص لخدمة التطبيق (سننشئه في الخطوة القادمة)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]