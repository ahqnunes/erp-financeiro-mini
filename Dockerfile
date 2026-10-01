FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/backend:$PATH"
COPY backend ./backend
RUN pip install --no-cache-dir ./backend
COPY --from=frontend /app/dist ./dist
CMD ["sh", "-c", "cd backend && alembic upgrade head && cd .. && uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 3000"]

