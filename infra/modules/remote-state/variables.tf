variable "bucket" {
  type        = string
  description = "name of the bucket to store the terraform state"
}

variable "dynamodb_table" {
  type        = string
  description = "name of the dynamodb table to store the terraform state lock"
}

variable "region" {
  type        = string
  description = "region to deploy the infrastructure"
  default     = "us-east-2"
}
