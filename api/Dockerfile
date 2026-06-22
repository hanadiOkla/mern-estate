# api/Dockerfile
FROM node:20-alpine
WORKDIR /app

# تأكدي أن الأسطر مكتوبة هكذا مباشرة (بدون كلمة api/ قبل اسم الملف)
COPY package*.json ./  
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]