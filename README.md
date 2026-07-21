# Setup

## 0. Setup Environment Variables

Generate the RSA keypair (no OpenSSL needed):

```bash
cd ./src/auth/
node gen-jwt-keys.mjs
```

This creates:
- `private.pem`
- `public.pem`

Add them to your `.env` **in `src/auth/`**:

```env
PRIVATE_KEY_PATH=private.pem
PUBLIC_KEY_PATH=public.pem
```

Then make sure your `private.pem` and `public.pem` files are located in the same folder (`src/auth/`) as your `.env`.

Also add user data to your `.env` like this:
```env
TEST_USERNAME=<username>
TEST_PASSWORD=<password>
USER_ID=<id>
ROLE='user'
```

## 1. Start the mongod db

```bash
yarn mongo
```

## 2. Start the app 

Dev mode:
```bash
yarn dev
```

Normal start up

```bash
yarn start
```

## Test the API in the browser with Swagger

http://localhost:3000/api-docs/

## Run tests

```bash
yarn test
```
TODO:
- Audit service für registration nutzen
- Tests schreiben
