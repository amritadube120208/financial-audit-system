FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY app ./app
RUN pip install --no-cache-dir .
COPY models ./models
ENV DATABASE_URL=sqlite+aiosqlite:////data/auditgraph.db RECOVERY_DIR=/data/recovery
RUN mkdir -p /data/recovery
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
