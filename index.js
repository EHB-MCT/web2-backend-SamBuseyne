const {
    MongoClient,
} = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 1337;
// const cors = require('cors');

require('dotenv').config()
const client = new MongoClient(process.env.FINAL_URL);

const dbName = "Course_project";

const fs = require('fs/promises');


// app.use(cors());

console.log(process.env.PORT);


//which services are used (middleware)
app.use(express.static('public'));
app.use(bodyParser.json());


//Root route (documentation)
app.get('/', (req, res) => {
    console.log("API root route called.")
    res.status(300).redirect('/info.html')
});

//Return all movies from the database
app.get('/movies', async (req, res) => {
    try {
        //Connect to db
        await client.connect()

        //retrieve the movie collection data
        const colli = client.db('Course_project').collection('Movies')
        const movies = await colli.find({}).toArray();

        //Send back the data with response
        res.status(200).send(movies);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        })

    } finally {
        await client.close()
    }
    console.log("API movies route called.")
});

//Return one movie from the file based on ID
app.get('/movie', async (req, res) => {
    //id is located in the query: req.query.id

    try {
        //Connect to db
        await client.connect()

        //retrieve the movie collection data
        const colli = client.db('Course_project').collection('Movies')

        //only look for a movie with this ID
        const query = {
            movieid: req.query.id
        };

        const movies = await colli.findOne(query);

        if (movies) {
            //Send back the file
            res.status(200).send(movies);
            //succes status
            return;
        } else {
            res.status(400).send('Movie could not be found with id:' + req.query.id);
            //user mistake status
        }

    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        })
    } finally {
        await client.close();
    }
    console.log("API movie route called.")
});

//Save a movie to the file
app.post('/save', async (req, res) => {
    //Validation if params are missing

    if (!req.body._id || !req.body.name || !req.body.director || !req.body.year || !req.body.genres || !req.body.description) {
        console.log(req.body)
        res.status(400).send('Bad request: missing id, name, director, year, genres or description');
        return;
    }

    try {
        //Connect to db
        await client.connect()

        //retrieve the movie collection data
        const colli = client.db('Course_project').collection('Movies')

        //Validation for double movies
        const movie = await colli.findOne({
            movieid: req.body.movieid
        });
        if (movie) {
            res.status(400).send('Bad request: movie already exists with movieid' + req.body._id)
            return;
        }

        //Create the new movie object
        let newMovie = ({
            movieid: req.body.movieid,
            name: req.body.name,
            director: req.body.director,
            year: req.body.year,
            genres: req.body.genres,
            description: req.body.description
        });

        //Insert into the database
        let insertResult = await colli.insertOne(newMovie);

        //Send back succesmessage
        res.status(201).send(`Movie succesfully added with id:${req.body.movieid}`)
        return;

    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        })
    } finally {
        await client.close();
    }
    console.log("API save a movie route called.")
});

app.listen(port, () => {
    console.log(`Movie API listening at http://localhost:${process.env.PORT}`)
});