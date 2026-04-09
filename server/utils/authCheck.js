import admin from '../firebaseAdmin.js';

const checkAuth = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized');
    }

    const idToken = header.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attaches uid, email, etc. to the request
        next();
    } catch (error) {
        res.status(403).send('Invalid Token');
    }
};

export default checkAuth;