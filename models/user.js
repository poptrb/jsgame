const mongoose = require('mongoose');

// Schema de date a utilizatorului in baza de date
const UserSchema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  username:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  }
});

const User = module.exports = mongoose.model('User', UserSchema);