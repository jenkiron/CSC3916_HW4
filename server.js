/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
//var authController = require('./auth');
//db = require('./db')();
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movie');
var Reviews = require('./Reviews');
var userName;

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
                userName = userNew.username;
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.get('/', function (req, res) {
    res.send('Hi')
})

router.route('/movies')
    .get(authJwtController.isAuthenticated, function(req, res) {
        Movie.find(function (err, movie) {
            if (err) res.json(err.message);
            res.json(movie);
        })
    })
    .post(authJwtController.isAuthenticated, function(req, res) {
        var movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;

        if(movie.actors.length < 3 || movie.title == null || movie.year > 2021 || movie.year < 1900)
            return res.json({success: false, message: 'Please enter valid options.'});
        else {
            movie.save(function (err) {
                if (err) {
                    if (err.code == 11000)
                        return res.json({success: false, message: 'Movie already exists.'});
                    else
                        return res.json(err);
                }
                res.json({success: true, message: 'Created Movie.'});
            });
        }
    })
    .put(authJwtController.isAuthenticated, function(req, res){
        Movie.findOneAndUpdate({title: req.body.title}, {year: req.body.year}).exec(function (err) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "Movie year updated."})
        });
    })
    .delete(authJwtController.isAuthenticated, function(req, res){
        Movie.remove( {title: req.body.title}).exec(function (err) {
            if (err)
                return res.json(err);
            else
                res.json( {status: 200, message: "Movie Deleted"});
        });
    });

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {

        Movie.findOne({title: req.body.movieName}).exec(function(err, movie) {
            if (err)
                return res.json(err);
            if (!movie)
                return res.json({success: false, message: 'No movie exists by that name.'});

            var Review = new Reviews({reviewer: userName,
                quote: req.body.quote,
                rating: req.body.rating,
                movieName: req.body.movieName});

            Review.save(function (err, review) {
                if (err) {
                    return res.send(err);
                }else
                    res.json({success: true, message: 'Review Added Successfully', review: review});
            });
        });//Movie.findOne
    })//post review
    .get(function (req, res) {
       if(req.body.reviews === true) {
           Movie.aggregate([
               {
                   $lookup: {
                       from: 'reviews',
                       localField: 'title',
                       foreignField: 'movieName',
                       as: 'Movie-Reviews'
                   }
               },
               {
                   $match: {
                       "movieName": req.body.title,
                   }
               }
           ]).exec(function (err, movie) {
               if (err)
                   res.send(err);
               if(!movie)
                   res.json({message: 'Failed to find anything you specified.', success: 'Failed'})

               res.json({message: 'hello', movie:movie});
           });
       }else{

       }
    })//get


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


