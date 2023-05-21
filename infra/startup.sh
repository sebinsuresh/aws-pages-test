#!/bin/bash

# TODO: Make this local vs CI/CD specific by parameter:
function tf_initialize() {
  # Don't initialize S3 backend since that doesnt exist yet.
  # Use a local tfstate initially
  mv backend.tf backend.tf.backup
  terraform init -migrate-state
  
  # Create S3 bucket and dynamodb table for tfstate
  terraform apply \
  -target module.remote_state \
  -var-file terraform.local.tfvars
  
  # Migrate tfstate to S3 now
  mv backend.tf.backup backend.tf
  terraform init \
  -backend-config backend-config.tfvars \
  -backend-config backend-config.local.tfvars \
  -migrate-state
}

# tf_initialize
