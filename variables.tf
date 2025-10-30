variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "apigw-lambda-dynamo"
}

variable "dynamodb_table_name" {
  type    = string
  default = "items_table"
}

variable "lambda_handler" {
  type    = string
  default = "index.handler"
}

variable "lambda_runtime" {
  type    = string
  default = "nodejs18.x"
}

variable "lambda_memory" {
  type    = number
  default = 128
}

variable "lambda_timeout" {
  type    = number
  default = 10
}
