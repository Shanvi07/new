const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const flash = require('connect-flash');
const session = require('express-session');
const userModel = require('./models/user.model');
const tweetModel=require("./models/tweet.model");
// Middleware
require("./config/db.config");

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: "hjagshkncbhjakskzbchkj"
}));
app.use(flash());

// Routes
app.get('/', (req, res) => {
   res.render('welcome');
});

app.get("/profile", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username });
  res.render("profile", { user });
});

app.get('/register', (req, res) => {
  res.render("register", { error: req.flash("error")[0] });
});

app.post('/register', async(req, res) => {
   let { username, password } = req.body;
   let user = await userModel.findOne({ username });

   if (user) {
     req.flash("error", "Account already exists, please login.");
     return res.redirect("/register");
   }

   bcrypt.genSalt(10, function(err, salt) {

     bcrypt.hash(password, salt, async function (err, hash) {


       await userModel.create({
         username,
         password: hash  
       });

       let token = jwt.sign({ username }, "secret"); // Dangerous, use environment variable in production
       res.cookie("token", token); 
       res.redirect("/profile");
     });
   });
});

app.get('/login', (req, res) => {
    res.render('login', { error: req.flash("error")[0] });
});

app.post('/login', async (req, res) => {
  let { username, password } = req.body;
  let user = await userModel.findOne({ username });

  if (!user){
    req.flash("error", "username or password is incorrect.");
        return res.redirect("/login");
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (err) return res.status(500).send("Error comparing password");
    
    if (result) {
       let token = jwt.sign({ username }, "secret"); // Dangerous, use environment variable in production
       res.cookie("token", token);
       res.redirect("/profile");
    } 
    else {
      req.flash("error", "username or password is incorrect.")
            res.redirect("/login");
    }
  });
});

app.get('/logout', function (req, res) {
   res.clearCookie("token");
   res.redirect('/login');
});


app.get("/feed", isLoggedIn, async function (req, res) {
  let tweets = await tweetModel.find()
  res.render("feed", { tweets });
})

app.get("/createpost", isLoggedIn, function (req, res) {
  res.render("createpost");
})

app.post("/createpost", isLoggedIn, async function (req, res) {
  let { tweet } = req.body;
  await tweetModel.create({
      tweet,
      username: req.user.username
  })
  res.redirect("/feed");
})

function isLoggedIn(req, res, next) {
  if (!req.cookies.token) {
    req.flash("error", "you must be loggedin.");
    return res.redirect("/login");
}

    jwt.verify(req.cookies.token, "secret", function (err, decoded) {
        if (err) {
          res.cookie("token", "");
            return res.redirect("/login");
        } else {
            req.user = decoded;
            next();
        }
    });
}
function redirectToFeed(req, res, next) {
  if (req.cookies.token) {
      jwt.verify(req.cookies.token, "secret", function (err, decoded) {
          if (err) {
              res.cookie("token", "");
              return next();
          }
          else {
              res.redirect("/feed");
          }
      })
  }
  else{
      return next();
  }
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
