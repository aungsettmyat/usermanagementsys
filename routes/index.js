const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Tag = require('../models/Tag')
const Transaction = require('mongoose-transactions') 
const transaction = new Transaction()
const transaction1 = new Transaction()
const pdf = require('pdfkit')
const fs = require('fs')
var path = require('path');

const Tests = require('../models/Tests');

router.get('/', (req, res) => {
	res.render('login') 
});

router.get('/register', (req, res) => {
	res.render('register',{
		user: "",
		skill:""
	})
});

//LOGIN
router.post('/login',async(req,res)=>{
	var loginid = req.body.loginid;
	var psw = req.body.password;
	var tagarr = {};
	var myDoc = new pdf({layout : 'landscape'});
	
	await Tag.find({},(error,data)=>{
		data.forEach(value=>{
			tagarr[value.userid]=value.name;
		});
	});
	
	User.findOne({Login:loginid,password:psw},(err,data)=>{
		if(data){
			req.session.loginid = loginid;
			if(data.isAdmin == true){
				myDoc.pipe(fs.createWriteStream('userlist.pdf'));
				User.find({},(error,data)=>{
					var header = "Users List \n\n";
					myDoc.font('Courier')
					.fontSize(10)
					.text(header, 20);	

					data.forEach(value => {						
						var content = "LoginID : " + value.Login + 
										"\n UserName: " + value.firstname + " " + value.lastname +
										"\n UserType(Admin): " + value.isAdmin +
										"\n Gender: " + value.gender + 
										"\n Email: " + value.email +
										"\n PhoneNo: " + value.phonenum +
										"\n JLPT: " + tagarr[value.Login] + "\n\n";
						myDoc.font('Courier')
						.fontSize(10)
						.text(content);
						
						var footer = "-----------------------------------------------------------------------\n\n";
						myDoc.font('Courier')
						.fontSize(10)
						.text(footer);						
					});
					myDoc.end();
				});
			} 
			res.render("top",{flag: data.isAdmin});
		}else{
			res.render("login",{
				inputid: req.body.loginid,
				errorMessage: "LoginID or Password was wrong!!"
			});
		}
	});
});

