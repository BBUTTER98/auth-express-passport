require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5');
const encrypt = require('mongoose-encryption');
const ejs = require('ejs');
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const port = process.env.PORT;
const url = process.env.DB_URL;
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(url);
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    secrets: String
})
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
})
app.get("/login",function(req,res){
    res.render("login");
})
app.get("/register",function(req,res){
    res.render("register");
})
app.get("/secrets",(req,res)=>{
    if(!req.isAuthenticated()){
        res.redirect("/login");
    }
    User.find({"Secret": {$ne:null}},function(err,users){
        if(err){console.log(err)}
        else{
            res.render("secrets",{
                users: users
            });
        }
    });
    
})
app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){console.log(err)}
    });
    res.redirect("/");
})
app.get("/submit",function(req,res){
    if(req.isAuthenticated){
        res.render("submit");
    }
    else{
        res.render("login");
    }   
});
app.post("/register",function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
})
app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    }); 

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })
    })
})
app.post("/submit",function(req,res){
    const submitedSecret = req.body.secret;
    User.findById(req.user.id,function(err, foundUser){
        if(err){
            console.log(err);
            res.redirect("/submit");
        }
        else{
            if(foundUser){
                foundUser.secrets = submitedSecret;
                foundUser.save();
                res.redirect("/secrets");
            }
        }
    });
    
})

    

app.listen(port,function(){
    console.log(`server is listening on port ${port}`);
})