// Lambda API code?
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

// TODO: Replace
const tableName = "prototype-doodle-table-2";

// https://stackoverflow.com/a/52869830
function isExpectedIsoDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d) && d.toISOString() === str;
}

function isYYMMDD(str) {
  return /^\d{2}-\d{2}-\d{2}$/.test(str);
}

async function handleGetByPartition(event) {
  const isValid = isYYMMDD(event.pathParameters.partition);
  if (!isValid) {
    throw new Error("Invalid partition key - must be YY-MM-DD.");
  }

  const body = await dynamo.send(
    // TODO: Limit number of returned items
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "#yymmdd = :partition",
      ExpressionAttributeNames: {
        "#yymmdd": "yy-mm-dd",
      },
      ExpressionAttributeValues: {
        ":partition": event.pathParameters.partition,
      },
    })
  );
  return body.Items;
}

async function handleGetByPartitionAndSort(event) {
  let isValid = isYYMMDD(event.pathParameters.partition);
  if (!isValid) {
    throw new Error("Invalid partition key - must be YY-MM-DD.");
  }
  isValid = isExpectedIsoDate(event.pathParameters.sort);
  if (!isValid) {
    throw new Error(
      "Invalid sort key - Must be something like 2023-02-24T04:04:38.569Z."
    );
  }

  const body = await dynamo.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        "yy-mm-dd": event.pathParameters.partition,
        createddate: event.pathParameters.sort,
      },
    })
  );
  return body.Item;
}

async function handlePut(event) {
  const requestJSON = JSON.parse(event.body);

  // TODO: Prevent overwriting if requests come in at same datetime

  // 16x16 => 16
  // 32x32 => 64
  // 64x64 => 256
  const expectedLength = 64;
  const isValid = requestJSON?.drawing?.length === expectedLength;
  if (!isValid) {
    throw new Error(`Invalid drawing. Must be ${expectedLength} chars.`);
  }

  const sortValue = new Date().toISOString(); // '2023-02-24T03:22:50.749Z'
  const partitionValue = sortValue
    .split(/-|T/) // ['2023', '02', '24', '03:18:12.502Z']
    .slice(0, 3) // ['2023', '02', '24']
    .join("-") // '2023-02-24'
    .substring(2); // '23-02-24'

  const item = {
    "yy-mm-dd": partitionValue,
    createddate: sortValue,
    drawing: requestJSON.drawing,
  };
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
  return item;
}

async function handleDelete(event) {
  let isValid = isYYMMDD(event.pathParameters.partition);
  if (!isValid) {
    throw new Error("Invalid partition key - must be YY-MM-DD.");
  }
  isValid = isExpectedIsoDate(event.pathParameters.sort);
  if (!isValid) {
    throw new Error(
      "Invalid sort key - Must be something like 2023-02-24T04:04:38.569Z."
    );
  }

  await dynamo.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        "yy-mm-dd": event.pathParameters.partition,
        createddate: event.pathParameters.sort,
      },
    })
  );
  return `Deleted doodle ${event.pathParameters.partition}-${event.pathParameters.sort}`;
}

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
    // "Access-Control-Allow-Origin": "*"
  };

  try {
    let isValid = true;

    switch (event.routeKey) {
      case "GET /doodles/{partition}":
      case "GET /doodles/{partition}/":
        body = await handleGetByPartition(event);
        break;
      case "GET /doodles/{partition}/{sort}":
        if (event.pathParameters.sort === "") {
          body = await handleGetByPartition(event);
        } else {
          body = await handleGetByPartitionAndSort(event);
        }
        break;
      case "PUT /doodles":
        body = await handlePut(event);
        break;
      case "DELETE /doodles/{partition}/{sort}":
        body = await handleDelete(event);
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
