"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var hono_1 = require("hono");
var node_server_1 = require("@hono/node-server");
var jyotish_calculations_1 = require("jyotish-calculations");
var swisseph = require("swisseph-v2");
var path = require("path");
var app = new hono_1.Hono();
// Swiss Ephemeris needs a real FS path for ephemeris files
try {
    swisseph.swe_set_ephe_path(path.join(process.cwd(), 'server/ephemeris'));
}
catch (e) {
    // Log but continue; installation or ephemeris files may be missing
    console.warn('swisseph set path failed:', e);
}
// Optional panchang endpoint (kept commented until ephemeris files are present)
/*
app.get('/api/panchang', async (c) => {
    const data = await jyotish.getPanchang({
        date: new Date(),
        latitude: 21.1458,
        longitude: 79.0882,
        timezone: 5.5
    })
    return c.json(data)
})
*/
// CORS headers
var CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};
// Preflight handler
app.options('/api/rashi', function (c) {
    return new Response('', { status: 200, headers: CORS_HEADERS });
});
// Calculate rashi (moon sign) and planetary positions
app.post('/api/rashi', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, _a, dateTime, latitude, longitude, timezone, date, lat, lng, year, month, day, hours, minutes, seconds, dateString, timeString, tz, birthDetails, planets, moonLongitude, moonRashi, error_1, msg;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                body = _b.sent();
                _a = body || {}, dateTime = _a.dateTime, latitude = _a.latitude, longitude = _a.longitude, timezone = _a.timezone;
                if (!dateTime || latitude === undefined || longitude === undefined) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing required parameters: dateTime, latitude, longitude' }), { status: 400, headers: CORS_HEADERS })];
                }
                date = new Date(dateTime);
                if (isNaN(date.getTime())) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Invalid date format' }), { status: 400, headers: CORS_HEADERS })];
                }
                lat = parseFloat(String(latitude));
                lng = parseFloat(String(longitude));
                if (isNaN(lat) || isNaN(lng)) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Invalid latitude or longitude' }), { status: 400, headers: CORS_HEADERS })];
                }
                year = date.getFullYear();
                month = String(date.getMonth() + 1).padStart(2, '0');
                day = String(date.getDate()).padStart(2, '0');
                hours = String(date.getHours()).padStart(2, '0');
                minutes = String(date.getMinutes()).padStart(2, '0');
                seconds = String(date.getSeconds()).padStart(2, '0');
                dateString = "".concat(year, "-").concat(month, "-").concat(day);
                timeString = "".concat(hours, ":").concat(minutes, ":").concat(seconds);
                tz = timezone !== undefined ? timezone : -date.getTimezoneOffset() / 60;
                birthDetails = {
                    dateString: dateString,
                    timeString: timeString,
                    lat: lat,
                    lng: lng,
                    timezone: tz
                };
                planets = jyotish_calculations_1.default.grahas.getGrahasPosition(birthDetails);
                moonLongitude = planets.Mo.longitude;
                moonRashi = jyotish_calculations_1.default.rashis.getRashi(moonLongitude);
                return [2 /*return*/, new Response(JSON.stringify({
                        success: true,
                        input: {
                            dateTime: date.toISOString(),
                            location: { lat: lat, lng: lng },
                            timezone: tz
                        },
                        moon: {
                            longitude: moonLongitude,
                            rashi: moonRashi
                        },
                        allPlanets: planets
                    }), { status: 200, headers: CORS_HEADERS })];
            case 2:
                error_1 = _b.sent();
                console.error('Error calculating rashi:', error_1);
                msg = (error_1 && error_1.message) || String(error_1);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Failed to calculate rashi', message: msg }), { status: 500, headers: CORS_HEADERS })];
            case 3: return [2 /*return*/];
        }
    });
}); });
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3000
});
