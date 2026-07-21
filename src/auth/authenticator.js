import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../errors/AppError.js';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env');
dotenv.config({ path: envPath });

const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;
const ISSUER = 'http://localhost:3000';
const AUDIENCE = 'http://localhost:3000';

/**
 * Class responsible for creating and verifying JWT tokens for authentication.
 * Inspired by: https://generate-random.org/jwt-tokens/javascript
 */
class Authenticator {

    verifyUserCredentials(username, password) {
        const envUsername = process.env.TEST_USERNAME;
        const envPassword = process.env.TEST_PASSWORD;

        if (username === envUsername && password === envPassword) {
            return { user_id: process.env.USER_ID, role: process.env.ROLE };
        }
        throw new AppError('Invalid username or password', 401);
    }

    // Create token payload
    createTokenPayload(user_id, username, role) {
        const payload = {
            user_id: user_id,
            username: username,
            role: role
        };
        return payload;
    }

    // Generate JWT with options
    generateToken(payload) {
        try {
            const token = jwt.sign(payload, privateKey, {
                algorithm: 'HS256',
                expiresIn: '1h',
                issuer: ISSUER,
                audience: AUDIENCE
            });
            return token;
        } catch (error) {
            console.error('Token generation failed:', error);
            throw new AppError('Token generation failed', 500);
        }
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, publicKey);
            return decoded;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new AppError('Invalid token', 401);
        }
    }

    // Load the public key from .env
    getCertificate() {
        return publicKey;
    }
}

export default Authenticator