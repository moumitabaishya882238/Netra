const crypto = require('crypto');

/**
 * Generates a unique registration ID for hospitals
 * Format: NT-<RANDOM-5-CHARS>
 */
const generateRegistrationId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I
    let result = 'NT-';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = { generateRegistrationId };