//REGISTER
router.post('/register',(req,res)=>{
	const user = "User";
	const tag = "Tag";
  
	var num = "";  
	var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	var nameformat = /^[a-zA-Z]+$/;
	var phformat = /[+][(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*/;
	let msg =[];
	var randomloginid = "";
	var chkerr = "";

	if(!req.body.password||!req.body.firstname||!req.body.lastname||!req.body.email){     
		msg[msg.length]='> Please enter all of the items!';      
	}
	if(!req.body.email.match(mailformat)){
		msg[msg.length]='> Email format was wrong!';
	}
	if(!req.body.firstname.match(nameformat)||!req.body.lastname.match(nameformat)){
		msg[msg.length]='> First Name and Last Name was only alphabet allowed!'; 
	}
	if(!req.body.phonenum.match(phformat)){
		msg[msg.length]='> Phone number: use number and country code!';
	}
	if(!req.body.skill){
		msg[msg.length]='> Please select JLPT!';  
	}
	
	async function fncMakeid(length) {
		var result = '';
		var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		randomloginid = result;
	}
  
	async function fncInsert() {
		try {
			fncMakeid(7);
			num = randomloginid;
			
			var userdata = {
					Login:num,
					password: req.body.password,
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					gender: req.body.gender,
					email: req.body.email,
					phonenum: req.body.phonenum,
					isAdmin: req.body.isadmin,
					isadmin: req.body.isadmin
			};
			
			var insertUserData = new User({
				Login: num, 
				password: req.body.password,
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				gender: req.body.gender,
				email: req.body.email,
				phonenum: req.body.phonenum,
				isAdmin: req.body.isadmin
			});
			insertUserData.save(function (err, resUserdata) {
				if(err){
					chkerr = "ERROR";
					return console.error(err);
				}else{
					chkerr = "";
				}
			});
			
			if(chkerr == ""){
				//const usertran = transaction.insert(user, userdata);
				const tagtran = transaction.insert(tag, {name: req.body.skill.toString(),userid: num});
				
				const final = await transaction.run();
				transaction.clean();
				res.render('register',{
					user: "",
					skill: "",
					errorMessage:msg,
					successMessage:"Successfully Registered. Your Login ID is "+userdata.Login
				});
			}
		}catch (error){
			const rollbackObj = await transaction.rollback().catch(console.error);
			transaction.clean();
			res.render('register',{
				user: userdata,
				skill: req.body.skill,
				errorMessage:msg
			}); 
		}
	}
	
	if(msg.length == 0){
		fncInsert();
	}else{
		var userdata = {
				password: req.body.password,
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				gender: req.body.gender,
				email: req.body.email,
				phonenum: req.body.phonenum,
				isAdmin: req.body.isadmin,
				isadmin: req.body.isadmin
		};
		res.render('register',{
			user: userdata,
			skill: req.body.skill,
			errorMessage:msg
		}); 
	}
});

//UPDATE
router.get('/edit',(req,res)=>{
	User.findOne({Login:req.session.loginid},(err,data)=>{
		if(data){
			Tag.findOne({userid:data.Login},(err,data1)=>{
				if(data1){
					res.render("edit",{
						user: data,
						skill:data1.name
					});
				}
			});
		}else{
			res.send("ERROR 500!");
			console.log("ERROR!!!!!!");
		}
	});
});
router.post('/edit', (req,res)=>{  
	var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	var nameformat = /^[a-zA-Z]+$/;
	var phformat = /[+][(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*/;
	let msg =[];
	var userid = "";
	var tagid = "";
	var taguserid = "";
	var admin_flg = "";
	var user = "User";
	var tag = "Tag";
	var sessionlogin = req.session.loginid;

	if(!req.body.password||!req.body.firstname||!req.body.lastname||!req.body.email){ 
		msg[msg.length]='> Please enter all of the items!';      
	}  
	if(!req.body.email.match(mailformat)){
		msg[msg.length]='> Email format was wrong!';
	}
	if(!req.body.firstname.match(nameformat)||!req.body.lastname.match(nameformat)){
		msg[msg.length]='> First Name and Last Name was only alphabet allowed!'; 
	}
	if(!req.body.phonenum.match(phformat)){
		msg[msg.length]='> Phone number: use number and country code!';
	}
	if(!req.body.skill){
		msg[msg.length]='> Please select JLPT!';
	}

	async function fncUpdate() {	
		try {
			await User.findOne({Login:sessionlogin},(err,data)=>{
				if(data){
					userid = data.Login;
					adminflg = data.isAdmin;
				}
			});
    
			await Tag.findOne({userid:userid},(err,data1)=>{
				if(data1){          
					tagid = data1._id;
					taguserid = data1.userid;
				}
			});
      
			var userdata = { 
					Login:sessionlogin,
					password: req.body.password,
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					gender: req.body.gender,
					email: req.body.email,
					phonenum: req.body.phonenum,
					isAdmin: req.body.isadmin,
					isadmin: req.body.isadmin
			}
      
			var tagdata = {
					name: req.body.skill.toString(),
					userid:userid
			};
			
			User.update({Login:userid}, {$set: {
				password: req.body.password,
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				gender: req.body.gender,
				email: req.body.email,
				phonenum: req.body.phonenum,
				isAdmin: req.body.isadmin
				}}).exec();
			
			//transaction1.update(user, {Login:userid}, userdata);
			transaction1.update(tag, tagid, tagdata);
        
			const final = await transaction1.run();
			transaction1.clean();

			res.render("edit",{
				user: userdata,
				skill: req.body.skill,
				errorMessage:msg,
				successMessage: "> Updated successfully!"
			});
        } catch (error) {
        	const rollbackObj = await transaction1.rollback().catch(console.error);
        	transaction1.clean();
        	res.render("edit",{
        		user: userdata,
        		skill: req.body.skill,
        		errorMessage: msg
        	});
        }
	}
	
	if(msg.length == 0){
		fncUpdate();
	}else{
		var userdata = { 
				Login:sessionlogin,
				password: req.body.password,
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				gender: req.body.gender,
				email: req.body.email,
				phonenum: req.body.phonenum,
				isAdmin: req.body.isadmin,
				isadmin: req.body.isadmin
		}
		
		res.render("edit",{
    		user: userdata,
    		skill: req.body.skill,
    		errorMessage: msg
    	});
	}
});

//Menu
router.get('/top',async(req,res)=>{
	var tagarr = {};
	var myDoc = new pdf;
  
	await Tag.find({},(error,data)=>{  
		data.forEach(value=>{
			tagarr[value.userid]=value.name;
		});
	});
   
	User.findOne({Login:req.session.loginid},(err,data)=>{
		if(data){
			/*
			if(data.isAdmin == true){
				myDoc.pipe(fs.createWriteStream('userlist.pdf'));
				
				User.find({},(error,data)=>{
					var titile = "Login ID &ensp; First Name &ensp; Last Name";
					myDoc.font('Times-Roman')
					.fontSize(10)
					.text(titile, 50);
					
					data.forEach(value => {
						
						var content ="Login ID : "+value._id+"\nLogin : "+value.Login+"\nPassword : "+value.password+"\nFirst Name : "+
						value.firstname+"\nLast Name : "+value.lastname+"\nGender : "+value.gender+"\nEmail : "+value.email+"\nPhone Number : "+
						value.phonenum+"\nIsadmin : "+value.isAdmin+"\nSkill : "+tagarr[value._id]+"\nCreatedAt : "+
						value.createdAt+"\nUpdatedAt : "+value.updatedAt+"\n\n";
						myDoc.font('Times-Roman')
						.fontSize(10)
						.text(content, 50);
					});
					myDoc.end();
				})
			}
			*/
			res.render("top",{flag: data.isAdmin});
		}else{
			res.send("Error in top");
		}
	})
});

//LOGOUT
router.get('/logout',(req,res)=>{
	if(req.session){
		req.session.destroy();
	}
	res.redirect("/");
});

//PDF DOWNLOAD
router.get('/download',(req,res)=>{
	var file = path.join("./", 'userlist.pdf');
	res.download(file, function (err) {
		if(err){
			console.log("Error");
			console.log(err);
		}else{
			console.log("Success");
		}
	});
});
//-----------------------------------------------------
module.exports = router;