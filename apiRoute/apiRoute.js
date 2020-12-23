//==========IMPORTATION DES MODULE==========//
var express = require('express');
const usersController = require('../controller/usersController');
const messageController = require('../controller/messageController');




//==========Router==========//
exports.router = (function() {

    var apiRouter = express.Router();

    //Users routes
    apiRouter.route('/users/register').post(usersController.register);
    apiRouter.route('/users/login').post(usersController.login);
    apiRouter.route('/users/me/').get(usersController.getUserProfile);
    apiRouter.route('/users/me/').put(usersController.updateUserProfile);

    // Messages routes
    apiRouter.route('/messages/new/').post(messageController.createMessage);
    apiRouter.route('/messages/').get(messageController.listeMessage);

    return apiRouter;

})();