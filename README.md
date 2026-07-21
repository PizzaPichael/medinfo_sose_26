# Setup

## 0. Generate certificate and private key

```bash
mkcert <IP-Address> localhost
```

Add the generated certificate and key to your `.env` file in the auth folder:

```env
PUBLIC_KEY=<path-or-certificate-content>
PRIVATE_KEY=<path-or-private-key-content>
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