import { IncomingMessage, ServerResponse } from "http";

type FetchFunction = (id: number) => Promise<FetchResult>;
type FetchResult = { price: number; time: Date }[];

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

type CacheData = {
  success: boolean;
  error: String | null;
  result: {
    range: {
      start: Date;
      end: Date;
    } | null;
  };
};

type CacheItem = {
  data: CacheData;
  created: Date;
  statusCode: number;
};

const okStatusNoRange = {
  success: true,
  error: null,
  result: {
    range: null,
  },
};

const falseStatusWrongId = {
  success: false,
  error: "Something went wrong",
  result: null,
};

export default function createHandler(
  ttl: number,
  fetchFunc: FetchFunction
): RequestHandler {
  const cacheMap = new Map<number, CacheItem>();

  return async function (req: IncomingMessage, res: ServerResponse) {
    // Get the id parameter from the request
    const id = Number(req.url?.split("/").slice(-1)[0]);

    // check if parametr is positive integer
    if (!Number.isInteger(id) || id < 0) {
      sendResponse(200, JSON.stringify(falseStatusWrongId), res);
      return;
    }

    // check if exists in cache already
    if (cacheMap.has(id)) {
      console.log("Reading data from cache");
      if (isCacheValid(ttl, cacheMap.get(id))) {
        // return data from cache
        sendResponse(
          Number(cacheMap.get(id)?.statusCode),
          JSON.stringify(cacheMap.get(id)?.data),
          res
        );
        return;
      } else {
        console.log("Deleting invalid cache");
        cacheMap.delete(id);
      }
    }

    // get result from fetchFunc
    try {
      console.log("Calling api");
      const apiResult = await fetchFunc(id);

      // get only entries with price above avg price
      const resultsAboveAvgPrice = processRawData(apiResult);

      // return if there are no data left after filtering (all items with same price -> nothing is above average)
      if (resultsAboveAvgPrice.length === 0) {
        const newCache: CacheItem = {
          data: { ...okStatusNoRange },
          created: new Date(),
          statusCode: 200,
        };
        cacheMap.set(id, newCache);
        sendResponse(200, JSON.stringify(cacheMap.get(id)?.data), res);
        return;
      } else {
        // get lowest and highest times for resultRange
        const timesWithHighestGap =
          getTimesWithHighestGap(resultsAboveAvgPrice);
        const firstTime = timesWithHighestGap.lowTime;
        const highTime = timesWithHighestGap.highTime;

        // if lowest and highest times are the same, then no range, otherwise send result
        if (firstTime === highTime) {
          sendResponse(200, JSON.stringify(okStatusNoRange), res);
          return;
        } else {
          const newCache: CacheItem = {
            data: buildOkResponseWithRange(firstTime, highTime),
            created: new Date(),
            statusCode: 200,
          };
          cacheMap.set(id, newCache);
          sendResponse(200, JSON.stringify(newCache.data), res);
          return;
        }
      }
    } catch (error) {
      sendResponse(400, "No data received", res);
      return;
    }
  };
}

function buildOkResponseWithRange(lowTime: Date, highTime: Date) {
  return {
    success: true,
    error: null,
    result: {
      range: {
        start: lowTime,
        end: highTime,
      },
    },
  };
}

function sendResponse(statusCode: number, data: String, res: ServerResponse) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.write(data);
  res.end();
}

function getTimesWithHighestGap(resultsAboveAvg: FetchResult) {
  const sortedByDate = resultsAboveAvg.sort((a, b) => a.time.getTime() - b.time.getTime());
  let maxDiff = 0;
  let firstTime: Date = sortedByDate[0].time;
  let highTime: Date = sortedByDate[0].time;

  for (let i = 1; i < sortedByDate.length; i++) {
    const diff =
    sortedByDate[i].time.getTime() - sortedByDate[i - 1].time.getTime();
    if (diff > maxDiff) {
      maxDiff = diff;
      firstTime = sortedByDate[i - 1].time;
      highTime = sortedByDate[i].time;
    }
  }

  return {
    lowTime: firstTime,
    highTime: highTime,
  };
}

function processRawData(apiResult: FetchResult) {
  //get avg price
  const avgPrice =
    apiResult.reduce((acc, cur) => acc + cur.price, 0) / apiResult.length;

  // filter results from fetchFunch for only price above avg
  return apiResult.filter((item) => item.price > avgPrice);
}

function isCacheValid(miliSeconds: number, item?: CacheItem) {
  const miliSecondsAsDate = new Date(miliSeconds);
  const createdDate = item?.created ?? new Date(0);
  const expirationDate = new Date(
    createdDate.getTime() + miliSecondsAsDate.getTime()
  );
  if (expirationDate > new Date()) {
    return true;
  }
  return false;
}

export { createHandler };
