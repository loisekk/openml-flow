# server/Dockerfile
FROM python:3.11-slim

# Install system dependencies for scikit-learn/pandas
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]