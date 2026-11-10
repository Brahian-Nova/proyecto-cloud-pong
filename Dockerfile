# 1. Imagen base oficial de Python liviana
FROM python:3.11-slim

# 2. Instalar tzdata para reconocer la zona horaria de Colombia (America/Bogota)
RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*

# 3. Carpeta de trabajo dentro del contenedor
WORKDIR /app

# 4. Copiar e instalar las librerías necesarias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar todo el código (app.py, static, etc.)
COPY . .

# 6. Puerto en el que corre Flask
EXPOSE 5000

# 7. Comando para iniciar la aplicación con Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
