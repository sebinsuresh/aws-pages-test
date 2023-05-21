provider "aws" {
  region = var.aws_region

  # access_key                  = "mock_access"
  # secret_key                  = "mock_secret"
  # skip_metadata_api_check     = true
  s3_use_path_style           = var.is_local ? true : null
  skip_credentials_validation = var.is_local ? true : null
  skip_requesting_account_id  = var.is_local ? true : null
  endpoints {
    dynamodb = var.is_local ? var.localstack_endpoint : null
    lambda   = var.is_local ? var.localstack_endpoint : null
    s3       = var.is_local ? var.localstack_endpoint : null
  }
}
