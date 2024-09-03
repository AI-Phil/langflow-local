# Node Server

## Limitations and Indemnification

* This is a general-purpose guide, provided under the [MIT License](LICENSE.md). You 
should take this as an instructive starting point for your own implementation.
* These instructions have been written for purposes of local development and demonstration, 
and are *not* intended for direct use in a production environment. 


## Setup

This repository has a `node_app` subdirectory that has [Next.js](https://nextjs.org) installed into [Node.js](https://nodejs.org).
Add the following to the Docker service list in `docker-compose.yaml`:

```yaml
  # Node server configuration
  node:
    build:
      context: ./node_app
      dockerfile: Dockerfile
    container_name: node
    command: ["npm", "run", "start"]
    expose:
      - "3000"
    networks:
      - langflow-network
    environment:
      - NODE_ENV=production
```

and the following to the `nginx.conf`:

```
    # Node.js application
    server {
        listen 3000;
        server_name node;

        location / {
            proxy_pass http://node:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

and the following to your `hosts` file:

```
127.0.0.1 node
```

To make all this then run:

1. Delete the running `nginx` container 
2. `docker compose up --build -d` to launch the services; note the extra `--build` flag, which will compile the application.

## Addding/Modifying Pages

To develop locally:

1.  `cd node_app` 
2. `cp ../.env ./.env.local`
3. `npm run dev -- -p 3001` 

Note port `3001` is specified, as port `3000` is in use by the above Docker config.

Once you've made a change you're happy with, you can re-run `docker compose up --build -d`.
