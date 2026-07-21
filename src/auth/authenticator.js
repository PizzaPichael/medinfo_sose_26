import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;
const ISSUER = 'http://localhost:3000';
const AUDIENCE = 'http://localhost:3000';

/**
 * Class responsible for creating and verifying JWT tokens for authentication.
 * Inspired by: https://generate-random.org/jwt-tokens/javascript
 */
class Authenticator {

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
        const token = jwt.sign(payload, privateKey, {
            algorithm: 'HS256',
            expiresIn: '1h',
            issuer: ISSUER,
            audience: AUDIENCE
        });
        return token;
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, publicKey);
            return decoded;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new Error('Invalid token');
        }
    }

    // Load the public key from .env
    getCertificate() {
        return publicKey;
    }
}

export default Authenticator