/**
 * Interactive Ceremony Generator - Professional Version
 * Features:
 * - Empty placeholder rows for positions 1-3 initially
 * - 3rd and 2nd reveals update table only
 * - 1st place shows full overlay with university congrats text
 * - Light theme with blur effect for champion reveal
 */

interface TeamRank {
  rank: number;
  teamName: string;
  solvedCount: number;
  totalScore: number;
  totalPenalty: number;
}

interface CeremonyData {
  contestName: string;
  contestDate: string;
  top3: TeamRank[];
  honorableMentions: TeamRank[];
}

export function generateInteractiveCeremony(data: CeremonyData): string {
  const { contestName, contestDate, top3, honorableMentions } = data;

  // Create placeholder rows with empty data for positions 1-3
  const placeholderRows = [1, 2, 3].map((rank) => ({
    rank,
    teamName: "???",
    totalScore: "???",
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contestName} - Award Ceremony</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #ffffff;
            color: #1e293b;
            min-height: 100vh;
            overflow-x: hidden;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
            transition: filter 0.8s ease, opacity 0.8s ease;
        }

        .container.blurred {
            filter: blur(12px);
            opacity: 0.3;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }

        .header .date {
            font-size: 1.1rem;
            color: #64748b;
        }

        /* Canvas for fireworks */
        #fireworks-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            display: none;
        }

        #fireworks-canvas.active {
            display: block;
        }

        /* Table Styles */
        .results-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }

        .results-table thead {
            background: #f8fafc;
        }

        .results-table th {
            padding: 1rem 1.5rem;
            text-align: left;
            font-weight: 700;
            font-size: 0.9rem;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #e2e8f0;
        }

        .results-table th:first-child {
            width: 100px;
            text-align: center;
        }

        .results-table th:last-child {
            width: 150px;
            text-align: right;
        }

        .results-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
            background: white;
            transition: all 0.5s ease;
        }

        /* Placeholder rows - positions 1-3 */
        .results-table tbody tr.placeholder-row {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .results-table tbody tr.placeholder-row td {
            color: #94a3b8;
            font-style: italic;
        }

        /* Gold/Silver/Bronze highlights for Top 3 when revealed */
        .results-table tbody tr[data-rank="1"]:not(.placeholder-row) {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #fbbf24;
        }

        .results-table tbody tr[data-rank="2"]:not(.placeholder-row) {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-left: 4px solid #9ca3af;
        }

        .results-table tbody tr[data-rank="3"]:not(.placeholder-row) {
            background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
            border-left: 4px solid #ea580c;
        }

        .results-table td {
            padding: 1rem 1.5rem;
            color: #1e293b;
        }

        .results-table td.rank {
            text-align: center;
            font-weight: 700;
            font-size: 1.1rem;
            color: #475569;
        }

        .results-table td.name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
        }

        .results-table td.score {
            text-align: right;
            font-weight: 800;
            font-size: 1.2rem;
            color: #059669;
        }

        /* Winner Reveal Overlay */
        .winner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 600;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.8s ease;
        }

        .winner-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Top Left Text */
        .congrats-text {
            position: absolute;
            top: 8vh;
            left: 5vw;
            max-width: 40vw;
            opacity: 0;
            transform: translateX(-50px);
            transition: all 0.8s ease 0.2s;
        }

        .winner-overlay.active .congrats-text {
            opacity: 1;
            transform: translateX(0);
        }

        .congrats-text .university {
            font-size: 1.2rem;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 2px;
            text-transform: uppercase;
            line-height: 1.6;
        }

        .congrats-text .congratulates {
            font-size: 2rem;
            font-weight: 800;
            color: #1e293b;
            margin-top: 0.5rem;
        }

        /* Bottom Right Text */
        .winner-label {
            position: absolute;
            bottom: 8vh;
            right: 5vw;
            opacity: 0;
            transform: translateX(50px);
            transition: all 0.8s ease 0.4s;
        }

        .winner-overlay.active .winner-label {
            opacity: 1;
            transform: translateX(0);
        }

        .winner-label span {
            font-size: 5rem;
            font-weight: 900;
            color: #fbbf24;
            text-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
            letter-spacing: 8px;
        }

        /* Champion Center */
        .champion-spotlight {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, 100%);
            text-align: center;
            opacity: 0;
            transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s;
        }

        .winner-overlay.active .champion-spotlight {
            opacity: 1;
            transform: translate(-50%, -50%);
        }

        .champion-spotlight .medal {
            font-size: 10rem;
            margin-bottom: 0.5rem;
            animation: championBounce 1s ease infinite;
        }

        @keyframes championBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
        }

        .champion-spotlight .rank-label {
            font-size: 1.5rem;
            color: #b45309;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 6px;
            margin-bottom: 0.5rem;
        }

        .champion-spotlight .team-name {
            font-size: 4rem;
            font-weight: 900;
            color: #1e293b;
            margin-bottom: 0.5rem;
            line-height: 1.2;
        }

        .champion-spotlight .score {
            font-size: 3rem;
            font-weight: 900;
            color: #059669;
        }

        /* Hint Text */
        .hint {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: white;
            padding: 0.75rem 2rem;
            border-radius: 50px;
            font-size: 0.95rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-weight: 600;
        }

        .hint kbd {
            background: white;
            color: #1e293b;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 700;
            margin: 0 0.25rem;
        }
    </style>
