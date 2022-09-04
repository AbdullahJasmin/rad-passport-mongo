if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')


var mongoose = require("mongoose");
mongoose.Promise = global.Promise;mongoose.connect("mongodb://localhost:27017/users");


var loginSchema = new mongoose.Schema({
  email: String,
  password: String
 });

 var User = mongoose.model("User", loginSchema);
 

 const initializePassport = require('./passport-config')
 initializePassport(
   passport,
   email => User.findOne({ email: email }),
   id => User.findOne({ id: id })
 )
  

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  cookie:{_expires : 60000}, 

    resave: true,
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', checkAuthenticated, (req, res) => {
  res.render('login.ejs', { name: req.user.name })
})

app.get('/loggedin', checkAuthenticated, (req, res) => {
  
  
    if (req.session.views) { 
        req.session.views++  
      } else {
        req.session.views = 1 
      }
      console.log(req.session.views)
    res.render('index.ejs', { count : req.session.views })

})


app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/loggedin',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    const u = new User({
      id: Date.now().toString(), 
      email: req.body.email,
      password: hashedPassword
    }); 

    console.log(u.id + ' ' +u.email + ' ' + u.password);
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})
 

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/loggedin')
  }
  next()
}

app.listen(3000)