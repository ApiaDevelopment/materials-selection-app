$params = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,POST,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@

aws apigateway put-integration-response --rest-api-id xrld1hq3e2 --resource-id 1z63lw --http-method OPTIONS --status-code 200 --response-parameters $params

aws apigateway create-deployment --rest-api-id xrld1hq3e2 --stage-name prod --description "Fixed /products OPTIONS CORS"
