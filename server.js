'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const isValidURL = require('valid-url').isWebUri;
const bodyParser = require('body-parser');
const shortid = require('shortid');

// Include .env file
require('dotenv').config();

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(__dirname + '/public', express.static(process.cwd() + '/public'));

// generate link schema (data structure) & model for building link objects
const linkSchema = new mongoose.Schema({
  'url': { type: String, required: true },
  'hash': { type: String, required: true }
});
const Link = new mongoose.model('Link', linkSchema);

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", (req, res) => {
  res.json({greeting: 'hello API'});
});

/**
 * Post route to /api/shorturl/new
 */
app.post('/api/shorturl/new', (req, res) => {
  const { url } = req.body;
  if (!isValidURL(url)) {
    res.json({ "error": "invalid URL" });
  }
  let newLink;
  let found = false;
  Link.findOne({ url: url }, (err, data) => {
    if (err) return console.error(err);
    if (data) {
      newLink = { url: url, hash: data.hash };
      found = true;
    }
  }).then(() => {
    if (!found) {
      newLink = new Link({ "url": url, "hash": shortid.generate() });
      newLink.save(err => {
        if (err) return console.error(err);
        // link object saved
      });
    }
    res.json({ "url": newLink.url, "hash": newLink.hash });
  }).catch((err) => console.error(err));
});

app.get('/api/shorturl/:URLid', (req, res) => {
  const { URLid } = req.params;
  Link.findOne({ hash: URLid }, (err, data) => {
    if (err) console.error(err);
    return data.url;
  }).then((url) => {
    res.redirect(url.url);
  });
})

app.listen(port, () => {
  console.log('Node.js listening ...');
});