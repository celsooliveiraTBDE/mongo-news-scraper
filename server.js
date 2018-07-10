// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const request = require('request');

// Require request and cheerio. This makes the scraping possible
const cheerio = require("cheerio");

//require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
    extended: true
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/scraperFIFA");

db.Headline.create({
    name: "Russia Wins 2018 World Cup"
})
let results = {};

// Main route (simple Hello World Message)
app.get("/", function (req, res) {
    res.render("index");
});

app.get("/scrape", function (req, res) {
    results = {};

    request("http://www.lance.com.br/copa-do-mundo", function (error, response, html) {
        //   console.log(html)
        // Load the HTML into cheerio and save it to a variable
        // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
        let $ = cheerio.load(html);

        // An empty array to save the data that we'll scrape

        // With cheerio, find each p-tag with the "title" class
        // (i: iterator. element: the current element)
        $(".title").each(function (i, element) {

            // Save the text of the element in a "title" variable
            // Add the text and href of every link, and save them as properties of the result object
            results.title = $(this)
                // .children("a")
                .text();
            results.link = $(this)
                // .children("a")
                .attr("href");

            db.Note.create(results)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(`this is the created note --->${dbArticle}`);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
        });
        /* -/-/-/-/-/-/-/-/-/-/-/-/- */
    });

    res.send("Scrape Complete");
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Note.find({})
        .then(function (dbArticle) {
            let Headliner = {
                headline: dbArticle
              };
            console.log(Headliner); 
            // If we were able to successfully find Articles, send them back to the client
            res.render("articles", Headliner);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Start the server
app.listen(process.env.PORT || 5000, function () {
    console.log("App running on port " + PORT + "!");
});


// // Route for grabbing a specific Article by id, populate it with it's note
// app.get("/articles/:id", function(req, res) {
//     // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//     db.Article.findOne({ _id: req.params.id })
//       // ..and populate all of the notes associated with it
//       .populate("note")
//       .then(function(dbArticle) {
//         // If we were able to successfully find an Article with the given id, send it back to the client
//         res.json(dbArticle);
//       })
//       .catch(function(err) {
//         // If an error occurred, send it to the client
//         res.json(err);
//       });
//   });

//   // Route for saving/updating an Article's associated Note
//   app.post("/articles/:id", function(req, res) {
//     // Create a new note and pass the req.body to the entry
//     db.Note.create(req.body)
//       .then(function(dbNote) {
//         // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
//         // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//         // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//         return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
//       })
//       .then(function(dbArticle) {
//         // If we were able to successfully update an Article, send it back to the client
//         res.json(dbArticle);
//       })
//       .catch(function(err) {
//         // If an error occurred, send it to the client
//         res.json(err);
//       });
//   });
