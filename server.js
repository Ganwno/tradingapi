const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();


// Connect to the MongoDB database
mongoose.connect('mongodb+srv://omniteleos:drojuope10@salesforce.3fzphwe.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

// Define the schema for the transaction model
const transactionSchema = new mongoose.Schema({
    type: String,
    symbol: String,
    price: Number,
    quantity: Number,
    date: Date
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});



// Create the transaction model
const Transaction = mongoose.model('Transaction', transactionSchema);
// create a user model
const User = mongoose.model('User', userSchema);

// Configure the body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define the API routes
//Register
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).send({ error: 'User already exists' });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create a new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(200).send({ message: 'User created successfully' });
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET);
    res.json({ token });
});

// Get all transactions
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Create a new transaction
app.post('/transactions', async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
