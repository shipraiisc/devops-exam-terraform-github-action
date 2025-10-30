output "api_url" {
  description = "HTTP API endpoint"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "table_name" {
  value = aws_dynamodb_table.items.name
}
