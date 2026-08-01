const express = require('express');
const cors = require('cors');
const handleRequest = require('../server');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Forward all /api requests to server handler
app.all('*', (req, res) => {
  return handleRequest(req, res);
});

module.exports = app;
