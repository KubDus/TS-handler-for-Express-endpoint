<p>Cleo hiring TypeScript task Overview Create a package that provides handler function for Express.js endpoint. Retrieve the relevant information using the &quot;id&quot; from the request query, process the data in accordance with the task specification, and send back the result as a response. Implement caching to minimize repetitive data retrieval and processing. The code must be written in TypeScript and it must be type safe. Specification Given an unsorted array of objects, each object having properties &apos;time&apos; and &apos;price&apos;, where the &apos;time&apos; property has a unique value. Select all objects with a &apos;price&apos; greater than the average of all prices in the array. Determine the pair of consecutive dates with the greatest difference in &apos;time&apos; value. If no such gap exists, return nothing. Mentioned dataset can only be obtained by calling a fetch function, which is very expensive to call. We only want to call this function when we receive an endpoint request. The dataset can be large and should only be processed when necessary. Each dataset has a unique identifier, and these datasets can become outdated after a certain period of time. To address this, we need to implement a refresh mechanism. One way to do this is to use a memory cache with a time-to-live parameter. When you receive a request in your handler, always check the cache first. If the cache doesn&apos;t have the information, only then should you call the fetch function or perform any calculations. Project setup &bull; Create new npm package called &ldquo;cleo-assignment-handler&rdquo; - Do NOT publish to npm registry &bull; Add any transpilers, bundlers, linters or types you need - Runtime dependencies are strongly discouraged &bull; Write your code in TypeScript but compile to JavaScript - Output must contain JS module(s) and TS declaration &bull; Export function createHandler from your package - Only CommonJS and ESM is accepted &bull; Upload your project to a public git repository - We will use git url to install your package as a dependency Requirements - Library works exactly as described in &ldquo;Technical details&rdquo; below - TypeScript source code compiles without throwing any errors - Code is clean and understandable, code style is consistent, rules are enforced Optional but recommended: - Do not use &lsquo;any&rsquo; type - Solution has unit tests - Package can be imported as both CJS and ESM Technical details Package Your package must be named &ldquo;cleo-assignment-handler&rdquo;. This package must export function called createHandler with following signature: createHandler(ttl: number, fetchFunc: FetchFunction): RequestHandler Where ttl is used as cache invalidation period, RequestHandler is function with request and response parameters and type FetchFunction is defined below as: type FetchFunction = (id: number) =&gt; Promise type FetchResult = { price: number; time: Date }[] When calling fetchFunc, parameter id must be a non-negative integer. Rest API Api requests can have query parameter id, which should have a non-negative integer value. If the id parameter is missing or it does not have a valid value, then return an error response. Api responses must use JSON format and should return appropriate status code. All responses must follow structure described below. Think of appropriate error scenarios and messages. Successful (2XX) response: Range exists: { &quot;success&quot;: true, &quot;error&quot;: null, &quot;result&quot;: { &quot;range&quot;: { &quot;start&quot;: &quot;ISO 8601&quot;, &quot;end&quot;: &quot;ISO 8601&quot; } } } Range does not exist: { &quot;success&quot;: true, &quot;error&quot;: null, &quot;result&quot;: { &quot;range&quot;: null } } Error (&gt;=400) response: { &quot;success&quot;: false, &quot;error&quot;: &quot;string&quot;, &quot;result&quot;: null } Examples Datasets Id 1: [{ &quot;price&quot;: 0, &quot;time&quot;: 2023-01-01 }] Id 2: [ { &quot;price&quot;: 1, &quot;time&quot;: 2023-01-01 }, { &quot;price&quot;: 0, &quot;time&quot;: 2023-01-02 }, { &quot;price&quot;: 1, &quot;time&quot;: 2023-01-03 } ] Calls GET ?id=abc Status code: 400 { &quot;success&quot;: false, &quot;error&quot;: &quot;Something went wrong&quot;, &quot;result&quot;: null } GET ?id=1 Status code: 200 { &quot;success&quot;: true, &quot;error&quot;: null, &quot;result&quot;: { &quot;range&quot;: null } } GET ?id=2 Status code: 200 { &quot;success&quot;: true, &quot;error&quot;: null, &quot;result&quot;: { &quot;range&quot;: { &quot;start&quot;: &quot;2023-01-01T00:00:00.000Z&quot;, &quot;end&quot;: &quot;2023-01-03T00:00:00.000Z&quot; } } } Server (Express.js) import express from &apos;express&apos;; import { createHandler } from &apos;cleo-assignment-handler&apos;; const ttl = 10000; async function fetchValues(id) { return [/* ... */]; } const app = express(); app.get(&apos;/api&apos;, createHandler(ttl, fetchValues)); app.listen(3000);</p>
