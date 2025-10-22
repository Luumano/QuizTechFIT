import { questions } from './data.js';

// --- Obter referências aos elementos HTML ---
const mainContainer = document.getElementById('main-container');
const startScreen = document.getElementById('start-screen');
const leaderboardSide = document.getElementById('leaderboard-container-side');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');

const playerNameInput = document.getElementById('player-name-input');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const refreshLeaderboardButton = document.getElementById('refresh-leaderboard');
const resetLeaderboardButton = document.getElementById('reset-leaderboard-button'); // Botão Resetar

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const timerDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('score');
const helpButton = document.getElementById('help-button');
const helpCountDisplay = document.getElementById('help-count');
const skipButton = document.getElementById('skip-button');
const skipCountDisplay = document.getElementById('skip-count');
const finalScoreDisplay = document.getElementById('final-score');

const leaderboardTableBodySide = document.querySelector('#leaderboard-side tbody');
const leaderboardTableBodyEndgame = document.querySelector('#leaderboard-endgame tbody');

// --- Estado do Jogo ---
let currentPlayerName = '';
let currentQuestionIndex = 0;
let score = 0;
let skipCount = 3;
let helpCount = 3;
let timerId;
const TIME_LIMIT = 10; // Voltou a ser 'const'
let leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];
let shuffledQuestions = [];

// --- Funções para Gerenciar Telas ---
function showScreen(screen) {
    const allScreens = [startScreen, leaderboardSide, quizContainer, resultContainer];
    allScreens.forEach(s => s.style.display = 'none');
    screen.style.display = 'flex';
}

function showInitialScreen() {
    showScreen(startScreen);
    mainContainer.style.display = 'flex';
    leaderboardSide.style.display = 'flex';
}

// --- Funções do Jogo ---

function startGame() {
    currentPlayerName = playerNameInput.value || 'Anônimo';
    if (currentPlayerName.trim() === '') {
        alert('Por favor, digite seu nome para começar!');
        return;
    }
    
    // Oculta as telas iniciais e mostra a tela do quiz
    mainContainer.style.display = 'none';
    showScreen(quizContainer);

    // Embaralha as perguntas e pega apenas as primeiras 35
    shuffledQuestions = shuffleArray(questions).slice(0, 35);
    
    currentQuestionIndex = 0;
    score = 0;
    skipCount = 3;
    helpCount = 3;
    scoreDisplay.textContent = score;
    helpCountDisplay.textContent = helpCount;
    skipCountDisplay.textContent = skipCount;

    renderQuestion();
}

function restartGame() {
    showInitialScreen();
    playerNameInput.value = '';
    displayLeaderboard(leaderboardTableBodySide);
}

function renderQuestion() {
    if (currentQuestionIndex >= shuffledQuestions.length) {
        endGame();
        return;
    }
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    questionText.textContent = currentQuestion.question;
    optionsContainer.innerHTML = '';

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.addEventListener('click', () => handleAnswer(option));
        optionsContainer.appendChild(button);
    });
    startTimer();
}

function startTimer() {
    let timeLeft = TIME_LIMIT;
    timerDisplay.textContent = timeLeft;
    if (timerId) clearInterval(timerId); // Garante que não haja múltiplos timers
    
    timerId = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            handleTimeOut();
        }
    }, 1000);
}

function handleAnswer(selectedOption) {
    clearInterval(timerId);
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    
    // Feedback visual (classes correct/incorrect no CSS) pode ser adicionado aqui, se necessário.
    
    if (selectedOption === currentQuestion.correctAnswer) {
        score++;
        scoreDisplay.textContent = score;
    }
    currentQuestionIndex++;
    renderQuestion();
}

function handleTimeOut() {
    currentQuestionIndex++;
    renderQuestion();
}

function handleSkip() {
    if (skipCount > 0) {
        skipCount--;
        skipCountDisplay.textContent = skipCount;
        clearInterval(timerId);
        currentQuestionIndex++;
        renderQuestion();
    }
}

function handleHelp() {
    if (helpCount > 0) {
        helpCount--;
        helpCountDisplay.textContent = helpCount;
        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        const correct = currentQuestion.correctAnswer;
        const buttons = Array.from(optionsContainer.querySelectorAll('.option-button'));
        const incorrectButtons = buttons.filter(btn => btn.textContent !== correct);
        if (incorrectButtons.length > 1) {
            // Remove apenas uma opção incorreta
            const randomIndex = Math.floor(Math.random() * incorrectButtons.length);
            incorrectButtons[randomIndex].remove();
        }
    }
}

function endGame() {
    clearInterval(timerId);
    showScreen(resultContainer);
    finalScoreDisplay.textContent = score;

    leaderboardData.push({ name: currentPlayerName, score: score });
    localStorage.setItem('leaderboard', JSON.stringify(leaderboardData));
    
    displayLeaderboard(leaderboardTableBodyEndgame);
}

function displayLeaderboard(tableBody) {
    leaderboardData.sort((a, b) => b.score - a.score);
    tableBody.innerHTML = '';
    leaderboardData.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}º</td>
            <td>${player.name}</td>
            <td>${player.score}</td>
        `;
        tableBody.appendChild(row);
    });
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// --- Função para Resetar Placar de Líderes (Mantida) ---
function resetLeaderboard() {
    // Confirmação para evitar exclusão acidental
    if (confirm('Tem certeza que deseja apagar permanentemente todo o placar de líderes? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('leaderboard');
        leaderboardData = []; // Limpa os dados em memória
        alert('Placar de líderes resetado com sucesso!');
        // Atualiza ambas as tabelas
        displayLeaderboard(leaderboardTableBodySide);
        displayLeaderboard(leaderboardTableBodyEndgame);
    }
}

// --- Adicionar Event Listeners ---
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
refreshLeaderboardButton.addEventListener('click', () => {
    leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];
    displayLeaderboard(leaderboardTableBodySide);
});

// Adiciona listener para o botão Resetar
if (resetLeaderboardButton) {
    resetLeaderboardButton.addEventListener('click', resetLeaderboard);
}

helpButton.addEventListener('click', handleHelp);
skipButton.addEventListener('click', handleSkip);

// --- Iniciar o Jogo ---
document.addEventListener('DOMContentLoaded', () => {
    showInitialScreen();
    displayLeaderboard(leaderboardTableBodySide);
});