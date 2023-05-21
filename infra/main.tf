# Need:
# - DynamoDB
# - Lambda functions
#   - Read and zip from ../backend/lambdas ?
#   - Zip module
#   - S3 for backend
#   - IAM roles for lambda to CRUD DynamoDB
# - API Gateway
# - Cloudwatch maybe for alerts and shutdown

locals {
  lambda_zip_path = "../backend/lambdas/api/test.zip"
  lambda_s3_key   = "lambda.zip"
  lambda_runtime  = "nodejs18.x"
}

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
  bucket         = var.app_bucket
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

resource "aws_s3_object" "lambda_zip" {
  depends_on = [
    module.remote_state, # remote-state ensures creation of s3 bucket
  ]
  bucket = var.app_bucket
  key    = local.lambda_s3_key
  source = local.lambda_zip_path
}

resource "aws_lambda_function" "doodle_lambda" {
  role = "TODO"

  depends_on = [
    module.remote_state, # remote-state ensures creation of s3 bucket
    aws_dynamodb_table.doodle-proto-table,
  ]
  function_name = "doodle_table_crud_lambda"
  handler       = "module.handler"
  runtime       = local.lambda_runtime
  s3_bucket     = var.app_bucket
  s3_key        = local.lambda_s3_key
}
