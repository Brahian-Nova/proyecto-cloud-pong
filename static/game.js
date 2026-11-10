const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// Elementos de la interfaz y modal
const modal = document.getElementById("game-modal");
const modalWinner = document.getElementById("modal-winner");
const modalScore = document.getElementById("modal-score");
const modalStatus = document.getElementById("modal-status");
const btnModalReplay = document.getElementById("btn-modal-replay");
const btnModalPause = document.getElementById("btn-modal-pause");
const btnTogglePause = document.getElementById("btn-toggle-pause");
const btnRestart = document.getElementById("btn-restart");
const infoServerElem = document.getElementById("info-server");
const historialBodyElem = document.getElementById("historial-body");

// Constantes del juego
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 6;
const WINNING_SCORE = 5;
const BASE_BALL_SPEED = 3.2; // Velocidad inicial más suave y controlable
const MAX_BALL_SPEED = 7.0;  // Límite máximo para que no se vuelva inalcanzable

// Variables de estado
let score1 = 0;
let score2 = 0;
let gameOver = false;
let isPaused = false;

// Paletas
const paddle1 = {
    x: 20,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    color: '#00b4d8'
};

const paddle2 = {
    x: canvas.width - 20 - PADDLE_WIDTH,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    color: '#ffd166'
};

// Pelota
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 10,
    dx: BASE_BALL_SPEED,
    dy: 2
};

// Manejo de teclado
const keys = {};

window.addEventListener("keydown", (e) => {
    // Evitar que las flechas o la barra espaciadora hagan scroll en la página
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.code === "Space") {
        e.preventDefault();
    }

    // Tecla P o Espacio para pausar/reanudar (excepto si terminó el juego)
    if (e.key === "p" || e.key === "P" || e.code === "Space") {
        if (!gameOver) {
            togglePause();
            return;
        }
    }
    keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.code === "Space") {
        e.preventDefault();
    }
    keys[e.key] = false;
});

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    // Alternar dirección al sacar con velocidad inicial suave
    const direction = Math.random() > 0.5 ? 1 : -1;
    const vertical = (Math.random() * 2 - 1) * 2;
    ball.dx = direction * BASE_BALL_SPEED;
    ball.dy = vertical === 0 ? 1.5 : vertical;
}

function resetGame() {
    score1 = 0;
    score2 = 0;
    gameOver = false;
    isPaused = false;
    paddle1.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    paddle2.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    resetBall();
    modal.style.display = "none";
    updatePauseButtonText();
}

function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    updatePauseButtonText();
}

function updatePauseButtonText() {
    if (btnTogglePause) {
        btnTogglePause.innerHTML = isPaused ? "▶️ Reanudar Juego" : "⏸️ Pausar Juego";
    }
}

// Botones de control
if (btnTogglePause) {
    btnTogglePause.addEventListener("click", () => {
        togglePause();
    });
}

if (btnRestart) {
    btnRestart.addEventListener("click", () => {
        resetGame();
    });
}

// Botones del modal de fin de partida
if (btnModalReplay) {
    btnModalReplay.addEventListener("click", () => {
        resetGame();
    });
}

if (btnModalPause) {
    btnModalPause.addEventListener("click", () => {
        // Pausar el juego y cerrar el modal para observar la mesa o descansar
        isPaused = true;
        modal.style.display = "none";
        updatePauseButtonText();
    });
}

