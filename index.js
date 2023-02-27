"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.createHandler = void 0;
var okStatusNoRange = {
    success: true,
    error: null,
    result: {
        range: null
    }
};
var falseStatusWrongId = {
    success: false,
    error: "Something went wrong",
    result: null
};
function createHandler(ttl, fetchFunc) {
    var cacheMap = new Map();
    return function (req, res) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var id, apiResult, resultsAboveAvgPrice, newCache, timesWithHighestGap, firstTime, highTime, newCache, error_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        id = Number((_a = req.url) === null || _a === void 0 ? void 0 : _a.split("/").slice(-1)[0]);
                        // check if parametr is positive integer
                        if (!Number.isInteger(id) || id < 0) {
                            sendResponse(200, JSON.stringify(falseStatusWrongId), res);
                            return [2 /*return*/];
                        }
                        // check if exists in cache already
                        if (cacheMap.has(id)) {
                            console.log("Reading data from cache");
                            if (isCacheValid(ttl, cacheMap.get(id))) {
                                // return data from cache
                                sendResponse(Number((_b = cacheMap.get(id)) === null || _b === void 0 ? void 0 : _b.statusCode), JSON.stringify((_c = cacheMap.get(id)) === null || _c === void 0 ? void 0 : _c.data), res);
                                return [2 /*return*/];
                            }
                            else {
                                console.log("Deleting invalid cache");
                                cacheMap["delete"](id);
                            }
                        }
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        console.log("Calling api");
                        return [4 /*yield*/, fetchFunc(id)];
                    case 2:
                        apiResult = _e.sent();
                        resultsAboveAvgPrice = processRawData(apiResult);
                        // return if there are no data left after filtering (all items with same price -> nothing is above average)
                        if (resultsAboveAvgPrice.length === 0) {
                            newCache = {
                                data: __assign({}, okStatusNoRange),
                                created: new Date(),
                                statusCode: 200
                            };
                            cacheMap.set(id, newCache);
                            sendResponse(200, JSON.stringify((_d = cacheMap.get(id)) === null || _d === void 0 ? void 0 : _d.data), res);
                            return [2 /*return*/];
                        }
                        else {
                            timesWithHighestGap = getTimesWithHighestGap(resultsAboveAvgPrice);
                            firstTime = timesWithHighestGap.lowTime;
                            highTime = timesWithHighestGap.highTime;
                            // if lowest and highest times are the same, then no range, otherwise send result
                            if (firstTime === highTime) {
                                sendResponse(200, JSON.stringify(okStatusNoRange), res);
                                return [2 /*return*/];
                            }
                            else {
                                newCache = {
                                    data: buildOkResponseWithRange(firstTime, highTime),
                                    created: new Date(),
                                    statusCode: 200
                                };
                                cacheMap.set(id, newCache);
                                sendResponse(200, JSON.stringify(newCache.data), res);
                                return [2 /*return*/];
                            }
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _e.sent();
                        sendResponse(400, "No data received", res);
                        return [2 /*return*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
}
exports["default"] = createHandler;
exports.createHandler = createHandler;
function buildOkResponseWithRange(lowTime, highTime) {
    return {
        success: true,
        error: null,
        result: {
            range: {
                start: lowTime,
                end: highTime
            }
        }
    };
}
function sendResponse(statusCode, data, res) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.write(data);
    res.end();
}
function getTimesWithHighestGap(resultsAboveAvg) {
    resultsAboveAvg.sort(function (a, b) { return a.time.getTime() - b.time.getTime(); });
    var maxDiff = 0;
    var firstTime = resultsAboveAvg[0].time;
    var highTime = resultsAboveAvg[0].time;
    for (var i = 1; i < resultsAboveAvg.length; i++) {
        var diff = resultsAboveAvg[i].time.getTime() - resultsAboveAvg[i - 1].time.getTime();
        if (diff > maxDiff) {
            maxDiff = diff;
            firstTime = resultsAboveAvg[i].time;
            highTime = resultsAboveAvg[i - 1].time;
        }
    }
    return {
        lowTime: firstTime,
        highTime: highTime
    };
    // let lowestTime = resultsAboveAvg[0].time;
    // let highestTime = resultsAboveAvg[0].time;
    // for (let i = 1; i < resultsAboveAvg.length; i++) {
    //   if (resultsAboveAvg[i].time.getTime() < lowestTime.getTime()) {
    //     lowestTime = resultsAboveAvg[i].time;
    //   }
    //   if (resultsAboveAvg[i].time.getTime() > highestTime.getTime()) {
    //     highestTime = resultsAboveAvg[i].time;
    //   }
    // }
}
function processRawData(apiResult) {
    //get avg price
    var avgPrice = apiResult.reduce(function (acc, cur) { return acc + cur.price; }, 0) / apiResult.length;
    // filter results from fetchFunch for only price above avg
    return apiResult.filter(function (item) { return item.price > avgPrice; });
}
function isCacheValid(miliSeconds, item) {
    var _a;
    var miliSecondsAsDate = new Date(miliSeconds);
    var createdDate = (_a = item === null || item === void 0 ? void 0 : item.created) !== null && _a !== void 0 ? _a : new Date(0);
    var expirationDate = new Date(createdDate.getTime() + miliSecondsAsDate.getTime());
    if (expirationDate > new Date()) {
        return true;
    }
    return false;
}
