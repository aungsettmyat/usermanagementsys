const mongoose = require('mongoose')

const TestsSchema = new mongoose.Schema({
	Login: {
		type: String
	},
	password: {
		type: String
	}
	
},{timestamps: true});

module.exports = mongoose.model('tests', TestsSchema)