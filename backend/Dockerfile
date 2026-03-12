FROM python:3.11-slim

WORKDIR /app

# Create non-root user and data directory
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
    && mkdir -p /app/data && chown -R appuser:appuser /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
