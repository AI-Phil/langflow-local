# MinIO

[MinIO](https://min.io/) is an open source object storage solution, with a strong committment to being S3-compatible.

It may therefore be useful to have a local service to demonstrate Flows that involve processing uploads to S3. 
Furthermore, we can use MinIO events to invoke flows using Webhooks and (eventually) demonstrate ingestion via
Kafka queues.

## Limitations and Indemnification

* This is a general-purpose guide, provided under the [MIT License](LICENSE.md). You 
should take this as an instructive starting point for your own implementation.
* These instructions have been written for purposes of local development and demonstration, 
and are *not* intended for direct use in a production environment. 

## Setup

### 1. Add the following service to `docker-compose.yaml`:

```yaml
  # Use MinIO if you want an S3-compatible object storage service
  minio:
    image: minio/minio
    container_name: minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - ./minio-data:/data
    networks:
      - langflow-network
    ports:
      - "9000:9000"  # API service
      - "9001:9001"  # MinIO console
```

### 2. Add the following to your `hosts` file:

```
127.0.0.1 minio
```

### 3. And start the service:

```bash
docker compose up -d
```

### 4. Once the service is up, create a `mc` (MinIO client) alias within the container:

```bash
docker exec minio mc alias set minio http://localhost:9000 minioadmin minioadmin
```

which should return:

```
Added `minio` successfully.
```

### 5. Create a bucket named `demo-bucket`:

```bash
docker exec minio mc mb minio/demo-bucket
```

which should return:

```
Bucket created successfully `minio/demo-bucket`.
```

### 6. Create an Access key for `minioadmin`:

```bash
docker exec minio mc admin user svcacct add minio minioadmin
```

On the result of this command, you're going to need to take note of `Access Key` and `Secret Key` values.

### 7. Create/edit a `.env` File

The following entries should go into a file named `.env` in the root of this project:

```
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=<"Access Key" from above>
MINIO_SECRET_KEY=<"Secret Key" from above>
MINIO_BUCKET=demo-bucket
```

### 8. Update `node` Container Environment

If you have the `node` service running, in the `docker-compose.yaml` file, *add* the following 
to the `node` service `environment:` (leave other variables in situ):

```yaml
    environment:
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_PORT=${MINIO_PORT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
```

and re-launch the Docker compose:

```bash
docker compose up -d
```

### 9. Validate Setup

You should be able to log into the MinIO Browser [http://minio:9001/browser](http://minio:9001/browser) using 
the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` values above (`minioadmin`).

That should show a bucket named `demo-bucket` (with no objects).  

Under Access Keys [http://minio:9001/access-keys](http://minio:9001/access-keys) you should see an entry for 
the access key created.

If you have Node running, you should be able to open [http://node:3000/demo/minio](http://node:3000/demo/minio)
and upload any file. You should see a message "File uploaded successfully".

Look within the `demo-bucket` at [http://minio:9001/browser/demo-bucket](http://minio:9001/browser/demo-bucket)
and you should see the file uploaded.