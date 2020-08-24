'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event) => {
  let user = {};

  // fetch user from the database
  try {
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: {
        id: event.pathParameters.id,
      },
    };
    user = await dynamoDb.get(params).promise();

    console.log(`User get, User id ${event.pathParameters.id}: `, user);
  } catch (err) {
    console.error(err);
    return {
      statusCode: err.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't fetch the user.",
    };
  }

  let todos = [];
  try {
    const todosParams = {
      TableName: process.env.DYNAMODB_TABLE,
      FilterExpression: '#owner = :id',
      ExpressionAttributeNames: {
        '#owner': 'belongsTo',
      },
      ExpressionAttributeValues: { ':id': event.pathParameters.id },
    };
    todos = await dynamoDb.scan(todosParams).promise();

    console.log(`Todos: `, todos);
  } catch (err) {
    console.error(err);
    return {
      statusCode: err.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't fetch TODOs for this user",
    };
  }

  const respBody = {
    ...user,
    todos: todos.Items,
  };

  // create a response
  const response = {
    statusCode: 200,
    body: JSON.stringify(respBody),
  };
  return response;
};
