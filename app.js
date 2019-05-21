const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Joi = require('joi');

// twilio requirements
const accountSid = 'YOURACCOUNTSID';
const authToken = 'YOURAUTHTOKEN';
const client = require('twilio')(accountSid, authToken);

const db = require('./db');
const collection = 'todo'
const app = express();


// schema used for data validation for our todo document
const schema = Joi.object().keys({
    todo: Joi.string().required()
});

app.use(bodyParser.json());

// serve static html file to user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

// read
app.get('/getTodos', (req, res) => {
    // get all Todo documents within our todo collection
    // send back to user as json
    db.getDB().collection(collection).find({}).toArray((err, documents) => {
        if (err)
            console.log(err);
        else
            res.json(documents);
    });
});

// get all todos for twilio messaging
app.get('/getMsg', (req, res) => {
    db.getDB().collection(collection).find({}, {projection: {_id: 0}}).toArray((err, documents) => {
        if (err)
            console.log(err);
        else {
            var msg = ''
            documents.forEach((doc) => {
                console.log(doc);
                msg = msg + doc.todo + '. ';
            });
            res.json(msg);
        }
    });
});

// catch form submit
app.post('/', (req, res) => {
    // res.send(req.body);
    // console.log(req.body)

    // this comes from our form
    const number = req.body.number;
    const text = req.body.msg

    client.messages
      .create({
         body: text,
         from: '+YOURTWILIONUMBER',
         to: number
       })
      .then(message => console.log(message.sid));
})

// update
app.put('/:id', (req, res) => {
    // Primary Key of Todo Document we wish to update
    const todoID = req.params.id;
    // Document used to update
    const userInput = req.body;
    // Find Document By ID and Update
    db.getDB().collection(collection).findOneAndUpdate({_id: db.getPrimaryKey(todoID)}, {$set: {todo: userInput.todo}}, {returnOriginal: false}, (err, result) => {
        if (err)
            console.log(err);
        else
            res.json(result);
    });
});

// create
app.post('/', (req, res, next) => {
  const userInput = req.body;
  Joi.validate(userInput, schema, (err, result) => {
      if(err) {
          const error = new Error('Invalid Input');
          error.status = 400;
          next(error);
      }
      else {
          db.getDB().collection(collection).insertOne(userInput, (err, result) => {
              if(err) {
                  const error = new Error('Failed to insert Todo document');
                  error.status = 400;
                  next(error);
              }
              else
                  res.json({result: result, document: result.ops[0], msg: 'Successfully inserted Todo', error: null});
            });
      }
  })

});

// delete
app.delete('/:id', (req, res) => {
  const todoID = req.params.id;
  db.getDB().collection(collection).findOneAndDelete({_id: db.getPrimaryKey(todoID)}, (err, result) =>{
    if (err)
        console.log(err);
    else
        res.json(result);
  });
});

// Sends Error Response Back to User
app.use((err, req, res, next) => {
    res.status(err.status).json({
        error: {
            message: err.message
        }
    });
})

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
