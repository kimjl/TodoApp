// import modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Joi = require('joi');

const db = require('./db');
const collection = 'todo';
const app = express();

//nexmo requirements
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: 'YOURKEY',
    apiSecret: 'YOURSECRET'
}, {debug: true});


// schema used for data validation for our todo document
const schema = Joi.object().keys({
    todo: Joi.string().required()
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// serve static html file to user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/sendSMS', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//read
app.get('/getTodos', (req, res) => {
    //get all todos from db and send back as json to user
    db.getDB().collection(collection).find({}).toArray((err, documents) => {
        if(err){
            console.log(err)
        }
        else{
            console.log(documents);
            res.json(documents);
        }
    });
});


//update
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

//create and send sms
app.post('/', (req, res, next) => {
  const userInput = req.body;
  const number = req.body.number;
  const text = req.body.text;
  nexmo.message.sendSms(
      'YOURNUMBER', number, text, {type: 'unicode'},
      (err, responseData) => {
          if(err) {
              console.log(err);
          }
          else {
              console.dir(responseData);
          }
      }
  );
  Joi.validate(userInput, schema, (err, result) => {
      if(err) {
          const error = new Error('Invalid Input');
          error.status = 400;
          next(error);
      }
      else {
          console.log('Successfully validated input.')
          db.getDB().collection(collection).insertOne(userInput, (err, result) => {
              if(err) {
                  console.log('Failed todo insert.');
                  const error = new Error('Failed to insert Todo document');
                  error.status = 400;
                  next(error);
              }
              else {
                  console.log('Successfully inserted todo');
                  res.json({result: result, document: result.ops[0], msg: 'Successfully inserted Todo', error: null});
              }
            });
      }
  });
});

//delete
app.delete('/:id', (req, res) => {
    const todoID = req.params.id;

    db.getDB().collection(collection).findOneAndDelete({_id: db.getPrimaryKey(todoID)}, (err, result) => {
        if(err)
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
});

db.connect((err) => {
    // If err unable to connect to database
    // End application
    if(err) {
        console.log('unable to connect to db');
        process.exit(1);
    }
    // Successfully connected to database
    // Start up our Express Application
    // And listen for Request
    else {
        app.listen(3000, () => {
            console.log('Connected to database, app listening on port 3000');
        });
    }
})
