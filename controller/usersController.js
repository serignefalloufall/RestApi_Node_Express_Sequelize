//==========IMPORTATION DES MODULE==========//
var bcrypt = require('bcrypt');
var jwtSecurite = require('../securite/jwt.securite');
const db = require('../models');
const User = db.User;
const QueryTypes = require('sequelize').QueryTypes; //pour ecrire des requet natif
var asyncLib = require('async');


// Constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,8}$/;


//==========Definition des routes==========//
module.exports = {

    //cette function pemet d'enregistrer un user apres verification
    register: function(req, res) {

        // Params
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var bio = req.body.bio;

        if (email == null || username == null || password == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        if (username.length <= 13 || username.length >= 4) {
            return res.status(400).json({ 'error': 'wrong username (must be length 5 - 12)' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ 'error': 'email is not valid' });
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ 'error': 'password invalid (must length 4 - 8 and include 1 number at least)' });
        }

        asyncLib.waterfall([
            function(done) {
                User.findOne({
                        attributes: ['email'],
                        where: { email: email }
                    })
                    .then(function(userFound) {
                        done(null, userFound);
                    })
                    .catch(function(err) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function(userFound, done) {
                if (!userFound) {
                    bcrypt.hash(password, 5, function(err, bcryptedPassword) {
                        done(null, userFound, bcryptedPassword);
                    });
                } else {
                    return res.status(409).json({ 'error': 'user already exist' });
                }
            },
            function(userFound, bcryptedPassword, done) {
                var newUser = User.create({
                        email: email,
                        username: username,
                        password: bcryptedPassword,
                        bio: bio,
                        isAdmin: 0
                    })
                    .then(function(newUser) {
                        done(newUser);
                    })
                    .catch(function(err) {
                        return res.status(500).json({ 'error': 'cannot add user' });
                    });
            }
        ], function(newUser) {
            if (newUser) {
                return res.status(201).json({
                    'userId': newUser.id
                });
            } else {
                return res.status(500).json({ 'error': 'cannot add user' });
            }
        });
    },

    //Cette fonction permet de gerer la connexion
    login: function(req, res) {

        // Params
        var email = req.body.email;
        var password = req.body.password;

        if (email == null || password == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }
        //async.waterfall permet à chaque fonction de transmettre ses résultats à la fonction suivante,
        asyncLib.waterfall([
            function(done) {
                User.findOne({
                        where: { email: email }
                    })
                    .then(function(userFound) {
                        done(null, userFound);
                    })
                    .catch(function(err) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function(userFound, done) {
                if (userFound) {
                    bcrypt.compare(password, userFound.password, function(errBycrypt, resBycrypt) {
                        done(null, userFound, resBycrypt);
                    });
                } else {
                    return res.status(404).json({ 'error': 'user not exist in DB' });
                }
            },
            function(userFound, resBycrypt, done) {
                if (resBycrypt) {
                    done(userFound);
                } else {
                    return res.status(403).json({ 'error': 'invalid password' });
                }
            }
        ], function(userFound) {
            if (userFound) {
                return res.status(201).json({
                    'userId': userFound.id,
                    'token': jwtSecurite.generateTokenForUser(userFound)
                });
            } else {
                return res.status(500).json({ 'error': 'cannot log on user' });
            }
        });
    },



    //GET USER PROFIL
    getUserProfile: function(req, res) {
        // On recuper l'entet d'autorisation de notre req
        var headerAuth = req.headers['authorization'];
        var userId = jwtSecurite.getUserId(headerAuth);

        if (userId < 0) //pour dir que le token est invalide
            return res.status(400).json({ 'error': 'wrong token' });

        User.findOne({
            attributes: ['id', 'email', 'username', 'bio'],
            where: { id: userId }
        }).then(function(user) {
            if (user) {
                res.status(201).json(user);
            } else {
                res.status(404).json({ 'error': 'user not found' });
            }
        }).catch(function(err) {
            res.status(500).json({ 'error': 'cannot fetch user' });
        });
    },


    //UPDATE PROFILE
    updateUserProfile: function(req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtSecurite.getUserId(headerAuth);

        // Params
        var newbio = req.body.bio;

        asyncLib.waterfall([
            function(done) {
                User.findOne({
                        attributes: ['id', 'bio'],
                        where: { id: userId }
                    }).then(function(userFound) {
                        done(null, userFound);
                    })
                    .catch(function(err) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function(userFound, done) {
                if (userFound) {
                    userFound.update({
                        bio: (newbio ? newbio : userFound.bio)
                    }).then(function() {
                        done(userFound);
                    }).catch(function(err) {
                        res.status(500).json({ 'error': 'cannot update user' });
                    });
                } else {
                    res.status(404).json({ 'error': 'user not found' });
                }
            },
        ], function(userFound) {
            if (userFound) {
                return res.status(201).json(userFound);
            } else {
                return res.status(500).json({ 'error': 'cannot update user profile' });
            }
        });
    }

}