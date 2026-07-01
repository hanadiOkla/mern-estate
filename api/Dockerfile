FROM node:20-alpine
WORKDIR /app

# نسخ ملفات الـ package من جذر المشروع (الخارج)
COPY package*.json ./
RUN npm install --only=production

# نسخ محتويات مجلد الـ api بالكامل إلى الـ WORKDIR
COPY ./api .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]