FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/horses uploads/profiles

# Railway sets PORT env variable
ENV PORT=8000

# Production command - uses $PORT from environment
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
