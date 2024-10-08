# Langflow UI - Multiple Versions, Locally

While Langflow makes it easy to get going with a UI (`langflow run`), if you want to run multiple 
versions of Langflow locally, you're going to want to use isolated Postgres databases rather than
rely upon a single sqlite3 database.

This repository presents a pattern and starting point to run a simple Docker Compose-based 
Langflow environment. 

## Limitations and Indemnification

* This is a general-purpose guide, provided under the [MIT License](LICENSE.md). You 
should take this as an instructive starting point for your own implementation.
* These instructions have been written for purposes of local development and demonstration, 
and are *not* intended for direct use in a production environment. 

## Pre-Requisites

* Docker and Docker Compose
* Ability to edit your `hosts` file

## Getting Started

Create local copies of the example files:

```bash
cp example.docker-compose.yaml docker-compose.yaml
cp example.nginx.conf nginx.conf
```

And start this:

```bash
docker compose up -d
```

In your Docker console you should now see two processes running within the `langflow-local` group: a `postgres_db` and a `nginx_proxy`. 
Within the `postgres_db` logs you should eventually see two lines like:

```
LOG:  database system was shut down at 2024-08-21 13:44:21 UTC
LOG:  database system is ready to accept connections
```

In which case you're ready to go!

## Adding a Langflow Version

In the example, we're going to add Langflow v1.0.17 but any image in the [Langflow Docker Hub](https://hub.docker.com/r/langflowai/langflow) should work.

### Add Alias to `hosts` File

First create an entry for your Langflow host aliases in the `hosts` file ([how to is here](https://www.hostinger.com/tutorials/how-to-edit-hosts-file)):

For example, to reference Langflow v1.0.17 as `langflow-1-0-17`, add an entry:

```
127.0.0.1 langflow-1-0-17
```

### Add Postgres User and Database

A helper script is provided to add a Postgres user and database; you want one of these per Langflow version to keep them isolated from each other:

Here we will create a database user `langflow_1_0_17` with password `langflow`, and make this user the owner of a database `db_1_0_17`:

```bash
docker exec -it postgres_db bash /postgres-user.sh -m add -u langflow_1_0_17 -p langflow -d db_1_0_17
```

### Add Langflow Container to `docker-compose.yaml`

Within the `services:` add a new service for our Langflow version, similar to:

```yaml
  langflow-1-0-17:
    image: langflowai/langflow:1.0.17
    environment:
      LANGFLOW_DATABASE_URL: postgres://langflow_1_0_17:langflow@postgres_db:5432/db_1_0_17
      LANGFLOW_LOG_LEVEL: critical
    networks:
      - langflow-network
    expose:
      - "7860"
    volumes:
      # Mounting local directory langflow-data-1.0.17 facilitates restarts and container deletion
      - ./langflow-data-1.0.17:/app/langflow
    depends_on:
      - postgres
```

* The service name is `langflow-1-0-17`
* `image` corresponds to the Langflow Docker image tag
* `LANGFLOW_DATABASE_URL` is in the format `postgres://[username]:[password]@postgres_db:5432/[database]`, with these being the `-u`, `-p`, and `-d` parameters you used above
* You need to mount a `volume` that corresponds with a local directory (e.g. `langflow-data-1.0.17`) unique to this service name

Note that the exposed port `7860` is available within the Docker network (named `langflow-network`) but not directly exposed to the Docker host.

### Add Nginx Alias and Route

Next we want to be able to route requests to `langflow-1-0-17` to the service we've just defined (also named `langflow-1-0-17`).
In `nginx.conf` within the `http { }` section add a `server`:

```
    server {
        listen 7860;

        server_name langflow-1-0-17;

        location / {
            proxy_pass http://langflow-1-0-17:7860;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

* `listen` is the port that you will use from the host, and is set to `7860` by convention.
* `server_name` needs to correspond with the alias you added in the `hosts` file
* `proxy_pass` is of the format `http://[service_name]:7860`, with the service name being whatever you used in the section above

Back in `docker-compose.yaml`, add a `depends_on` to the nginx entry for your new service:

```yaml
    depends_on:
      - langflow-1-0-17
```

### Launch Docker Containers

Launch updated Docker containers:

```bash
docker compose up -d
```

And you can follow the logs of the new container. It will eventually have the familiar banner:

```
Starting Langflow v1.0.17...
╭───────────────────────────────────────────────────────────────────╮
│ Welcome to ⛓ Langflow                                             │
│                                                                   │
│                                                                   │
│ Collaborate, and contribute at our GitHub Repo 🌟                 │
│                                                                   │
│ We collect anonymous usage data to improve Langflow.              │
│ You can opt-out by setting DO_NOT_TRACK=true in your environment. │
│                                                                   │
│ Access http://0.0.0.0:7860                                        │
╰───────────────────────────────────────────────────────────────────╯
```

### Test it Out!

Once everything is in place, you should be able to access the Langflow UI for this new version, in our example [http://langflow-1-0-17:7860](http://langflow-1-0-17:7860/).

## Troubleshooting

### Stuck Langflow Container

Langflow container log stuck on 

```
2024-08-21 16:24:49 Starting Langflow v1.0.17...
```

* Did you create a Postgres user and database?

## Advanced

### Updating Nginx Configuration

If you make changes to `nginx.conf` without changes to the servce within `docker-compose.yaml`, forcibly recreate the Nginx service:

```bash
docker rm -f nginx_proxy
docker compose up -d
```

### Object Store

Some flows might want to ingest documents from a URL, rather than upload directly into the API. Certainly one could use an 
object store provided by an external provider, but `example.docker-compose.yaml` includes MinIO which is an open source, 
S3-compatible object store. Include this in your own `docker-compose.yaml`, re-launch `docker compose up -d`, and then: 

1. Navigate to [http://localhost:9001/](http://localhost:9001/) and login with the admin credentials you used in the Docker config.
2. Create a bucket, for example named `demo-bucket`.
3. Create an Access Key, which will have a key name and secret which you should note.
   - Download the `credentials.json` if you'd like, it also contains the key name and secret.
4. Browse the bucket and upload a file to the bucket.

