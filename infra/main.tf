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
  doodle_lambda_name = "doodle_table_crud_lambda"
  lambda_runtime     = "nodejs18.x"
  lambda_s3_key      = "lambda.zip"
  lambda_zip_path    = "../backend/lambdas/api/test.zip" # TODO: Gitignore this
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

resource "aws_iam_role" "lambda_role" {
  name = "lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "basic_execution_policy" {
  name = "basic_execution_policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "logs:CreateLogGroup"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:log-group:/aws/lambda/${local.doodle_lambda_name}:*"
      }
    ]
  })
}

resource "aws_iam_policy" "microservice_execution_policy" {
  name = "microservice_execution_policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.doodle-proto-table.name}"
      }
    ]
  })
}

# Attach each policy to the lambda role
# TODO: Is it possible to use for_each here?
# resource "aws_iam_role_policy_attachment" "lambda_policies_attachment" {
#   for_each = toset([
#     aws_iam_policy.basic_execution_policy.arn,
#     aws_iam_policy.microservice_execution_policy.arn,
#   ])
#   role       = aws_iam_role.lambda_role.name
#   policy_arn = each.value
# }

resource "aws_iam_role_policy_attachment" "lambda_policies_attachment1" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.basic_execution_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_policies_attachment2" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.microservice_execution_policy.arn
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
