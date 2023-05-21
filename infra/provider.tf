provider "aws" {
  region = var.aws_region

  access_key                  = var.is_local ? var.local_accesskey : null
  secret_key                  = var.is_local ? var.local_secret : null
  skip_credentials_validation = var.is_local ? true : null
  skip_metadata_api_check     = var.is_local ? true : null
  skip_requesting_account_id  = var.is_local ? true : null
  s3_use_path_style           = var.is_local ? true : null
  endpoints {
    dynamodb = var.is_local ? var.localstack_endpoint : null
    lambda   = var.is_local ? var.localstack_endpoint : null
    s3       = var.is_local ? var.localstack_endpoint : null
  }
}
