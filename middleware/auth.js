const config = require('config');
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('auth-token');
    jwt.verify(token, config.get('jwtKey'), function (err, decoded) {
        if (err) res.status(401).json({ msg: "Unauthorized" });
        req.user = decoded.user
    });

    next();
}