import http from 'http';

// Configuration
const CONCURRENT_USERS = 50;
const BATCH_SIZE = 10;
const TARGET_URL = 'http://localhost:3000/api/submit'; // Adjust if needed
const DUMMY_FILE_CONTENT = 'print("Hello World")';

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

console.log(`${colors.cyan}🚀 Starting Chaos Test: The "Runbook" Stress Test${colors.reset}`);
console.log(`Target: ${TARGET_URL}`);
console.log(`Users: ${CONCURRENT_USERS}`);
console.log(`Batch Size: ${BATCH_SIZE}`);

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

interface SimulationResult {
    userId: number;
    statusCode: number;
    success: boolean;
    error?: string;
}

async function simulateSubmission(userId: number): Promise<SimulationResult> {
    return new Promise((resolve) => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const postData = 
`--${boundary}\r
Content-Disposition: form-data; name="file"; filename="solution.py"\r
Content-Type: text/x-python\r
\r
${DUMMY_FILE_CONTENT}\r
--${boundary}\r
Content-Disposition: form-data; name="problemId"\r
\r
problem_1\r
--${boundary}\r
Content-Disposition: form-data; name="contestId"\r
\r
contest_1\r
--${boundary}--`;

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/submit',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    userId,
                    statusCode: res.statusCode || 0,
                    success: (res.statusCode || 0) < 500
                });
            });
        });

        req.on('error', (e) => {
            resolve({
                userId,
                statusCode: 0,
                error: e.message,
                success: false
            });
        });

        req.write(postData);
        req.end();
    });
}

async function runChaos() {
    let successCount = 0;
    let failureCount = 0;
    let crashCount = 0;

    const batches = Math.ceil(CONCURRENT_USERS / BATCH_SIZE);

    for (let i = 0; i < batches; i++) {
        const batchPromises: Promise<SimulationResult>[] = [];
        const startUser = i * BATCH_SIZE;
        const endUser = Math.min(startUser + BATCH_SIZE, CONCURRENT_USERS);

        console.log(`${colors.yellow}⚡ Firing batch ${i + 1}/${batches} (Users ${startUser + 1}-${endUser})...${colors.reset}`);

        for (let j = startUser; j < endUser; j++) {
            batchPromises.push(simulateSubmission(j));
        }

        const results = await Promise.all(batchPromises);

        results.forEach(r => {
            if (r.success) {
                successCount++;
            } else {
                failureCount++;
                if (r.statusCode >= 500 || r.statusCode === 0) {
                    crashCount++;
                    console.error(`${colors.red}❌ CRITICAL: Server error or crash for User ${r.userId}: ${r.error || r.statusCode}${colors.reset}`);
                }
            }
        });

        await sleep(100);
    }

    console.log('\n' + '='.repeat(40));
    console.log(`${colors.cyan}📊 CHAOS TEST RESULTS${colors.reset}`);
    console.log('='.repeat(40));
    console.log(`Total Requests: ${CONCURRENT_USERS}`);
    console.log(`Successful Responses (Stability): ${colors.green}${successCount}${colors.reset}`);
    console.log(`Failed Requests: ${failureCount > 0 ? colors.red : colors.green}${failureCount}${colors.reset}`);
    
    if (crashCount > 0) {
        console.log(`${colors.red}💀 SYSTEM FAILURE: ${crashCount} requests caused crashes or connection errors.${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}✅ SYSTEM STABLE: No crashes detected.${colors.reset}`);
        process.exit(0);
    }
}

runChaos();
