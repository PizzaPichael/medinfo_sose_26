import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../errors/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env from this same folder (src/auth), or change the path if your .env is elsewhere
dotenv.config({ path: path.resolve(__dirname, '.env') });

const privateKeyPath = path.resolve(__dirname, process.env.PRIVATE_KEY_PATH);
const publicKeyPath  = path.resolve(__dirname, process.env.PUBLIC_KEY_PATH);

if (!process.env.PRIVATE_KEY_PATH || !process.env.PUBLIC_KEY_PATH) {
  throw new AppError('JWT key paths missing in .env', 500);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const publicKey  = fs.readFileSync(publicKeyPath, 'utf8');
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
                algorithm: 'RS256',
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
            const decoded = jwt.verify(token, publicKey, {
                algorithms: ['RS256'],
                issuer: ISSUER,
                audience: AUDIENCE
            });
            return decoded;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new AppError('Invalid token', 401);
        }
    }
}

export default Authenticator