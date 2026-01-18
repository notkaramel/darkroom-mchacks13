# Terraform Deployment for Darkroom

This Terraform configuration deploys the Darkroom application to a DigitalOcean droplet that has Docker and Docker Compose installed.

## Prerequisites

1. Terraform installed ([Installation guide](https://developer.hashicorp.com/terraform/downloads))
2. DigitalOcean API token ([Get one here](https://cloud.digitalocean.com/account/api/tokens))
3. SSH access to your DigitalOcean droplet
4. Docker and Docker Compose installed on the droplet

## Setup

1. Copy the example variables file:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   - `do_token`: Your DigitalOcean API token
   - Either `droplet_id` or `droplet_ip`: The droplet you want to deploy to
   - `ssh_key_path`: Path to your SSH private key
   - `ssh_user`: SSH user (usually `root` for new droplets)

## Usage

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the deployment plan:
   ```bash
   terraform plan
   ```

3. Apply the configuration to deploy:
   ```bash
   terraform apply
   ```

4. To update after making changes:
   ```bash
   terraform apply
   ```

## What it does

1. Transfers all project files to `/tmp/darkroom` on the droplet
2. Builds Docker images for both `darkroom-application` and `darkroom-nginx`
3. Starts the containers using Docker Compose

## Important Notes

- The deployment copies files to `/tmp/darkroom` on the droplet
- SSL certificates are transferred if they exist in `../nginx/certs/`
- `node_modules` and other build artifacts are excluded from transfer
- The application source code is transferred as a tarball for efficiency

## Troubleshooting

If deployment fails:

1. Verify SSH access: `ssh -i ~/.ssh/id_rsa root@<droplet-ip>`
2. Check Docker is installed: `ssh root@<droplet-ip> 'docker --version'`
3. Check Docker Compose is installed: `ssh root@<droplet-ip> 'docker compose version'`
4. Verify the droplet IP/ID is correct in `terraform.tfvars`
