// server.js
// where your node app starts

// init project
var dns = require('dns');
var express = require('express');
var Sequelize = require('sequelize');
var bodyParser = require('body-parser');
var app = express();

var URL;

// setup a new database
// using database credentials set in .env
var sequelize = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
    // Security note: the database is saved to the file `database.sqlite` on the local filesystem. It's deliberately placed in the `.data` directory
    // which doesn't get copied if someone remixes the project.
  storage: '.data/database.sqlite'
});


// authenticate with the database
sequelize.authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
    // define a new table 'urls'
    URL = sequelize.define('urls', {
      address: {
        type: Sequelize.STRING
      }
    });
  
  })
  .catch(function (err) {
    console.log('Unable to connect to the database: ', err);
  });

app.use(bodyParser.urlencoded({ extended: false }));

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// your first API endpoint... 
app.post("/api/shorturl/new", function (req, res) {
  
  var lookupURL = (req.body.url.substr(0, 8) === 'https://' ?
                   req.body.url.substr(8) :
                  (req.body.url.substr(0, 7) === 'http://' ?
                   req.body.url.substr(7) :
                   req.body.url));
  
  dns.lookup(lookupURL, function(err) {
    if (err === null) {
      URL.create({'address': req.body.url}).then(function(url) {
        res.send({'original_url': req.body.url, 'short_url': url.id});
      });
    } else {
      res.send({error:"invalid URL"});
    }
  });
});

app.get("/api/shorturl/:id", function (req, res) {
  URL.findById(req.params.id)
  .then(function (url) {
    res.redirect(url.address);
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});