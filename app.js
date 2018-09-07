const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
var server = require('http').Server(app);
var io = require('socket.io').listen(server);


mongoose.connect(config.database);
let db = mongoose.connection;

// Check connection
db.once('open', function(){
  console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
  console.log(err);
});

// Init App


// Bring in Models
//let Article = require('./models/article');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set Public Folder


// Express Session Middleware
app.use(session({
  secret: 'abcdef1234',
  resave: true,
  saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Configurarea pentru Passport
require('./config/passport')(passport);
// Middleware pentru passport.
app.use(passport.initialize());
app.use(passport.session());

var user = ''; 
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  user=res.locals.user;
  next();
});

app.get('/game', function (req, res) {
  //res.sendFile(__dirname + '/public/indexba.html');
  if (user)
    console.log(user.username);
  res.render(__dirname + '/public/game', {
    user : res.locals.user
  });
  
});
var serverRoute = require('./server.js')(express, app, io, user);
// Home Route
app.get('/', function(req, res){
      res.render('index2', {
        title:'Login'
      });
});

// Route Files
//let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/users', users);


server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
// Start Server
/*app.listen(3000, function(){
  console.log('Server started on port 3000...');
});*/