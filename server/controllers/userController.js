import admin from 'firebase-admin';
import db from '../db/db.js';

// create
const createUser = async (req, res) => {
    const { firebaseUid, email } = req.body;

    // Input validation
    if (!firebaseUid || !email) {
        return res.status(400).json({ error: 'User ID and email are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await db.user.findUnique({ where: { firebaseUid } });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Create new user in the database
        const newUser = await db.user.create({
            data: {
                firebaseUid: firebaseUid,
                email: email,
                username: email.split('@')[0] // Simple username generation from email
            }
        });

        res.status(201).json({ message: 'User successfully created', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// read
const getUsers = async (req, res) => {
    try {
        const users = await db.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.user.findUnique({
            where: {
                firebaseUid: id
            }, select: {
                userId: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// update

// delete


export { getUsers, getUserById, createUser };