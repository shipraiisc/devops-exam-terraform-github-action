// lambda/index.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); // we will include uuid as dependency (or implement simple id)
const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));

  const method = event.requestContext?.http?.method || event.httpMethod;
  const rawPath = event.rawPath || event.path || "";
  const pathParameters = event.pathParameters || (event.path && parsePathParams(event.path)) || {};
  const body = event.body ? JSON.parse(event.body) : null;

  try {
    if (method === "POST" && rawPath === "/items") {
      // Create item
      const id = body && body.id ? body.id : uuidv4();
      const item = { id, ...body };
      await dynamo.put({
        TableName: TABLE,
        Item: item
      }).promise();

      return respond(201, { message: "Item created", item });
    }

    if (method === "GET" && rawPath === "/items") {
      // Scan (simple list)
      const res = await dynamo.scan({ TableName: TABLE }).promise();
      return respond(200, { items: res.Items || [] });
    }

    if (method === "GET" && pathParameters && pathParameters.id) {
      // Get single
      const res = await dynamo.get({
        TableName: TABLE,
        Key: { id: pathParameters.id }
      }).promise();

      if (!res.Item) return respond(404, { message: "Not Found" });
      return respond(200, { item: res.Item });
    }

    if (method === "PUT" && pathParameters && pathParameters.id) {
      // Update - assume body has attributes to set
      const id = pathParameters.id;
      const toUpdate = body || {};
      // Build UpdateExpression
      const keys = Object.keys(toUpdate);
      if (keys.length === 0) return respond(400, { message: "No attributes to update" });

      const ExpressionAttributeNames = {};
      const ExpressionAttributeValues = {};
      const setParts = [];

      keys.forEach((k, i) => {
        const nameKey = `#k${i}`;
        const valKey = `:v${i}`;
        ExpressionAttributeNames[nameKey] = k;
        ExpressionAttributeValues[valKey] = toUpdate[k];
        setParts.push(`${nameKey} = ${valKey}`);
      });

      const UpdateExpression = "SET " + setParts.join(", ");

      const res = await dynamo.update({
        TableName: TABLE,
        Key: { id },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
      }).promise();

      return respond(200, { message: "Item updated", item: res.Attributes });
    }

    if (method === "DELETE" && pathParameters && pathParameters.id) {
      const id = pathParameters.id;
      await dynamo.delete({
        TableName: TABLE,
        Key: { id }
      }).promise();

      return respond(200, { message: "Item deleted", id });
    }

    return respond(400, { message: "Unsupported route" });
  } catch (err) {
    console.error(err);
    return respond(500, { message: "Internal server error", error: err.message });
  }
};

// helper
function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

// parse path params for older payload formats (best-effort)
function parsePathParams(path) {
  const parts = path.split("/").filter(Boolean);
  // e.g., /items/{id} -> parts[0] = 'items', parts[1] = id
  if (parts.length >= 2 && parts[0] === "items") return { id: parts[1] };
  return {};
}
