const jwt = require('jsonwebtoken');
const ErrorHandler = require('./Structs/error');
const secretKey = 'e1a3d5f6a4c9b6e3f8d1e2b3c7f0a5e7d9f2c1b8a3d6f7e5a4c9b1e8d3f2a1c4b7e9f6d3a1e5c8b7f2d1c3b9a4f6e3d5b8c1a7e2f4d9c3b1e5f7a8d2e1c4b9f3d7';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return ErrorHandler.createError("random", "com.fortress.invalid.authorization.code", "We couldn't find your authorization token. We're sorry about that. Please try again later.", res);
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
        return ErrorHandler.createError("random", "com.fortress.invalid.authorization.code", "Authorization failed", res);
    }

    // If everything is good, save the decoded token to request for use in other routes
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  });
};

module.exports = {verifyToken,secretKey};