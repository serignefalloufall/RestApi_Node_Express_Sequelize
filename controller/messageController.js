//==========IMPORTATION DES MODULE==========//
const db = require('../models');
const Message = db.Message;
const User = db.User;

var asyncLib = require('async');
var jwtSecurite = require('../securite/jwt.securite');




//==========CONSTANTS==========//
const TITLE_LIMIT = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT = 50;





//==========ROUTE==========//
module.exports = {

    createMessage: function(req, res) { //debut func create message

        // On recuper l'entet d'autorisation de notre req
        var headerAuth = req.headers['authorization'];
        var userId = jwtSecurite.getUserId(headerAuth);

        // Recuperation des params
        var title = req.body.title;
        var content = req.body.content;

        if (title == null || content == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
            return res.status(400).json({ 'error': 'Invalid parameter' });
        }

        asyncLib.waterfall([ //Debut waterfall

            function(done) {

                User.findOne({
                        where: { id: userId }
                    })
                    .then(function(userFound) {
                        done(null, userFound);
                    })
                    .catch(function(error) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function(userFound, done) {
                if (userFound) {
                    Message.create({
                            title: title,
                            content: content,
                            likes: 0,
                            userId: userFound.id //il faut forcement mettre le UserId comme ca
                        })
                        .than(function(newMessage) {
                            done(newMessage);
                        });
                } else {

                    res.status(400).json({ 'error': 'user not found' });
                }
            },
        ], function(newMessage) {
            if (newMessage) {

                return res.status(201).json(newMessage);

            } else {

                return res.status(404).json('Error', 'Cannot post message');

            }
        }); //Fin waterfall


    }, //fin create

    listeMessage: function(req, res) { //debut func liste message

        var fields = req.query.fields; //selectioner les clonne qu'on v afficher
        var limit = parseInt(req.query.limit); //recup les message par segment
        var offset = parseInt(req.query.offset); //recup les message par segment
        var order = req.query.order; //recup les message par orde

        if (limit > ITEMS_LIMIT) {
            limit = ITEMS_LIMIT;
        }

        Message.findAll({
            order: [(order != null) ? order.split(':') : ['title', 'ASC']],
            attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
            limit: (!isNaN(limit)) ? limit : null,
            offset: (!isNaN(offset)) ? offset : null,
            include: [{
                model: User,
                attributes: ['username']
            }]
        }).then(function(messages) {
            if (messages) {
                res.status(200).json(messages);
            } else {
                res.status(404).json({ "error": "no messages found" });
            }
        }).catch(function(err) {
            console.log(err);
            res.status(500).json({ "error": "invalid fields" });
        });
    }, //fin liste
}