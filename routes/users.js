const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

// Importam modelul de utilizator din models/user
let User = require('../models/user');

// Formularul de inregistrare
router.get('/register', function(req, res){
  res.render('register');
});

// Procesul de inregistrae
router.post('/register', function(req, res){
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('name', 'Numele este obligatoriu.').notEmpty();
  req.checkBody('email', 'E-mailul este obligatoriu.').notEmpty();
  req.checkBody('email', 'E-mailul nu este valid.').isEmail();
  req.checkBody('username', 'Numele de utilizator este obligatoriu').notEmpty();
  req.checkBody('password', 'Parola este obligatorie.').notEmpty();
  req.checkBody('password2', 'Parolele introduse nu se potrivesc.').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors:errors
    });
  } else {
    let newUser = new User({
      name:name,
      email:email,
      username:username,
      password:password
    });

    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(newUser.password, salt, function(err, hash){
        if(err){
          console.log(err);
        }
        newUser.password = hash;
        newUser.save(function(err){
          if(err){
            console.log(err);
            return;
          } else {
            req.flash('success','Te-ai autentificat cu succes!');
            res.redirect('/users/login');
          }
        });
      });
    });
  }
});

// Formularul de autentificare
router.get('/login', function(req, res){
  res.render('login');
  User.find({});
});

// Autentificare
router.post('/login', function(req, res, next){
  passport.authenticate('local', {
    successRedirect:'/', //Daca se logheaza cu succes, mergem la homepage.
    failureRedirect:'/users/login', //Altfel reincearca logarea.
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'Ai ieşit din cont.');
  res.redirect('/'); //users/login
});

module.exports = router;