/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
//var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movie');
//db = require('./db')();

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }
            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, function(req, res) {
        Movie.find(function (err, movie) {
            if (err) res.json(err.message);
            res.json(movie);
        })
    })
    .post(authJwtController.isAuthenticated, function(req, res){
        var movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;

        // save the movie
        movie.save(function (err) {
            if (err) {
                if (err.code == 11000)
                    return res.json({success: false, message: 'Movie already exists.'});
                else
                    return res.json(err);
            }
            res.send({success: true, message: 'Movie saved'});
        })
    })
    .put(authJwtController.isAuthenticated, function(req, res){
        Movie.findOneAndUpdate({title: req.body.title}, {releaseYear: req.body.releaseYear}).exec(function (err) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "Movie Updated"})
        });
    })
    .delete(authJwtController.isAuthenticated, function(req, res){
        Movie.findOneAndDelete( {title: req.body.title}).exec(function (err) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "Movie Deleted"})
        });
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


