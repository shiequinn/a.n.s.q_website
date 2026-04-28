import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import session from 'express-session';
import pool from './db.js'; 
import routes from './routes.js';
import loginRoute from './loginRoute.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const allowedOrigins = [
  'https://shiequinn.com',
  'https://idesignwebsite-905e545d981b981b.herokuapp.com',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.static('public'));
app.use(express.json());

app.use(session({
  secret: process.env.SECRET_KEY || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use('/', loginRoute);
app.use('/api', routes);
app.use('/api/reviews', routes);
app.options('*', cors());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [results] = await pool.query(
      'SELECT * FROM xbxm73r0k93viqkl.users WHERE email = ?',
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res.json({ message: 'Login successful', userId: user.id });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Database error' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM xbxm73r0k93viqkl.reviews');
    res.json(result);
  } catch (error) {
    console.error('Error fetching reviews from DB:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/', (req, res) => res.send('Hello World'));


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});