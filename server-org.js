if (process.env.NODE_ENV !== "production") { require('dotenv').config(); }

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')

const indexRouter = require('./routes/index')
var session = require('express-session');

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))
app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: false,
}));

const mongoose = require('mongoose')
mongoose.set('runValidators', true);  //do validation when update
mongoose.set("useFindAndModify", false);
//mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
var url = 'mongodb://localhost:27017/userdb';
mongoose.connect(url, { useNewUrlParser: true });
const db = mongoose.connection
//console.log(db)
//console.log("<><><><>")
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

//var MongoClient = require('mongodb').MongoClient;
//var url = 'mongodb://localhost:27017/userdb';
//MongoClient.connect(url, function(err, db){
//	var dbo = db.db("userdb");
//	dbo.collection("Tag").findOne({}, function(err, result){
//		if(err) throw err;
//		console.log("???")
//		console.log(result.name);
//		db.close();
//	})
//	console.log("connected");
//	db.close();
//});

//var mongoose = require ("mongoose");
////mongoose.connect("mongodb://localhost:27017/userdb");
//var url = 'mongodb://localhost:27017/userdb';
//mongoose.connect(url, { useNewUrlParser: true });
//var db = mongoose.connection;
//

var Schema = mongoose.Schema;
var UserSchema = new Schema({
	Login: String,
	password: String,
	firstname: String,
	lastname: String,
	gender: String,
	email: String,
	phonenum: String,
	isAdmin: Boolean
});
var test = mongoose.model("User", UserSchema);
var tan = new test({
	Login: "admin",
	password: "111",
	firstname: "admin",
	lastname: "admin",
	gender: "M",
	email: "test@test.com",
	phonenum: "+81348942342",
	isAdmin: false
});
tan.save(function(error){
	console.log(error)
});

app.use('/', indexRouter)
app.use('/signup', indexRouter)

app.listen(process.env.PORT || 3000)