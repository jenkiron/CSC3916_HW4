var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let MovieSchema = new Schema( {
    Title: {type: String, required: true, index: {unique: true, dropDups: true}},
    Year: {type: Number, required: true},
    Genre: {type: String, required: true, enum: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"]},
    Actors: {type: Array, required: true, items: {actorName: String, characterName: String}, minItems: 3}
});

MovieSchema.pre('save', function(next){
    var movie = this;

    if(movie.Year<1900 || movie.Year>2021){
        return next({code: 400, message: "Year must be between 1900-2021."});
    }
    if(movie.Genre.isEmpty()){
        return next({code: 400, message: "Provide a Genre."});
    }

    next();
});

//return the model to the server
module.exports = mongoose.model('Movie', MovieSchema);