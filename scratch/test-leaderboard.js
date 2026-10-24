const assert = require('assert');

// Test formatDuration
function formatDuration(sec) {
    if (!sec || sec <= 0) return '–';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

assert.strictEqual(formatDuration(0), '–');
assert.strictEqual(formatDuration(null), '–');
assert.strictEqual(formatDuration(45), '45s');
assert.strictEqual(formatDuration(80), '1m 20s');
assert.strictEqual(formatDuration(125), '2m 5s');
console.log('✓ formatDuration passed all tests.');

// Test sorting comparator
function sortUsers(users, sortBy) {
    const enrichedUsers = users.map(u => {
        const history = Array.isArray(u.history) ? u.history : [];
        const totalLevels = history.length;
        const zeroErrors = history.filter(h => (h.errors || 0) === 0).length;
        const accuracy = totalLevels === 0 ? 0 : Math.round((zeroErrors / totalLevels) * 100);
        const totalQuizCorrect = history.reduce((sum, h) => sum + (h.quizCorrect || 0), 0);
        const totalQuizCount   = history.reduce((sum, h) => sum + (h.quizTotal   || 0), 0);
        const totalDuration    = history.reduce((sum, h) => sum + (h.duration    || 0), 0);

        return {
            ...u,
            totalLevels,
            accuracy,
            totalQuizCorrect,
            totalQuizCount,
            totalDuration
        };
    });

    enrichedUsers.sort((a, b) => {
        const aActive = a.totalLevels > 0;
        const bActive = b.totalLevels > 0;
        if (aActive !== bActive) {
            return aActive ? -1 : 1;
        }

        if (sortBy === 'quiz') {
            if (b.totalQuizCorrect !== a.totalQuizCorrect) {
                return b.totalQuizCorrect - a.totalQuizCorrect;
            }
            if (b.accuracy !== a.accuracy) {
                return b.accuracy - a.accuracy;
            }
        } else {
            if (b.accuracy !== a.accuracy) {
                return b.accuracy - a.accuracy;
            }
            if (b.totalQuizCorrect !== a.totalQuizCorrect) {
                return b.totalQuizCorrect - a.totalQuizCorrect;
            }
        }

        if (a.totalDuration !== b.totalDuration) {
            return a.totalDuration - b.totalDuration;
        }

        return (b.money || 0) - (a.money || 0);
    });

    return enrichedUsers;
}

const mockUsers = [
    {
        name: 'User A',
        history: [
            { level: 1, errors: 0, quizCorrect: 5, quizTotal: 5, duration: 60 },
            { level: 2, errors: 0, quizCorrect: 5, quizTotal: 5, duration: 60 }
        ] // 100% acc, 10 quiz, 120s
    },
    {
        name: 'User B',
        history: [
            { level: 1, errors: 0, quizCorrect: 5, quizTotal: 5, duration: 40 },
            { level: 2, errors: 0, quizCorrect: 5, quizTotal: 5, duration: 45 }
        ] // 100% acc, 10 quiz, 85s (faster than A!)
    },
    {
        name: 'User C',
        history: [
            { level: 1, errors: 0, quizCorrect: 8, quizTotal: 8, duration: 30 },
            { level: 2, errors: 1, quizCorrect: 7, quizTotal: 7, duration: 30 }
        ] // 50% acc (1 of 2 zero error), 15 quiz, 60s (more quizzes!)
    },
    {
        name: 'User Inactive',
        history: [] // 0 levels
    }
];

// Test sort by Accuracy
const sortedByAcc = sortUsers(mockUsers, 'accuracy');
assert.strictEqual(sortedByAcc[0].name, 'User B', 'User B should be rank 1 (100% acc, 85s)');
assert.strictEqual(sortedByAcc[1].name, 'User A', 'User A should be rank 2 (100% acc, 120s)');
assert.strictEqual(sortedByAcc[2].name, 'User C', 'User C should be rank 3 (50% acc)');
assert.strictEqual(sortedByAcc[3].name, 'User Inactive', 'Inactive user should be rank 4');
console.log('✓ Sort by Accuracy with tie-breaker duration passed successfully!');

// Test sort by Quiz
const sortedByQuiz = sortUsers(mockUsers, 'quiz');
assert.strictEqual(sortedByQuiz[0].name, 'User C', 'User C should be rank 1 (15 quizzes)');
assert.strictEqual(sortedByQuiz[1].name, 'User B', 'User B should be rank 2 (10 quizzes, faster 85s)');
assert.strictEqual(sortedByQuiz[2].name, 'User A', 'User A should be rank 3 (10 quizzes, 120s)');
assert.strictEqual(sortedByQuiz[3].name, 'User Inactive', 'Inactive user should be rank 4');
console.log('✓ Sort by Quiz with tie-breaker duration passed successfully!');

