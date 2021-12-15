const {
    MongoClient,
    ObjectId
} = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 1337;
const cors = require('cors');

require('dotenv').config()
const client = new MongoClient(process.env.FINAL_URL);
const dbName = "Course_project";
const fs = require('fs/promises');




console.log(process.env.PORT);
app.use(cors());

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

//Save a movie to the database
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

//Delete a movie from the database
app.delete('/movies/:id', async (req, res) => {
    try {
        await client.connect();

        const collection = client.db('Course_project').collection('Movies');

        const query = {
            _id: ObjectId(req.params.id)
        };

        await collection.deleteOne(query)
        res.status(200).json({
            succes: 'Succesfully deleted!',
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        })
    }
})

//Update a movie to the database
app.put('/movies/:id', async (req, res) => {
    if (!req.body._id || !req.body.movieid || !req.body.name || !req.body.director || !req.body.year || !req.body.genres || !req.body.description) {
        res.status(400).send("Bad request, missing: id, name, points, course or session!");
        return;
    }

    try {

        await client.connect();

        const collection = client.db('Course_project').collection('Movies');
        const query = {
            _id: ObjectId(req.params.id)
        };

        let update = {
            $set: {
                name: req.body.name,
                director: req.body.director,
                year: req.body.year,
                genres: req.body.genres,
                description: req.body.description,
            }
        };

        const updateChallenge = await collection.updateOne(query, update)
        if (updateChallenge) {
            res.status(201).send({
                succes: `Challenge with id "${req.body._id}" is succesfully updated!.`,
            });
            return;
        } else {
            res.status(400).send({
                error: `Challenge with id "${req.body._id}" could not been found!.`,
                value: error,
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Movie API listening at http://localhost:${process.env.PORT}`)
});