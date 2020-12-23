//==========IMPORTATION DES MODULE==========//
var jwt = require('jsonwebtoken');

const JWT_SIGN_SECRET = 's2ftoken';
module.exports = {
    generateTokenForUser: function(userData) {
        return jwt.sign({
            userId: userData.id,
            isAdmin: userData.isAdmin

        }, JWT_SIGN_SECRET, {
            expiresIn: '1h'
        })
    },

    parseAuthorization: function(authorization) {
        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
        //Si la chaine d'autorisation not null on remplace Bearr par chaine vide
    },

    getUserId: function(authorization) {
        var userId = -1; //par defaut ca n'exist pas c juste pour ne pas faire des requet sur kelk chose qui n'existe psas
        var token = module.exports.parseAuthorization(authorization);
        if (token != null) {
            try {
                var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
                if (jwtToken != null)
                    userId = jwtToken.userId;
            } catch (err) {}
        }
        return userId;
    }
}