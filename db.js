const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const dbname = 'todo_db'
const url = 'mongodb://todouser:todo1234@ds261626.mlab.com:61626/todo_db';
const mongoOptions = {newUrlParser: true};

const state = {
    db: null
};

// pass in a callback
const connect = (cb) =>{
    // if state is not NULL
    // Means we have connection already, call our CB
    if(state.db)
        cb();
    else{
        // attempt to get database connection
        MongoClient.connect(url, mongoOptions, (err,client) => {
            // unable to get database connection pass error to CB
            if(err)
                cb(err);
            // Successfully got our database connection
            // Set database connection and call CB
            else{
                state.db = client.db(dbname);
                cb();
            }
        });
    }
}

// get primary key
const getPrimaryKey = (_id) => {
    return ObjectID(_id);
}

// get db
const getDB = () => {
    return state.db;
}

module.exports = {getDB, connect, getPrimaryKey};
