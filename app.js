const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const db = require('./db');
const collection = 'todo'
const app = express();

app.use(bodyParser.json());

// serve static html file to user
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

// read
app.get('/getTodos', (req,res) => {
    // get all Todo documents within our todo collection
    // send back to user as json
    db.getDB().collection(collection).find({}).toArray((err, documents) => {
        if (err)
            console.log(err);
        else
            res.json(documents);
    });
});

// update
app.put('/:id', (req, res) => {
    // Primary Key of Todo Document we wish to update
    const todoID = req.params.id;
    // Document used to update
    const userInput = req.body;
    // Find Document By ID and Update
    db.getDB().collection(collection).findOneAndUpdate({_id : db.getPrimaryKey(todoID)}, {$set : {todo : userInput.todo}}, {returnOriginal : false}, (err, result) => {
        if (err)
            console.log(err);
        else
            res.json(result);
    });
});

// create
app.post('/', (req, res) => {
  const userInput = req.body;
  db.getDB().collection(collection).insertOne(userInput, (err, result) => {
    if (err)
        console.log(err);
    else
        res.json({result: result, document: result.ops[0]});
  });
});

// delete
app.delete('/:id', (req, res) => {
  const todoID =req.params.id;
  db.getDB().collection(collection).findOneAndDelete({_id: db.getPrimaryKey(todoID)}, (err, result) =>{
    if (err)
        console.log(err);
    else
        res.json(result);
  });
});

db.connect((err) => {
    // If err unable to connect to database
    // End application
    if (err) {
        console.log('unable to connect to database');
        process.exit(1);
    }
    // Successfully connected to database
    // Start up our Express Application
    // And listen for Request
    else {
        app.listen(3000, () => {
            console.log('connected to database, app listening on port 3000');
        });
    }
});
