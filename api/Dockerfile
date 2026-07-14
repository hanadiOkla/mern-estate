FROM node:20-alpine

# ضبط بيئة الإنتاج الفعلي لتسريع أداء Express والـ V8 Engine
ENV NODE_ENV=production

WORKDIR /app

# نسخ ملفات الحزم أولاً للاستفادة من الـ Docker Cache
COPY package*.json ./
RUN npm ci --only=production

# نسخ ملفات الباك إند مع نقل ملكية الملفات للمستخدم الآمن node
COPY --chown=node:node ./api .

# التحول للمستخدم غير الصلاحي لحظر أي اختراق محتمل للسيرفر
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]