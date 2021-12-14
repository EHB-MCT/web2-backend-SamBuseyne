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

const dbName = "Session7";

app.use(express.static('public'))
app.use(bodyParser.json());

//klop klop iedereen mag binnen
app.use(cors());