</head>
<body>
    <canvas id="fireworks-canvas"></canvas>

    <div class="container" id="main-container">
        <!-- Header -->
        <div class="header">
            <h1>${contestName}</h1>
            <div class="date">Award Ceremony &#8226; ${contestDate}</div>
        </div>

        <!-- Results Table -->
        <table class="results-table" id="results-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Team Name</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody id="table-body">
                ${placeholderRows
                  .map(
                    (row) => `
                <tr data-rank="${row.rank}" class="placeholder-row" id="placeholder-${row.rank}">
                    <td class="rank">#${row.rank}</td>
                    <td class="name">${row.teamName}</td>
                    <td class="score">${row.totalScore}</td>
                </tr>
                `
                  )
                  .join("")}
                ${honorableMentions
                  .map(
                    (team) => `
                <tr data-rank="${team.rank}">
                    <td class="rank">#${team.rank}</td>
                    <td class="name">${team.teamName}</td>
                    <td class="score">${team.totalScore} pts</td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    </div>

    <!-- Winner Reveal Overlay -->
    <div class="winner-overlay" id="winner-overlay">
        <!-- Top Left - University Text -->
        <div class="congrats-text">
            <div class="university">
                The University of Lahore<br>
                Sargodha Campus
            </div>
            <div class="congratulates">Congratulates The</div>
        </div>

        <!-- Center - Champion -->
        <div class="champion-spotlight" id="champion">
            <div class="medal">&#127941;</div>
            <div class="rank-label">Champion</div>
            <div class="team-name">${top3[0]?.teamName || "N/A"}</div>
            <div class="score">${top3[0]?.totalScore || 0} pts</div>
        </div>

        <!-- Bottom Right - Winner Label -->
        <div class="winner-label">
            <span>WINNER</span>
        </div>
    </div>

    <!-- Hint -->
    <div class="hint" id="hint">
        Press <kbd>&#8594;</kbd> or <kbd>Space</kbd> to reveal 3rd place
    </div>

    <script>
        // Team data for reveals
        const top3 = ${JSON.stringify(top3)};

        // State Management
        let stage = 0;
        const maxStage = 3;

        // Elements
        const mainContainer = document.getElementById('main-container');
        const winnerOverlay = document.getElementById('winner-overlay');
        const hint = document.getElementById('hint');
        const canvas = document.getElementById('fireworks-canvas');
        const ctx = canvas.getContext('2d');

        // Canvas setup
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Fireworks System
        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.radius = Math.random() * 3 + 2;
                this.velocity = {
                    x: (Math.random() - 0.5) * 12,
                    y: (Math.random() - 0.5) * 12
                };
                this.alpha = 1;
                this.decay = Math.random() * 0.02 + 0.01;
            }

            update() {
                this.velocity.y += 0.15;
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.alpha -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }
        }

        let particles = [];
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F59E0B', '#EF4444', '#8B5CF6'];

        function createFirework(x, y) {
            const particleCount = 80;
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        let fireworksActive = false;
        function animateFireworks() {
            if (!fireworksActive) {
                particles = [];
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles = particles.filter(particle => {
                particle.update();
                particle.draw();
                return particle.alpha > 0;
            });

            if (Math.random() < 0.08) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * (canvas.height * 0.6);
                createFirework(x, y);
            }

            requestAnimationFrame(animateFireworks);
        }

        // Replace placeholder with actual data
        function revealPosition(rank) {
            const placeholder = document.getElementById('placeholder-' + rank);
            if (!placeholder) return;

            const team = top3.find(t => t.rank === rank);
            if (!team) return;

            placeholder.classList.remove('placeholder-row');
            placeholder.querySelector('.name').textContent = team.teamName;
            placeholder.querySelector('.score').textContent = team.totalScore + ' pts';
        }

        function nextStage() {
            if (stage >= maxStage) return;
            stage++;

            if (stage === 1) {
                // Reveal 3rd place - TABLE ONLY
                revealPosition(3);
                hint.innerHTML = 'Press <kbd>&#8594;</kbd> or <kbd>Space</kbd> to reveal 2nd place';

            } else if (stage === 2) {
                // Reveal 2nd place - TABLE ONLY
                revealPosition(2);
                hint.innerHTML = 'Press <kbd>&#8594;</kbd> or <kbd>Space</kbd> to reveal the Champion!';

            } else if (stage === 3) {
                // CHAMPION REVEAL - Full overlay with text
                mainContainer.classList.add('blurred');
                winnerOverlay.classList.add('active');
                hint.innerHTML = '&#127881; Congratulations to all winners! &#127881;';

                // Start fireworks after reveal
                setTimeout(() => {
                    canvas.classList.add('active');
                    fireworksActive = true;
                    animateFireworks();
                }, 1200);
            }
        }

        function prevStage() {
            if (stage <= 0) return;

            // Stop fireworks if going back from stage 3
            if (stage === 3) {
                fireworksActive = false;
                canvas.classList.remove('active');
                mainContainer.classList.remove('blurred');
                winnerOverlay.classList.remove('active');
            }

            stage--;

            if (stage === 0) {
                hint.innerHTML = 'Press <kbd>&#8594;</kbd> or <kbd>Space</kbd> to reveal 3rd place';
            } else if (stage === 1) {
                hint.innerHTML = 'Press <kbd>&#8594;</kbd> or <kbd>Space</kbd> to reveal 2nd place';
            } else if (stage === 2) {
                hint.innerHTML = 'Press <kbd>&#8594;</kbd> or <kbd>Space</kbd> to reveal the Champion!';
            }
        }

        // Keyboard Controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                nextStage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevStage();
            }
        });
    </script>
</body>
</html>`;
}
