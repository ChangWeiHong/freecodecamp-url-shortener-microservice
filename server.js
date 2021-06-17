require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// My Code Start here
// Encode the body in request
app.use(
  express.urlencoded({
    extended: true
  })
)

// My code start here
const router = express.Router();


// connect to mongodb
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create url schema
let urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: Number
})

let URL = mongoose.model("URL", urlSchema);


// POST the orginal_url to mongo db
// append unique id to short_url
app.post('/api/shorturl', function(req, res){

  var resObj = {};
  var inputOriginalURL = req.body.url;
  var inputShortURL = 0;

  resObj["original_url"] = inputOriginalURL;
  resObj["short_url"] = inputShortURL;

  // Find the most latest stored url
  // Plus 1 on the latest url
  // find the orginal url sent from req in mongodb
  // update the short url by getting the latest short url plus 1
  // create new if not found in the mongodb
  // save and overlap the previous record if found
  URL
    .findOne({})
    .sort({ short_url: "desc" })
    .exec((error, result) => {
      if (!error && result != undefined) {
        inputShortURL = result.short_url + 1;
      }
      if (!error) {
        URL.findOneAndUpdate(
          { original_url: inputOriginalURL },
          { original_url: inputOriginalURL, short_url: inputShortURL },
          { new: true, upsert: true },
          (error, savedUrl) => {
            if (!error) {
              resObj["short_url"] = savedUrl.short_url;
              res.json(resObj);
            }
          }
        );
      }
    });

});

// GET, find by shorturl
// redirect to the original url
app.get('/api/shorturl/:short_url', function(req, res){
  URL
    .findOne({short_url: req.params.short_url})
    .sort({ short_url: "desc" })
    .exec((error, result) => {
      if (!error) {
        res.redirect(result.original_url);
      }
    });
})




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
