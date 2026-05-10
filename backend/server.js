require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_develop';
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio',
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

const upload = multer({ storage: storage });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. Wait until you log in.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}


app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = users[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT items.*, users.username as author_username 
      FROM items 
      LEFT JOIN users ON items.user_id = users.id 
      ORDER BY items.sort_order ASC, items.id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    let image_url = '';
    if (req.file) {
      image_url = req.file.path;
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [[{ maxOrder }]] = await db.query('SELECT MAX(sort_order) as maxOrder FROM items');
    const newSortOrder = (maxOrder || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO items (title, description, image_url, user_id, sort_order) VALUES (?, ?, ?, ?, ?)',
      [title, description, image_url, req.user.id, newSortOrder]
    );

    const newItem = {
      id: result.insertId,
      title,
      description,
      image_url,
      author_username: req.user.username
    };

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/reorder', authenticateToken, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }

    // Update each item's sort_order based on its position in the array
    const promises = orderedIds.map((id, index) => {
      return db.query('UPDATE items SET sort_order = ? WHERE id = ?', [index + 1, id]);
    });

    await Promise.all(promises);
    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder items' });
  }
});

app.put('/api/items/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    // Check ownership first
    const [existing] = await db.query('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to edit this item or it does not exist' });
    }

    let image_url = existing[0].image_url;
    if (req.file) {
      image_url = req.file.path;
    }
    
    await db.query('UPDATE items SET title = ?, description = ?, image_url = ? WHERE id = ?', [title, description, image_url, id]);
    
    const [rows] = await db.query('SELECT i.*, u.username as author_username FROM items i JOIN users u ON i.user_id = u.id WHERE i.id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership first
    const [rows] = await db.query('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (rows.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to delete this item or it does not exist' });
    }

    const item = rows[0];
    
    await db.query('DELETE FROM items WHERE id = ?', [id]);

    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
