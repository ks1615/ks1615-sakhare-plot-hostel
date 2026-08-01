const handleRequest = require('../server');

module.exports = async (req, res) => {
  if (req.query && req.query.path) {
    const pathArr = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
    req.url = '/api/' + pathArr.join('/');
  } else if (req.headers && req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  }
  return handleRequest(req, res);
};
