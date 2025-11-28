'use server';

import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// ============================================================
// TYPES
// ============================================================

export interface CeremonyResult {
  success: boolean;
  html?: string;
  filePath?: string;
  error?: string;
}

interface TeamResult {
  rank: number;
  name: string;
  score: number;
  lab: string;
  members: string[];
}

// ============================================================
// CEREMONY HTML GENERATOR
// ============================================================

/**
 * Generate self-contained HTML file for offline award ceremony
 * Features: Spacebar reveal, CSS confetti, embedded logo
 * Size: <2MB, no external dependencies
 */
export async function generateCeremonyHTML(
  contestId: string
): Promise<CeremonyResult> {
  try {
    // 1. Verify admin/jury role
    const session = await getSession();

    if (!session || (session.role !== 'ADMIN' && session.role !== 'JURY')) {
      return { success: false, error: 'Unauthorized' };
    }

    //  2. Fetch contest
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    // 3. Fetch all teams with TeamScore sorted by ICPC rules
    const teamScores = await prisma.teamScore.findMany({
      include: {
        team: {
          include: {
            user: { select: { username: true } },
          },
        },
      },
      orderBy: [
        { solvedCount: 'desc' },
        { totalPenalty: 'asc' },
      ],
    });

    // 4. Map to ceremony format
    const results: TeamResult[] = teamScores.map((score, index) => {
      const members = Array.isArray(score.team.members)
        ? score.team.members
        : [];

      return {
        rank: index + 1,
        name: score.team.display_name,
        score: score.solvedCount,
        lab: score.team.category,
        members: members as string[],
      };
    });

    // 5. UOL Logo (Base64 SVG placeholder - minimal size)
    const uolLogo = `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="55" fill="#1e40af" stroke="#3b82f6" stroke-width="3"/>
        <text x="60" y="70" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">UOL</text>
      </svg>
    `).toString('base64')}`;

    // 6. Generate HTML
    const html = generateHTML(contest.name, results, uolLogo);

    // 7. Save to filesystem
    try {
      const publicDir = path.join(process.cwd(), 'public', 'exports');

      // Ensure directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const fileName = `ceremony_${contestId}.html`;
      const filePath = path.join(publicDir, fileName);

      fs.writeFileSync(filePath, html, 'utf-8');

      return {
        success: true,
        html,
        filePath: `/exports/${fileName}`,
      };
    } catch (fsError) {
      console.error('[CEREMONY] File save error:', fsError);
      // Return HTML even if file save fails
      return {
        success: true,
        html,
        error: 'Generated HTML but failed to save file',
      };
    }
  } catch (error) {
    console.error('[CEREMONY] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate ceremony',
    };
  }
}

// ============================================================
// HTML TEMPLATE GENERATOR
// ============================================================

function generateHTML(
  contestName: string,
  results: TeamResult[],
  logoDataUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UOLJudge - Award Ceremony</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      min-height: 100vh;
      overflow: hidden;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      text-align: center;
    }

    .logo {
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
    }

    h1 {
      font-size: 48px;
      font-weight: 800;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      font-size: 24px;
      color: #94a3b8;
      margin-bottom: 40px;
    }

    .instruction {
      font-size: 18px;
      color: #64748b;
      margin-bottom: 60px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      display: inline-block;
    }

    .results-list {
      max-width: 800px;
      margin: 0 auto;
    }

    .result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      margin-bottom: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s;
    }

    .result-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(59, 130, 246, 0.5);
    }

    .rank {
      font-size: 32px;
      font-weight: 800;
      color: #94a3b8;
      min-width: 60px;
    }

    .name {
      flex: 1;
      font-size: 24px;
      font-weight: 600;
      text-align: left;
     }

    .score {
      font-size: 28px;
      font-weight: 800;
      color: #10b981;
      min-width: 100px;
      text-align: right;
    }

    /* Podium Winners */
    .podium {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 30px;
      margin: 60px auto;
      max-width: 900px;
      perspective: 1000px;
    }

    .podium-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: podiumReveal 0.8s ease-out;
    }

    @keyframes podiumReveal {
      from {
        opacity: 0;
        transform: rotateX(-90deg) scale(0.8);
      }
      to {
        opacity: 1;
        transform: rotateX(0) scale(1);
      }
    }

    .medal {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      margin-bottom: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .gold .medal {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      box-shadow: 0 0 60px rgba(251, 191, 36, 0.6);
    }

    .silver .medal {
      background: linear-gradient(135deg, #e5e7eb, #9ca3af);
      box-shadow: 0 0 40px rgba(156, 163, 175, 0.5);
    }

    .bronze .medal {
      background: linear-gradient(135deg, #f97316, #ea580c);
      box-shadow: 0 0 40px rgba(249, 115, 22, 0.5);
    }

    .winner-name {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .winner-score {
      font-size: 36px;
      font-weight: 900;
      color: #10b981;
    }

    .place-2 { order: 1; }
    .place-1 { order: 2; }
    .place-3 { order: 3; }

    /* Confetti Animation */
    .confetti {
      position: fixed;
      width: 10px;
      height: 10px;
      background: #f59e0b;
      position: fixed;
      animation: confetti-fall 3s linear infinite;
    }

    @keyframes confetti-fall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }

    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${logoDataUrl}" alt="UOL Logo" class="logo">
    <h1>Award Ceremony</h1>
    <p class="subtitle">${contestName}</p>
    <p class="instruction" id="instruction">Press SPACEBAR to begin the reveal...</p>

    <!-- State 0: Full Results List -->
    <div id="state-0" class="results-list">
      ${results.slice(3).map(r => `
        <div class="result-item">
          <span class="rank">#${r.rank}</span>
          <span class="name">${r.name}</span>
          <span class="score">${r.score}</span>
        </div>
      `).join('')}
    </div>

    <!-- State 1-3: Podium -->
    <div id="podium" class="podium hidden">
      ${results.slice(0, 3).map((r, i) => {
    const place = i + 1;
    const medals = ['🥇', '🥈', '🥉'];
    const classes = ['gold', 'silver', 'bronze'];
    return `
          <div class="podium-item place-${place} ${classes[i]}" id="place-${place}">
            <div class="medal">${medals[i]}</div>
            <div class="winner-name">${r.name}</div>
            <div class="winner-score">${r.score}</div>
          </div>
        `;
  }).join('')}
    </div>
  </div>

  <script>
    const RESULTS = ${JSON.stringify(results)};
    let state = 0;

    const elements = {
      instruction: document.getElementById('instruction'),
      state0: document.getElementById('state-0'),
      podium: document.getElementById('podium'),
      place1: document.getElementById('place-1'),
      place2: document.getElementById('place-2'),
      place3: document.getElementById('place-3'),
    };

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        state++;
        updateDisplay();
      }
    });

    function updateDisplay() {
      if (state === 1) {
        // Show podium, hide list
        elements.state0.classList.add('hidden');
        elements.podium.classList.remove('hidden');
        elements.instruction.textContent = 'Press SPACEBAR to reveal Bronze...';
        
        // Hide all winners initially
        elements.place1.style.opacity = '0';
        elements.place2.style.opacity = '0';
        elements.place3.style.opacity = '0';
      }
      else if (state === 2) {
        // Reveal Bronze (3rd place)
        elements.place3.style.opacity = '1';
        elements.instruction.textContent = 'Press SPACEBAR to reveal Silver...';
      }
      else if (state === 3) {
        // Reveal Silver (2nd place)
        elements.place2.style.opacity = '1';
        elements.instruction.textContent = 'Press SPACEBAR to reveal Gold...';
      }
      else if (state === 4) {
        // Reveal Gold (1st place) + Confetti
        elements.place1.style.opacity = '1';
        elements.instruction.textContent = '🎉 Congratulations to all winners! 🎉';
        launchConfetti();
      }
    }

    function launchConfetti() {
      const colors = ['#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
      for (let i = 0; i < 100; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.className = 'confetti';
          confetti.style.left = Math.random() * 100 + 'vw';
          confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.animationDelay = Math.random() * 3 + 's';
          confetti.style.animationDuration = 2 + Math.random() * 3 + 's';
          document.body.appendChild(confetti);
          
          setTimeout(() => confetti.remove(), 6000);
        }, i * 30);
      }
    }
  </script>
</body>
</html>`;
}
