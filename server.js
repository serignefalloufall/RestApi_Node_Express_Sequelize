//==========IMPORTATION DES MODULE==========//
var express = require('express');
var bodyParser = require('body-parser');
var apiRouter = require('./apiRoute/apiRoute').router;


//==========Instantiation du server==========//
var server = express();


//==========Configuration du body==========//

//bodyParser nous permet de recuperer les argument fournit dans le body d'une requette http

server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(bodyParser.json());


//==========Configuration des routes==========/ /

server.get('/', function(req, res) {

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>Bienvenu dans mon server<h1/>')

});

server.use('/api/', apiRouter)

//==========Demarer server==========//
server.listen(4545, function() {

    console.log('Server en ecoute :)');
});