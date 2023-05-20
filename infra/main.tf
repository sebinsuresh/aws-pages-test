# Need:
# - DynamoDB
# - Lambda functions
#   - Read and zip from ../backend/lambdas ?
#   - Zip module
#   - S3 for backend
#   - IAM roles for lambda to CRUD DynamoDB
# - API Gateway
# - Cloudwatch maybe for alerts and shutdown

terraform {
  required_version = ">=1.4.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# resource "aws_s3_bucket" "projectBucket" {
#   bucket = var.bucket
# }

module "remote_state" {
  source         = "./modules/remote-state"
  region         = var.region
  bucket         = var.bucket
  dynamodb_table = var.dynamodb_table
}
