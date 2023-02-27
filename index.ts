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
      console.log("going to cache");
      if (isCacheValid(ttl, cacheMap.get(id))) {
        // return data from cache
        sendResponse(
          Number(cacheMap.get(id)?.statusCode),
          JSON.stringify(cacheMap.get(id)?.data),
          res
        );
        return;
      } else {
        console.log("deleting invalid cache");
        cacheMap.delete(id);
      }
    }

    // get result from fetchFunc
    console.log("calling api");
    try {
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
        const highLowTimes = getHighLowTimes(resultsAboveAvgPrice);
        const lowestTime = highLowTimes.lowestTime;
        const highestTime = highLowTimes.highestTimeL;

        // if lowest and highest times are the same, then no range, otherwise send result
        if (lowestTime === highestTime) {
          sendResponse(200, JSON.stringify(okStatusNoRange), res);
          return;
        } else {
          const newCache: CacheItem = {
            data: buildOkResponseWithRange(lowestTime, highestTime),
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

function buildOkResponseWithRange(lowestTime: Date, highestTime: Date) {
  return {
    success: true,
    error: null,
    result: {
      range: {
        start: lowestTime,
        end: highestTime,
      },
    },
  };
}

function sendResponse(statusCode: number, data: String, res: ServerResponse) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.write(data);
  res.end();
}

function getHighLowTimes(resultsAboveAvg: FetchResult) {
  let lowestTime = resultsAboveAvg[0].time;
  let highestTime = resultsAboveAvg[0].time;
  for (let i = 1; i < resultsAboveAvg.length; i++) {
    if (resultsAboveAvg[i].time.getTime() < lowestTime.getTime()) {
      lowestTime = resultsAboveAvg[i].time;
    }
    if (resultsAboveAvg[i].time.getTime() > highestTime.getTime()) {
      highestTime = resultsAboveAvg[i].time;
    }
  }
  return {
    lowestTime: lowestTime,
    highestTimeL: highestTime,
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
