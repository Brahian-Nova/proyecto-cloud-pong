import os
import socket
import logging
import time
from flask import Flask, request, jsonify, send_from_directory
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración de logs para salida estándar (capturados por Docker y Loki)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [Host: %(hostname)s] %(message)s'
)

app = Flask(__name__, static_folder='static')
HOSTNAME = socket.gethostname()

DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "pongdb")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres123")
DB_PORT = os.getenv("DB_PORT", "5432")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        app.logger.error(f"Error conectando a PostgreSQL: {e}", extra={"hostname": HOSTNAME})
        return None

def init_db():
    retries = 10
    while retries > 0:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS partidas (
                            id SERIAL PRIMARY KEY,
                            jugador_1 VARCHAR(50) NOT NULL,
                            jugador_2 VARCHAR(50) NOT NULL,
                            puntos_j1 INT NOT NULL,
                            puntos_j2 INT NOT NULL,
                            ganador VARCHAR(50) NOT NULL,
                            instancia_procesado VARCHAR(50) NOT NULL,
                            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                    conn.commit()
                conn.close()
                app.logger.info("Base de datos y tabla 'partidas' verificadas.", extra={"hostname": HOSTNAME})
                return
            except Exception as e:
                app.logger.error(f"Error creando tabla: {e}", extra={"hostname": HOSTNAME})
        retries -= 1
        time.sleep(2)

# Se ejecuta al iniciar el proceso con Gunicorn
init_db()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "server_id": HOSTNAME}), 200

@app.route('/api/partidas', methods=['POST'])
def guardar_partida():
    data = request.get_json() or {}
    j1 = data.get('jugador_1', 'Jugador 1')
    j2 = data.get('jugador_2', 'Jugador 2')
    puntos_j1 = data.get('puntos_j1', 0)
    puntos_j2 = data.get('puntos_j2', 0)
    ganador = data.get('ganador', 'Nadie')

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Error al conectar con la base de datos"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO partidas (jugador_1, jugador_2, puntos_j1, puntos_j2, ganador, instancia_procesado)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
            """, (j1, j2, puntos_j1, puntos_j2, ganador, HOSTNAME))
            partida_id = cur.fetchone()[0]
            conn.commit()
            
        app.logger.info(
            f"Partida registrada ID={partida_id}. Ganador={ganador} ({puntos_j1}-{puntos_j2}) en {HOSTNAME}",
            extra={"hostname": HOSTNAME}
        )
        return jsonify({"mensaje": "Partida registrada con éxito", "id": partida_id, "instancia": HOSTNAME}), 201
    except Exception as e:
        app.logger.error(f"Error al guardar partida: {e}", extra={"hostname": HOSTNAME})
        return jsonify({"error": "Error interno"}), 500
    finally:
        conn.close()

@app.route('/api/partidas', methods=['GET'])
def listar_partidas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Sin conexión a base de datos"}), 500

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM partidas ORDER BY fecha DESC LIMIT 10;")
            partidas = cur.fetchall()
            
        app.logger.info(f"Consulta de historial realizada desde {HOSTNAME}", extra={"hostname": HOSTNAME})
        return jsonify({"instancia": HOSTNAME, "datos": partidas}), 200
    except Exception as e:
        app.logger.error(f"Error consultando historial: {e}", extra={"hostname": HOSTNAME})
        return jsonify({"error": "Error interno"}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)