terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Data source to get existing droplet if droplet_id is provided
data "digitalocean_droplet" "existing" {
  count = var.droplet_id != "" ? 1 : 0
  id    = var.droplet_id
}

# Get the IP address - either from data source or variable
locals {
  droplet_ip = var.droplet_id != "" ? data.digitalocean_droplet.existing[0].ipv4_address : var.droplet_ip
}

# Null resource for file transfer and deployment
resource "null_resource" "deploy" {
  connection {
    type        = "ssh"
    host        = local.droplet_ip
    user        = var.ssh_user
    private_key = file(pathexpand(var.ssh_key_path))
    timeout     = "5m"
  }

  # Transfer project files
  provisioner "file" {
    source      = "${path.module}/../docker-compose.yml"
    destination = "/tmp/darkroom/docker-compose.yml"
  }

  provisioner "file" {
    source      = "${path.module}/../Makefile"
    destination = "/tmp/darkroom/Makefile"
  }

  # Transfer nginx files
  provisioner "remote-exec" {
    inline = [
      "mkdir -p /tmp/darkroom/nginx/certs"
    ]
  }

  provisioner "file" {
    source      = "${path.module}/../nginx/Dockerfile"
    destination = "/tmp/darkroom/nginx/Dockerfile"
  }

  provisioner "file" {
    source      = "${path.module}/../nginx/nginx.conf"
    destination = "/tmp/darkroom/nginx/nginx.conf"
  }

  # Transfer nginx certificates
  # Note: SSL certificates must exist in ../nginx/certs/ before deployment
  provisioner "file" {
    source      = "${path.module}/../nginx/certs/domain.cert.pem"
    destination = "/tmp/darkroom/nginx/certs/domain.cert.pem"
  }

  provisioner "file" {
    source      = "${path.module}/../nginx/certs/private.key.pem"
    destination = "/tmp/darkroom/nginx/certs/private.key.pem"
  }

  provisioner "file" {
    source      = "${path.module}/../nginx/certs/public.key.pem"
    destination = "/tmp/darkroom/nginx/certs/public.key.pem"
  }

  # Transfer application Dockerfile
  provisioner "file" {
    source      = "${path.module}/../application/Dockerfile"
    destination = "/tmp/darkroom/application/Dockerfile"
  }

  # Transfer entire application directory (excluding node_modules)
  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/.. && 
      tar --exclude='node_modules' \
          --exclude='.git' \
          --exclude='dist' \
          --exclude='.svelte-kit' \
          -czf /tmp/darkroom-app.tar.gz \
          -C application .
    EOT
  }

  provisioner "file" {
    source      = "/tmp/darkroom-app.tar.gz"
    destination = "/tmp/darkroom-app.tar.gz"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /tmp/darkroom",
      "mkdir -p application",
      "tar -xzf /tmp/darkroom-app.tar.gz -C application",
      "rm /tmp/darkroom-app.tar.gz"
    ]
  }

  # Build and deploy with Docker Compose
  provisioner "remote-exec" {
    inline = [
      "cd /tmp/darkroom",
      "docker compose down || true", # Stop existing containers if any
      "make build",                   # Build Docker images
      "docker compose up -d"          # Start containers
    ]
  }

  triggers = {
    always_run = timestamp() # Change this to a hash of files for more efficient updates
  }
}

output "droplet_ip" {
  description = "IP address of the droplet"
  value       = local.droplet_ip
}

output "deployment_status" {
  description = "Deployment completed"
  value       = "Files transferred and containers deployed to ${local.droplet_ip}"
}
