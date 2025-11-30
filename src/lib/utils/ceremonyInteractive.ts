/**
 * Interactive Ceremony Generator - Simplified Version
 * White background, clean table, keyboard-only navigation
 */

interface TeamRank {
    rank: number;
    teamName: string;
    solvedCount: number;
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
    const allTeams = [...top3, ...honorableMentions];

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
            color: #1a202c;
            padding: 2rem;
            overflow: hidden;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1a202c;
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

        /* Main Content - Table and Podium Container */
        .content {
            position: relative;
            min-height: 600px;
        }

        /* Table Styles */
        .results-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .results-table thead {
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
        }

        .results-table th {
            padding: 1rem;
            text-align: left;
            font-weight: 700;
            font-size: 1.1rem;
            color: #475569;
            border: 1px solid #e2e8f0;
        }

        .results-table th:first-child {
            width: 120px;
            text-align: center;
        }

        .results-table th:last-child {
            width: 150px;
            text-align: center;
        }

        .results-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }

        .results-table tbody tr.hiding {
            opacity: 0;
            transform: translateX(-50px);
        }

        .results-table td {
            padding: 1rem;
            border: 1px solid #e2e8f0;
        }

        .results-table td.rank {
            text-align: center;
            font-weight: 700;
            font-size: 1.2rem;
            color: #64748b;
        }

        .results-table td.name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
        }

        .results-table td.score {
            text-align: center;
            font-weight: 800;
            font-size: 1.3rem;
            color: #059669;
        }

        /* Row Animation - Slide In */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .results-table tbody tr {
            animation: slideIn 0.5s ease forwards;
            opacity: 0;
        }

        /* Podium Container */
        .podium-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 2rem;
            height: 500px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
        }

        .podium-container.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Podium Columns */
        .podium-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            transform: translateY(50px);
        }

        .podium-column.show {
            animation: podiumReveal 0.8s ease forwards;
        }

        @keyframes podiumReveal {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .medal {
            font-size: 5rem;
            margin-bottom: 1rem;
            animation: bounce 1s ease infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        .podium-rank {
            font-size: 1.2rem;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .podium-name {
            font-size: 2rem;
            font-weight: 900;
            color: #1a202c;
            margin-bottom: 1rem;
            text-align: center;
            max-width: 300px;
        }

        .podium-score {
            font-size: 3rem;
            font-weight: 900;
            color: #059669;
        }

        /* Podium Order */
        .podium-column.second { order: 1; }
        .podium-column.first { order: 2; }
        .podium-column.third { order: 3; }

        /* Hint Text */
        .hint {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.75rem 2rem;
            border-radius: 50px;
            font-size: 0.95rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 100;
        }

        .hint kbd {
            background: white;
            color: black;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 700;
            margin: 0 0.25rem;
        }
    </style>
</head>
<body>
    <canvas id="fireworks-canvas"></canvas>
    
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>${contestName}</h1>
            <div class="date">Award Ceremony • ${contestDate}</div>
        </div>

        <!-- Main Content Area -->
        <div class="content">
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
                    ${allTeams.map((team, index) => `
                    <tr data-rank="${team.rank}" style="animation-delay: ${index * 0.1}s">
                        <td class="rank">#${team.rank}</td>
                        <td class="name">${team.teamName}</td>
                        <td class="score">${team.solvedCount}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Podium (Hidden Initially) -->
            <div class="podium-container" id="podium">
                <!-- 3rd Place -->
                <div class="podium-column third" id="place-3">
                    <div class="medal">🥉</div>
                    <div class="podium-rank">3rd Place</div>
                    <div class="podium-name">${top3[2]?.teamName || 'N/A'}</div>
                    <div class="podium-score">${top3[2]?.solvedCount || 0}</div>
                </div>
                
                <!-- 2nd Place -->
                <div class="podium-column second" id="place-2">
                    <div class="medal">🥈</div>
                    <div class="podium-rank">2nd Place</div>
                    <div class="podium-name">${top3[1]?.teamName || 'N/A'}</div>
                    <div class="podium-score">${top3[1]?.solvedCount || 0}</div>
                </div>
                
                <!-- 1st Place -->
                <div class="podium-column first" id="place-1">
                    <div class="medal">🥇</div>
                    <div class="podium-rank">Champion</div>
                    <div class="podium-name">${top3[0]?.teamName || 'N/A'}</div>
                    <div class="podium-score">${top3[0]?.solvedCount || 0}</div>
                </div>
            </div>
        </div>

        <!-- Hint -->
        <div class="hint" id="hint">
            Press <kbd>→</kbd> or <kbd>Space</kbd> to continue
        </div>
    </div>

    <script>
        // State Management
        let stage = 0;
        const maxStage = 3;

        // Elements
        const table = document.getElementById('results-table');
        const podium = document.getElementById('podium');
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
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
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
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F59E0B'];

        function createFirework(x, y) {
            const particleCount = 60;
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

            if (Math.random() < 0.06) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * (canvas.height * 0.5);
                createFirework(x, y);
            }

            requestAnimationFrame(animateFireworks);
        }

        function nextStage() {
            if (stage >= maxStage) return;
            stage++;

            if (stage === 1) {
                // Reveal 3rd place
                setTimeout(() => {
                    const row3 = document.querySelector('tr[data-rank="3"]');
                    if (row3) row3.classList.add('hiding');
                }, 300);
                
                setTimeout(() => {
                    podium.classList.add('active');
                    document.getElementById('place-3').classList.add('show');
                    hint.innerHTML = 'Press <kbd>→</kbd> or <kbd>Space</kbd> to reveal 2nd place';
                }, 800);
                
            } else if (stage === 2) {
                // Reveal 2nd place
                const row2 = document.querySelector('tr[data-rank="2"]');
                if (row2) row2.classList.add('hiding');
                
                setTimeout(() => {
                    document.getElementById('place-2').classList.add('show');
                    hint.innerHTML = 'Press <kbd>→</kbd> or <kbd>Space</kbd> to reveal Champion!';
                }, 500);
                
            } else if (stage === 3) {
                // Reveal 1st place + Fireworks
                const row1 = document.querySelector('tr[data-rank="1"]');
                if (row1) row1.classList.add('hiding');
                
                setTimeout(() => {
                    document.getElementById('place-1').classList.add('show');
                    hint.innerHTML = '🎉 Congratulations to all winners! 🎉';
                    
                    // Start fireworks
                    canvas.classList.add('active');
                    fireworksActive = true;
                    animateFireworks();
                }, 500);
            }
        }

        function prevStage() {
            if (stage <= 0) return;
            
            // Stop fireworks if going back from stage 3
            if (stage === 3) {
                fireworksActive = false;
                canvas.classList.remove('active');
            }
            
            stage--;
            
            // Implement reverse logic if needed
            // For simplicity, just update hint
            if (stage === 0) {
                hint.innerHTML = 'Press <kbd>→</kbd> or <kbd>Space</kbd> to continue';
            } else if (stage === 1) {
                hint.innerHTML = 'Press <kbd>→</kbd> or <kbd>Space</kbd> to reveal 2nd place';
            } else if (stage === 2) {
                hint.innerHTML = 'Press <kbd>→</kbd> or <kbd>Space</kbd> to reveal Champion!';
            }
        }

        // Keyboard Controls (No Visible Buttons)
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
