//==========IMPORTATION DES MODULE==========//
var bcrypt = require('bcrypt');
var jwtSecurite = require('../securite/jwt.securite');
const db = require('../models');
const User = db.User;
const { QueryTypes } = require('sequelize');

// Constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,8}$/;


//==========Definition des routes==========//
module.exports = {

    //cette function pemet d'enregistrer un user apres verification
    register: function(req, res) {

        //Recuperation des parm envoye dans la requette
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var bio = req.body.bio;

        if (email == null || username == null || password == null) {
            return res.status(400).json({ 'Error': 'Missing param' });
        }
        //Verification
        if (username.length >= 13 || username.length <= 4) {

            return res.status(400).json({ 'Error': 'Missing param' });

        }
        //Verification email
        if (!EMAIL_REGEX.test(email)) {

            return res.status(400).json({ 'Error': 'Email invalid' });

        }
        //Verification password
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ 'Error': 'Password invalid (must lenght 4 - 8 and includ 1 number at last)' });

        }
        User.findOne({
                attributes: ['email'],
                where: {
                    email: email
                } //on stock le resultat de la requette dans userFound
            }).then(function(userFound) {
                if (!userFound) {
                    bcrypt.hash(password, 5, function(err, bcryptPassword) {
                        var newUser = User.create({
                                email: email,
                                username: username,
                                password: bcryptPassword,
                                bio: bio,
                                isAdmin: 0

                            })
                            .then(function(newUser) {
                                return res.status(201).json({
                                    'userId': newUser.id
                                })
                            })
                            .catch(function(err) {
                                return res.status(500).json({ 'error': 'cannot add user' });
                            })



                    })
                } else {

                    return res.status(409).json({ 'Error': 'User exist' });

                }
            })
            .catch(function(err) {
                return res.status(500).json({ 'Error': 'unable to verify user' });
            })
    },
    login: function(req, res) { //Debut function login

            //Recuperation des parm envoye dans la requette
            var email = req.body.email;
            var password = req.body.password;

            if (email == null || password == null) {
                return res.status(400).json({ 'error': 'missing params' })
            }
            db.User.findOne({
                    where: {
                        email: email
                    }
                })
                .then(function(userFound) {
                    if (userFound) { //If userexist
                        bcrypt.compare(password, userFound.password, function(errBycrypt, resBycrypt) {
                            if (resBycrypt) {

                                return res.status(200).json({
                                    'userId': userFound.id,
                                    'token': jwtSecurite.generateTokenForUser(userFound)

                                });

                            } else {
                                res.status(403).json({
                                    'error': 'Invalid password'
                                });
                            }

                        });
                    } //Fin If userexist
                    else {

                        return res.status(400).json({ 'error': 'user note exist in db' })

                    }

                })
                .catch(function(err) {

                    return res.status(500).json({ 'error': 'enabl to verif user' })

                });

        } //Fin function login

}