variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "droplet_id" {
  description = "Existing DigitalOcean droplet ID (leave empty to use droplet_ip instead)"
  type        = string
  default     = ""
}

variable "droplet_ip" {
  description = "IP address of the existing droplet (required if droplet_id is not set)"
  type        = string
  default     = ""
}

variable "ssh_key_path" {
  description = "Path to SSH private key for accessing the droplet"
  type        = string
  default     = "~/.ssh/id_rsa"
}

variable "ssh_user" {
  description = "SSH user for the droplet"
  type        = string
  default     = "root"
}
