provider "aws" {
  region = var.aws_region

  # skip_metadata_api_check     = true
  # skip_requesting_account_id  = true
  # s3_force_path_style         = true
  # endpoints {
  #   dynamodb = "http://localhost:4566"
  #   kinesis  = "http://localhost:4566"
  #   lambda   = "http://localhost:4566"
  #   s3       = "http://localhost:4566"
  # }
}
