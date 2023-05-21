## About

Experimenting with Serverless on AWS, Terraform, and Github Actions to create a simple web application.

**⚠️ NOTE: This is still a WIP Project**

## Requirements

- Docker
- Terraform
- AWS CLI
- Git Bash on Windows (or any other bash terminal)

## Instructions

### Running Infrastructure Locally

Install/use required software listed above.

From `./infra/` run:

```sh
docker-compose up -d
sh startup.sh
```

To shut down and start from scratch:

```sh
rm -rf .terraform
docker-compose down --volumes
```

TODO: Remaining

### Building and Running the Backend

TODO: This section

### Building and Running the Frontend

TODO: This section
