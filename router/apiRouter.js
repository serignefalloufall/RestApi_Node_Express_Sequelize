//==========IMPORTATION DES MODULE==========//
var express = require('express');
const usersController = require('../controller/usersController');



//==========Router==========//
exports.router = (function() {

    var apiRouter = express.Router();

    //Users routes
    apiRouter.route('/users/register').post(usersController.register);
    apiRouter.route('/users/login').post(usersController.login);

    return apiRouter;

})();