function update() {
    // Si la partida terminó o está pausada, no actualizar posiciones
    if (gameOver || isPaused) return;

    // Controles J1 (W/S)
    if (keys['w'] || keys['W']) paddle1.y -= PADDLE_SPEED;
    if (keys['s'] || keys['S']) paddle1.y += PADDLE_SPEED;

    // Controles J2 (Flechas)
    if (keys['ArrowUp']) paddle2.y -= PADDLE_SPEED;
    if (keys['ArrowDown']) paddle2.y += PADDLE_SPEED;

    paddle1.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddle1.y));
    paddle2.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddle2.y));

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Rebote techo y suelo
    if (ball.y <= 0 || ball.y + ball.size >= canvas.height) {
        ball.dy *= -1;
    }

    // Colisión Paleta 1 (Azul)
    if (ball.x <= paddle1.x + PADDLE_WIDTH &&
        ball.x >= paddle1.x &&
        ball.y + ball.size >= paddle1.y &&
        ball.y <= paddle1.y + PADDLE_HEIGHT) {
        const impactoRelativo = ((ball.y + ball.size / 2) - (paddle1.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        const nuevaVelocidad = Math.min(Math.abs(ball.dx) * 1.03, MAX_BALL_SPEED);
        ball.dx = nuevaVelocidad;
        ball.dy = impactoRelativo * 3.5;
    }

    // Colisión Paleta 2 (Amarillo)
    if (ball.x + ball.size >= paddle2.x &&
        ball.x <= paddle2.x + PADDLE_WIDTH &&
        ball.y + ball.size >= paddle2.y &&
        ball.y <= paddle2.y + PADDLE_HEIGHT) {
        const impactoRelativo = ((ball.y + ball.size / 2) - (paddle2.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        const nuevaVelocidad = Math.min(Math.abs(ball.dx) * 1.03, MAX_BALL_SPEED);
        ball.dx = -nuevaVelocidad;
        ball.dy = impactoRelativo * 3.5;
    }

    // Puntos
    if (ball.x < 0) {
        score2++;
        verificarFinPartida();
        if (!gameOver) resetBall();
    } else if (ball.x > canvas.width) {
        score1++;
        verificarFinPartida();
        if (!gameOver) resetBall();
    }
}

function render() {
    // Fondo
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Línea central
    ctx.strokeStyle = "#444";
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Marcadores
    ctx.fillStyle = "#ffffff";
    ctx.font = "36px 'Courier New'";
    ctx.fillText(score1, canvas.width / 4, 60);
    ctx.fillText(score2, (canvas.width / 4) * 3, 60);

    // Paletas
    ctx.fillStyle = paddle1.color;
    ctx.fillRect(paddle1.x, paddle1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = paddle2.color;
    ctx.fillRect(paddle2.x, paddle2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Pelota
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

    // Letrero de pausa sobre el canvas
    if (isPaused && !gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffd166";
        ctx.font = "30px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("⏸️ JUEGO PAUSADO", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "15px 'Courier New'";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Presiona 'P', 'Espacio' o el botón para continuar", canvas.width / 2, canvas.height / 2 + 25);
        ctx.textAlign = "start";
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

async function verificarFinPartida() {
    if (score1 >= WINNING_SCORE || score2 >= WINNING_SCORE) {
        gameOver = true;
        ball.dx = 0;
        ball.dy = 0;

        const ganador = score1 > score2 ? "Jugador 1 (Azul)" : "Jugador 2 (Amarillo)";
        const ganadorNombre = score1 > score2 ? "Jugador 1" : "Jugador 2";

        // Mostrar el modal con las opciones solicitadas
        modalWinner.innerText = `🏆 Ganador: ${ganador}`;
        modalScore.innerText = `Marcador: ${score1} - ${score2}`;
        modalStatus.innerText = "Guardando resultado en el backend...";
        modal.style.display = "flex";

        // Persistir en backend (PostgreSQL)
        try {
            const res = await fetch('/api/partidas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jugador_1: "Jugador 1",
                    jugador_2: "Jugador 2",
                    puntos_j1: score1,
                    puntos_j2: score2,
                    ganador: ganadorNombre
                })
            });
            const data = await res.json();
            if (infoServerElem && data.instancia) {
                infoServerElem.innerText = `Última petición procesada por: ${data.instancia}`;
            }
            modalStatus.innerText = `✅ Partida registrada en PostgreSQL (${data.instancia || 'backend'})`;
            cargarHistorial();
        } catch (err) {
            console.error("Error al registrar partida en backend:", err);
            modalStatus.innerText = "⚠️ No se pudo conectar con el backend para guardar.";
        }
    }
}

async function cargarHistorial() {
    try {
        const res = await fetch('/api/partidas');
        const json = await res.json();
        if (!historialBodyElem) return;
        historialBodyElem.innerHTML = "";

        if (json.datos && json.datos.length > 0) {
            json.datos.forEach(p => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.puntos_j1} - ${p.puntos_j2}</td>
                    <td><strong>${p.ganador}</strong></td>
                    <td style="color: #00ffcc;">${p.instancia_procesado}</td>
                    <td>${new Date(p.fecha).toLocaleTimeString()}</td>
                `;
                historialBodyElem.appendChild(tr);
            });
        } else {
            historialBodyElem.innerHTML = `<tr><td colspan="5">No hay partidas registradas aún.</td></tr>`;
        }
    } catch (err) {
        console.error("Error al cargar historial:", err);
    }
}

// Conectar con el endpoint de salud
fetch('/api/health')
    .then(r => r.json())
    .then(d => {
        if (infoServerElem) {
            infoServerElem.innerText = `Conectado al Host: ${d.server_id}`;
        }
    })
    .catch(() => {
        if (infoServerElem) {
            infoServerElem.innerText = "Servidor desconectado";
        }
    });

cargarHistorial();
gameLoop();
