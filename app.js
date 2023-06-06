const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://ShubhamChaturvedi:9555047172@mongodbwithshubham.z3dowao.mongodb.net/fluid3infotech', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>{
    console.log("MongoDb is connected")
})
.catch((err) => {
    console.log(err.message)
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  userType: String,
});
const User = mongoose.model('User', userSchema);

// Express middlewares
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
    store: new MongoDBStore({
      uri: 'mongodb+srv://ShubhamChaturvedi:9555047172@mongodbwithshubham.z3dowao.mongodb.net/fluid3infotech',
      collection: 'sessions',
    }),
  })
);

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(`Welcome ${req.session.user.email}`);
  } else {
    res.send('Please login');
  }
});

app.get('/register', (req, res) => {
  res.send(`
    <form action="/register" method="POST">
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <select name="userType" required>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      <button type="submit">Register</button>
    </form>
  `);
});

app.post('/register', async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      userType,
    });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.send('An error occurred during registration');
  }
});
const path = require('path');

// Specify the directory where your static files are located
const staticFilesDirectory = path.join(__dirname, '');

// Serve static files
app.use(express.static(staticFilesDirectory));


app.get('/login', (req, res) => {
  res.send(`
    <form action="/login" method="POST">
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = user;
      if (user.userType === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/');
      }
    } else {
      res.send('Invalid email or password');
    }
  } catch (error) {
    console.error(error);
    res.send('An error occurred during login');
  }
});

app.get('/admin', async (req, res) => {
    try {
      if (req.session.user && req.session.user.userType === 'admin') {
        const users = await User.find({}, 'email userType');
        res.send(users);
      } else {
        res.send('Access denied');
      }
    } catch (error) {
      console.error(error);
      res.send('An error occurred');
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
