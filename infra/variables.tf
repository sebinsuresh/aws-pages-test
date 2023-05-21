variable "aws_region" {
  type        = string
  description = "region to deploy the infrastructure"
}

variable "is_local" {
  type        = bool
  description = "is the infrastructure being deployed locally"
  default     = false
}

variable "local_accesskey" {
  type        = string
  description = "local aws access key to be used when deploying locally"
}

variable "local_secret" {
  type        = string
  description = "local aws secret to be used when deploying locally"
}

variable "localstack_endpoint" {
  type        = string
  description = "localstack endpoint to be used when deploying locally"
  default     = "http://localhost:4566"
}
