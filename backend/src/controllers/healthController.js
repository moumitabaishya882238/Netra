const express = require('express');

const getHealth = (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: 'connected', // Simplification for now, will check actual status later
    });
};

module.exports = { getHealth };
