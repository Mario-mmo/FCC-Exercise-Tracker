const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
  username: {type: String, required: true},
})

const exerciseSchema = new Schema({
  user_id: String,
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Date
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  try {  
    let username = req.body.username;
    const user = new User({
      'username': username
    });
    await user.save()
    res.json({'username': user.username, '_id':user._id});
  } catch (err) {
    console.log(err);
    res.send(err.toString())
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    let id = req.params._id;
    let { description, duration, date } = req.body;
    const user = await User.findById(id);
    if (user) {
      const exercise = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date).toDateString() : new Date().toDateString()
      })
  
      await exercise.save()
      res.json({
        '_id': id,
        'username': user.username,
        'date': exercise.date.toDateString(),
        'duration': parseInt(duration),
        'description': description,
      })
    }
  }
  catch (err) {
    res.send(err.toString());
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('_id username');
  res.json(users)
})

app.get('/api/users/:_id/logs', async (req, res) => {
  let id = req.params._id;
  const user = await User.findById(id);

  if (user) {
    let { from, to, limit } = req.query;
    let dateFilter = {}
    let finder = {
      user_id: id
    };

    if (from) dateFilter['$gte'] = new Date(from);
    if (to) dateFilter['$lte'] = new Date(to);
    if (from || to) finder.date = dateFilter;

    let exercises = await Exercise.find(finder).limit(limit ?? 100);
    const count = exercises.length;
  
    const log = {
      'username': user.username,
      'count': count,
      'id': id,
      'log': exercises.map(e => {
        return {
          'description': e.description,
          'duration': e.duration,
          'date': e.date.toDateString()
        };
      })
    };
    res.json(log);
  }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
