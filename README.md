#### This repo can be used for testing the handler:

#### https://github.com/KubDus/Server-only-for-TS-handler

## Description of the task:

## Overview

#### Create a package that provides handler function for Express.js endpoint. Retrieve the relevant

#### information using the "id" from the request query, process the data in accordance with the task

#### specification, and send back the result as a response. Implement caching to minimize repetitive

#### data retrieval and processing. The code must be written in TypeScript and it must be type safe.

## Specification

#### Given an unsorted array of objects, each object having properties 'time' and 'price', where the 'time'

#### property has a unique value. Select all objects with a 'price' greater than the average of all prices in

#### the array. Determine the pair of consecutive dates with the greatest difference in 'time' value. If no

#### such gap exists, return nothing.

#### Mentioned dataset can only be obtained by calling a fetch function, which is very expensive to call.

#### We only want to call this function when we receive an endpoint request. The dataset can be large

#### and should only be processed when necessary. Each dataset has a unique identifier, and these

#### datasets can become outdated after a certain period of time. To address this, we need to

#### implement a refresh mechanism. One way to do this is to use a memory cache with a time-to-live

#### parameter. When you receive a request in your handler, always check the cache first. If the cache

#### doesn't have the information, only then should you call the fetch function or perform any

#### calculations.

## Project setup

**- Create new npm package called “cleo-assignment-handler”**
    - Do NOT publish to npm registry
**- Add any transpilers, bundlers, linters or types you need**
    - Runtime dependencies are strongly discouraged
**- Write your code in TypeScript but compile to JavaScript**
    - Output must contain JS module(s) and TS declaration
**- Export function createHandler from your package**
    - Only CommonJS and ESM is accepted
**- Upload your project to a public git repository**
    - We will use git url to install your package as a dependency

## Requirements

- Library works exactly as described in “Technical details” below
- TypeScript source code compiles without throwing any errors
- Code is clean and understandable, code style is consistent, rules are enforced

#### Optional but recommended:

- Do not use ‘any’ type
- Solution has unit tests
- Package can be imported as both CJS and ESM


## Technical details

### Package

#### Your package must be named “cleo-assignment-handler”.

#### This package must export function called createHandler with following signature:

createHandler(ttl: number, fetchFunc: FetchFunction): RequestHandler

#### Where ttl is used as cache invalidation period, RequestHandler is function with request and

#### response parameters and type FetchFunction is defined below as:

type FetchFunction = (id: number) => Promise<FetchResult>
type FetchResult = { price: number; time: Date }[]

#### When calling fetchFunc, parameter id must be a non-negative integer.

### Rest API

#### Api requests can have query parameter id, which should have a non-negative integer value.

#### If the id parameter is missing or it does not have a valid value, then return an error response.

#### Api responses must use JSON format and should return appropriate status code. All responses

#### must follow structure described below. Think of appropriate error scenarios and messages.

#### Successful (2XX) response:

#### Range exists:

##### {

"success": true,
"error": null,
"result": {
"range": {
"start": "ISO 8601",
"end": "ISO 8601"
}
}
}

#### Range does not exist:

##### {

"success": true,
"error": null,
"result": {
"range": null
}
}

#### Error (>=400) response:

##### {

"success": false,
"error": "string",
"result": null
}


## Examples

### Datasets

#### Id 1:

[{ "price": 0 , "time": _2023-01-01_ }]

#### Id 2:

##### [

{ "price": 1 , "time": _2023-01-01_ },
{ "price": 0 , "time": _2023-01-02_ },
{ "price": 1 , "time": _2023-01-03_ }
]

### Calls

#### GET ?id=abc

#### Status code: 400

##### {

"success": false,
"error": "Something went wrong",
"result": null
}

#### GET ?id=

#### Status code: 200

##### {

"success": true,
"error": null,
"result": {
"range": null
}
}

#### GET ?id=

#### Status code: 200

##### {

"success": true,
"error": null,
"result": {
"range": {
"start": "2023-01-01T00:00:00.000Z",
"end": "2023-01-03T00:00:00.000Z"
}
}
}

### Server (Express.js)

import express from 'express';
import { createHandler } from 'cleo-assignment-handler';
const ttl = 10000 ;
async function fetchValues(id) {
return [/* ... */];
}
const app = express();
app.get('/api', createHandler(ttl, fetchValues));
app.listen( 3000 );



