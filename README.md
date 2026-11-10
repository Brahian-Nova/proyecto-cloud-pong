# 🏓 Cloud Pong - Arquitectura Cloud Nativa & Alta Disponibilidad

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-F46800?style=for-the-badge&logo=grafana&logoColor=white)

Proyecto práctico de ingeniería de software y computación en la nube: Implementación del clásico videojuego **Atari Pong** sobre una arquitectura distribuida, escalable, con balanceo de carga, persistencia relacional y observabilidad centralizada.

---

## 📌 Descripción del Proyecto

Este proyecto demuestra los principios fundamentales del desarrollo de aplicaciones modernas y computación en la nube:
* **Microservicios y contenedorización**: Cada componente corre en su propio contenedor Docker aislado.
* **Alta Disponibilidad y Balanceo de Carga**: Dos instancias del backend en Python procesan solicitudes en paralelo mediante NGINX (algoritmo Round Robin).
* **Persistencia Relacional**: Almacenamiento transaccional de resultados e historial de partidas en PostgreSQL con volumen persistente.
* **Observabilidad Completa (Stack PLG)**: Centralización y visualización de logs en tiempo real con **Promtail**, **Loki** y **Grafana**, sincronizados con la zona horaria de Bogotá (UTC-5).
* **Frontend Arcade Interactivo**: Renderizado en Canvas HTML5, control de estados (juego activo, pausa, fin de partida con revancha) y consumo asíncrono de API REST.

---

## 🏗️ Arquitectura del Sistema

```text
                                  [ Usuario / Navegador ]
                                             │
                                     (Puerto 80: HTTP)
                                             ▼
                                ┌─────────────────────────┐
                                │   NGINX Reverse Proxy   │
                                │   (Balanceador de Carga)│
                                └────────────┬────────────┘
                                             │ (Round Robin)
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
         ┌─────────────────────────┐                   ┌─────────────────────────┐
         │     Backend 1 (Flask)   │                   │     Backend 2 (Flask)   │
         │   Host: pong_backend_1  │                   │   Host: pong_backend_2  │
         └────────────┬────────────┘                   └────────────┬────────────┘
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             ▼
                                ┌─────────────────────────┐
                                │  PostgreSQL 15 (pongdb) │
                                │   (Volumen Persistente) │
                                └─────────────────────────┘

 ─── OBSERVABILIDAD & LOGS ──────────────────────────────────────────────────────────
 [ Backend 1 & 2 Logs ] ──► [ Promtail ] ──► [ Loki :3100 ] ──► [ Grafana :3000 ]
```

---

## 📁 Estructura del Proyecto

```text
proyecto-cloud-pong/
├── .dockerignore              # Archivos excluidos del contexto Docker
├── .gitignore                 # Archivos excluidos del repositorio Git
├── Dockerfile                 # Construcción de la imagen Python/Flask con tzdata
├── docker-compose.yml         # Orquestación de los 7 servicios y redes
├── app.py                     # API REST en Flask y conexión a PostgreSQL
├── requirements.txt           # Dependencias de Python (Flask, Psycopg2, Gunicorn)
├── nginx/
│   └── nginx.conf             # Configuración del balanceador de carga upstream
├── loki/
│   └── loki-config.yml        # Configuración del motor de logs Grafana Loki
├── promtail/
│   └── promtail-config.yml    # Agente recolector de logs
└── static/
    ├── index.html             # Interfaz web retro, modal de revancha y marcadores
    └── game.js                # Lógica del juego, físicas, eventos y llamadas a la API
```

---

## 🎮 Funcionalidades Destacadas

### 1. Juego Atari Pong
* **Físicas y rebote trigonométrico**: La bola responde al punto de impacto con la paleta (rebote en ángulos de hasta 45°) manteniendo aceleración progresiva y velocidad balanceada.
* **Modo 2 Jugadores**:
  * **Jugador 1 (Azul)**: Teclas `W` y `S`.
  * **Jugador 2 (Amarillo)**: Teclas `↑` y `↓`.
* **Pausa y Control**: Tecla `P` o `Espacio` para pausar/reanudar con bloqueo de scroll de página (`preventDefault`).
* **Modal de Fin de Partida**: Opciones interactivas de revancha (*"Jugar otra partida"*) o detener el juego (*"Pausar juego"*), evitando reinicios forzados.

### 2. Balanceo de Carga y Resiliencia
* Cada partida enviada muestra en pantalla el **Host ID** o instancia backend (`pong_backend_1` o `pong_backend_2`) que procesó la solicitud, demostrando la distribución equitativa de peticiones por parte de NGINX.

### 3. Persistencia
* Esquema SQL relacional con tabla `partidas`: almacena fecha, ganador, puntajes individuales e instancia de procesamiento.
* Volumen persistente `postgres_data` garantizando que los datos no se pierdan al reiniciar o actualizar contenedores.

### 4. Monitoreo y Observabilidad
* Generación de logs estructurados con Gunicorn.
* Recolección en tiempo real mediante Promtail y almacenamiento en Loki.
* Dashboard en Grafana disponible en el puerto `3000` con hora local de Colombia configurada.

---

## 🚀 Despliegue y Ejecución Local

### Prerrequisitos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
* Git.

### 1. Clonar el repositorio
```bash
git clone https://github.com/Brahian-Nova/proyecto-cloud-pong.git
cd proyecto-cloud-pong
```

### 2. Levantar todos los servicios con Docker Compose
```bash
docker compose up -d --build
```

### 3. Acceder a las aplicaciones
| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Juego Pong (NGINX)** | [http://localhost](http://localhost) | Entrada principal de la aplicación y juego web |
| **Grafana (Logs)** | [http://localhost:3000](http://localhost:3000) | Dashboard de observabilidad (Usuario: `admin` / Contraseña: `admin`) |
| **Loki API** | [http://localhost:3100](http://localhost:3100) | Endpoint del centralizador de logs |

---

## 🛠️ Tecnologías Empleadas

* **Lenguaje Backend**: Python 3.11
* **Framework Web & WSGI**: Flask 3.0.3, Gunicorn 22.0.0
* **Base de Datos**: PostgreSQL 15 Alpine (Driver: `psycopg2-binary`)
* **Reverse Proxy / Load Balancer**: NGINX Alpine
* **Observabilidad**: Grafana Labs (Loki 2.9.0, Promtail 2.9.0, Grafana Latest)
* **Contenedores**: Docker & Docker Compose v2
* **Frontend**: HTML5 Canvas, CSS3 Neon Arcade, JavaScript ES6 Asíncrono (`fetch` API)

---

## 👨‍💻 Autor

Proyecto desarrollado por **Brahian Nova** como parte de su portafolio académico y profesional en Ingeniería de Sistemas / Computación en la Nube.

* **Desarrollador**: [Brahian Nova](https://github.com/Brahian-Nova)
* **GitHub**: [@Brahian-Nova](https://github.com/Brahian-Nova)
* **Repositorio**: [proyecto-cloud-pong](https://github.com/Brahian-Nova/proyecto-cloud-pong)
