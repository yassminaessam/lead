import { Router } from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const router = Router();

// GET all users (password excluded via toJSON)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone, permissions, isActive } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const user = new User({ name, email, password, role, phone, permissions, isActive });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, phone, role, permissions, isActive, password } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (permissions !== undefined) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;
    if (password && password.length >= 6) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
