#!/bin/bash

set -e pipefail

# TODO: Make function for local vs CI/CD specific by parameter.
function tf_initialize() {
  # Set AWS credentials
  echo "Setting AWS credentials"
  AWS_ACCESS_KEY_ID="$(grep local_accesskey terraform.local.tfvars | grep -o '".*"' | sed 's/"//g')"
  AWS_SECRET_ACCESS_KEY="$(grep local_secret terraform.local.tfvars | grep -o '".*"' | sed 's/"//g')"
  export AWS_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY
  export AWS_DEFAULT_REGION="us-east-2"
  
  # Don't initialize S3 backend since that doesnt exist yet.
  # Use a local tfstate initially
  echo "Initializing Terraform"
  [ ! -f backend.tf ] || mv backend.tf backend.tf.backup
  terraform init -migrate-state
  
  echo "Creating S3 bucket and DynamoDB table for tfstate"
  terraform apply \
  -target module.remote_state \
  -var-file terraform.local.tfvars \
  -auto-approve
  
  echo "Migrating tfstate to S3"
  mv backend.tf.backup backend.tf
  echo 'yes' | terraform init \
  -backend-config backend-config.tfvars \
  -backend-config backend-config.local.tfvars \
  -migrate-state
  
  echo "Creating infrastructure"
  terraform apply \
  -var-file=terraform.local.tfvars \
  -auto-approve
  
  echo "Cleaning up"
  rm terraform.tfstate
  rm terraform.tfstate.backup
}

tf_initialize
