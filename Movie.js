var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose1.Promise = global.Promise;

//mongoose.connect(process.env.DB, { useNewUrlParser: true });
try {
    mongoose1.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose1.set('useCreateIndex', true);


let MovieSchema = new Schema( {
    title: {type: String, required: true, index: {unique: true, dropDups: true}},
    year: {type: Number, required: true},
    genre: {type: String, required: true, enum: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"]},
    actors: {type: Array, required: true, items: {actorName: String, characterName: String}, minItems: 3}
});

MovieSchema.pre('save', function(next){
    var movie = this;

    if(movie.year<1900 || movie.year>2021){
        return next({code: 400, message: "Year must be between 1900-2021."});
    }
    if(movie.genre.isEmpty()){
        return next({code: 400, message: "Provide a Genre."});
    }

    next();
});

//return the model to the server
module.exports = mongoose.model('Movie', MovieSchema);