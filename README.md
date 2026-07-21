# Setup

## 0. Setup Environment Variables

Generate certificate and private key:

```bash
mkcert <IP-Address> localhost
```

Add the generated certificate and key to your `.env` file in the auth folder:

> **WICHTIG**\
> Make sure that the .pem content gets pasted in one line, replace newlines with \n if necessary.

```env
PUBLIC_KEY=<path-or-certificate-content>
PRIVATE_KEY=<path-or-private-key-content>
```

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