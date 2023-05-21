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

module "remote_state" {
  source         = "./modules/remote-state"
  region         = var.aws_region
  bucket         = "lambda-api-testing-poc-1"
  dynamodb_table = "terraform-state-lock"
}

resource "aws_dynamodb_table" "doodle-proto-table" {
  name         = "doodle-proto-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "yy-mm-dd"
  range_key    = "createddate"
  attribute {
    name = "yy-mm-dd"
    type = "S"
  }
  attribute {
    name = "createddate"
    type = "S"
  }
}
