const { v4: uuidv4 } = require('uuid');

function requestIdMiddleware(req, res, next) {
  const incomingRequestId = req.headers['x-request-id'];
  const requestId = incomingRequestId && String(incomingRequestId).trim()
    ? String(incomingRequestId).trim()
    : uuidv4();

  req.id = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}

module.exports = {
  requestIdMiddleware,
};
