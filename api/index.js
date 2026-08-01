const handleRequest = require('../server');

module.exports = async (req, res) => {
  if (req.headers && req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  }
  return handleRequest(req, res);
};
