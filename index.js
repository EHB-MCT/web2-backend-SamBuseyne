const bcrypt = require('bcryptjs');
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

// Return one movie from the file based on ID
app.get('/movie', async (req, res) => {
    //id is located in the query: req.query.id

    try {
        //Connect to db
        await client.connect()

        //retrieve the movie collection data
        const colli = client.db('Course_project').collection('Movies')

        //only look for a movie with this ID
        const query = {
            movieid: req.query.movieid
        };

        const movies = await colli.findOne(query);

        if (movies) {
            //Send back the file
            res.status(200).send(movies);
            //succes status
            return;
        } else {
            res.status(400).send('Movie could not be found with id:' + req.params.id);
            //user mistake status
        }

    } catch (error) {
        // console.log(error)
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


//Favourite routes

//add favourite movie route
app.post('/favourite', async (req, res) => {
    if (!req.body.email || !req.body.movieid) {
        res.status(400).send('Bad request: missing email or movieid');
        console.log(error);
        return;
    }

    try {
        await client.connect();
        const colli = client.db('Course_project').collection('Favourites');

        const checkFavourites = await colli.findOne({
            email: req.body.email,
            movieid: req.body.movieid
        });

        if (checkFavourites) {
            res.status(400).send('Bad request: movie is already added to favourites with id:' + req.body.movieid);
            return;
        };

        let fMovie = {
            movieid: req.body.movieid,
            email: req.body.email,
            favourite: true,
        };

        await colli.insertOne(fMovie);


        const query = {
            email: req.query.email,
            movieid: req.query.movie
        };

        const movie = await colli.find(query).toArray();
        res.status(200).send(movie);

    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });

    } finally {
        await client.close();
    }
});

//Get all favourite movies of user
app.get('/favourites', async (req, res) => {
    try {
        await client.connect();
        const colli = client.db('Course_project').collection('Favourites');
        const favouriteMovies = await colli.find({}).toArray();
        res.status(200).send(favouriteMovies);

    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });

    } finally {
        await client.close();
    }
});

//Delete a favourite from the database
app.delete('/favourite', async (req, res) => {
    if (!req.params.movieid || !req.params.email) {
        res.status(400).send('Bad request: missing id or email');
        return;
    }
    try {
        await client.connect();

        const collection = client.db('Course_project').collection('Favourites');

        const query = {
            movieid: req.query.movieid,
            email: req.query.email
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




//User routes

//Get all users

app.get('/users', async (req, res) => {
    try {
        await client.connect();
        const colli = client.db('Course_project').collection('Users');
        const allUsers = await colli.find({}).toArray();
        res.status(200).send(allUsers);

    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });

    } finally {
        await client.close();
    }
});

//Register route
app.post('/register', async (req, res) => {
    try {
        if (!req.body.email || !req.body.password || !req.body.name) {
            res.status(400).send('Bad Register: Missing email or password! Try again.');
            return;
        }

        await client.connect()
        const colli = client.db('Course_project').collection('Users')


        const user = await colli.findOne({
            email: req.body.email
        })

        if (user) {
            res.status(400).send(`This account already exists, with email: "${req.body.email}" ! Use the right email.`);
            return;
        }

        const {
            email,
            password,
            name
        } = req.body

        const hash = await bcrypt.hash(password, 10);

        let User = {
            email: req.body.email,
            password: hash,
            name: req.body.name
        }

        await colli.insertOne(User);
        res.status(201).json("All gooed");
        return;

    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        })

    } finally {
        await client.close()
    }
    console.log("Login route called.")
});

//Login route
app.post('/login', async (req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            res.status(400).send('Bad login: Missing email or password! Try again.');
            return;
        }

        await client.connect()
        const colli = client.db('Course_project').collection('Users')

        const user = await colli.findOne({
            email: req.body.email
        })

        if (!user) {
            res.status(400).send('No account found with this email! Use the right email.');
            return;
        }

        const verifyPass = bcrypt.compareSync(req.body.password, user.password);

        if (verifyPass) {
            res.status(200).json({
                succes: "You have now acces to the database, have fun",
                login: true,
                id: user._id,
                name: user.name,
                email: user.email
            });
        } else {
            res.status(400).send("Wrong password, try again.")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        })

    } finally {
        await client.close()
    }
    console.log("Login route called.")
});

//Delete user by name
app.delete('/users/:email', async (req, res) => {
    if (!req.params.email) {
        res.status(400).send('Bad login: Missing email! Try again.');
        return;
    }

    try {
        await client.connect();
        const colli = client.db('Course_project').collection('Users');

        const query = {
            email: req.params.email
        };

        const result = await colli.deleteOne(query);

        if (result.deletedCount === 1) {
            const connection = client.db('Course_project').collection('Favourites');
            const clearData = {
                name: String(verifyUser._id)
            };

            await connection.deleteMany(clearData);
            res.status(200).send(`Account with name ${req.params.email} successfully deleted.`)
        } else {
            res.status(404).send(`No account matched the query. ${req.params.email}`)
        }


    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });

    } finally {
        await client.close();
    }
});


app.listen(port, () => {
    console.log(`Movie API listening at http://localhost:${process.env.PORT}`)
});