import { Hono } from 'hono';
import { serve } from '@hono/node-server';
// Try to import swagger-ui if available; fall back to plain HTML viewer
let swaggerUI = null;
// Import jyotish and swisseph only if available; graceful fallback for testing
let jyotish = null;
let swisseph = null;
const app = new Hono();
// OpenAPI 3.1.0 Specification
const openAPISpec = {
    openapi: '3.1.0',
    info: {
        title: 'Moon Sign (Rashi) API',
        description: 'Calculate moon sign (rashi) and planetary positions based on birth details',
        version: '0.1.0',
        contact: {
            name: 'Vedic Secrets',
            url: 'https://vedicsecrets.in'
        }
    },
    servers: [
        {
            url: `http://localhost:${Number(process.env.PORT) || 3000}`,
            description: 'Development server'
        }
    ],
    paths: {
        '/': {
            get: {
                summary: 'Health check',
                tags: ['Health'],
                responses: {
                    '200': {
                        description: 'Service is OK',
                        content: {
                            'text/plain': {
                                schema: { type: 'string', example: 'OK' }
                            }
                        }
                    }
                }
            }
        },
        '/health': {
            get: {
                summary: 'Detailed health status',
                tags: ['Health'],
                responses: {
                    '200': {
                        description: 'Server health and module availability',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'healthy' },
                                        modules: {
                                            type: 'object',
                                            properties: {
                                                jyotish: { type: 'boolean' },
                                                swisseph: { type: 'boolean' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/rashi': {
            options: {
                summary: 'CORS preflight',
                tags: ['Rashi Calculation'],
                responses: {
                    '200': {
                        description: 'Preflight OK'
                    }
                }
            },
            post: {
                summary: 'Calculate moon sign and planetary positions',
                tags: ['Rashi Calculation'],
                description: 'Calculate the moon sign (rashi) and all planetary positions based on birth details',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['dateTime', 'latitude', 'longitude'],
                                properties: {
                                    dateTime: {
                                        type: 'string',
                                        format: 'date-time',
                                        description: 'Birth date and time in ISO 8601 format',
                                        example: '2026-02-15T12:00:00Z'
                                    },
                                    latitude: {
                                        type: 'number',
                                        description: 'Birth location latitude (-90 to 90)',
                                        example: 21.1458
                                    },
                                    longitude: {
                                        type: 'number',
                                        description: 'Birth location longitude (-180 to 180)',
                                        example: 79.0882
                                    },
                                    timezone: {
                                        type: 'number',
                                        description: 'Timezone offset in hours (optional, auto-detected if not provided)',
                                        example: 5.5
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Rashi calculation successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        input: {
                                            type: 'object',
                                            properties: {
                                                dateTime: { type: 'string', format: 'date-time' },
                                                location: {
                                                    type: 'object',
                                                    properties: {
                                                        lat: { type: 'number' },
                                                        lng: { type: 'number' }
                                                    }
                                                },
                                                timezone: { type: 'number' }
                                            }
                                        },
                                        moon: {
                                            type: 'object',
                                            properties: {
                                                longitude: { type: 'number', description: 'Moon longitude in degrees' },
                                                rashi: { type: 'string', description: 'Moon sign (Rashi)' }
                                            }
                                        },
                                        allPlanets: { type: 'object', description: 'All planetary positions' }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Bad request - invalid parameters',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '500': {
                        description: 'Server error during calculation',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '503': {
                        description: 'Service unavailable - required module not installed',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Health',
            description: 'Health check endpoints'
        },
        {
            name: 'Rashi Calculation',
            description: 'Moon sign and planetary position calculations'
        }
    ]
};
// Mount Swagger UI using @hono/swagger-ui if available, else fallback to HTML viewer
if (swaggerUI) {
    app.get('/docs', swaggerUI({ url: '/openapi.json' }));
}
else {
    // Basic HTML Swagger UI fallback
    app.get('/docs', (c) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Moonsign API - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/openapi.json",
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: "StandaloneLayout"
    })
  </script>
</body>
</html>`;
        return c.html(html);
    });
}
// OpenAPI JSON endpoint
app.get('/openapi.json', (c) => c.json(openAPISpec));
// Health check routes
app.get('/', (c) => c.text('OK'));
app.get('/health', (c) => c.json({ status: 'healthy', modules: { jyotish: !!jyotish, swisseph: !!swisseph } }));
// Configure swisseph path if available
if (swisseph) {
    const { join } = (await import('path'));
    const ephePath = join(process.cwd(), 'server/ephemeris');
    const asAny = swisseph;
    let setter;
    if (typeof asAny.swe_set_ephe_path === 'function')
        setter = asAny.swe_set_ephe_path;
    else if (typeof asAny.default?.swe_set_ephe_path === 'function')
        setter = asAny.default.swe_set_ephe_path;
    else if (typeof asAny.set_ephe_path === 'function')
        setter = asAny.set_ephe_path;
    else if (typeof asAny.swe_set_ephemeris_path === 'function')
        setter = asAny.swe_set_ephemeris_path;
    if (setter) {
        try {
            setter(ephePath);
            console.log('✓ swisseph ephemeris path set:', ephePath);
        }
        catch (e) {
            console.warn('swisseph set path failed:', e);
        }
    }
    else {
        console.warn('swisseph: no ephemeris-setter function found');
    }
}
// CORS headers
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};
// Preflight handler
app.options('/api/rashi', (c) => {
    return new Response('', { status: 200, headers: CORS_HEADERS });
});
// Calculate rashi (moon sign) and planetary positions
app.post('/api/rashi', async (c) => {
    try {
        if (!jyotish) {
            return new Response(JSON.stringify({ error: 'jyotish-calculations module not available' }), { status: 503, headers: CORS_HEADERS });
        }
        const body = await c.req.json();
        const { dateTime, latitude, longitude, timezone } = body || {};
        if (!dateTime || latitude === undefined || longitude === undefined) {
            return new Response(JSON.stringify({ error: 'Missing required parameters: dateTime, latitude, longitude' }), { status: 400, headers: CORS_HEADERS });
        }
        const date = new Date(dateTime);
        if (isNaN(date.getTime())) {
            return new Response(JSON.stringify({ error: 'Invalid date format' }), { status: 400, headers: CORS_HEADERS });
        }
        const lat = parseFloat(String(latitude));
        const lng = parseFloat(String(longitude));
        if (isNaN(lat) || isNaN(lng)) {
            return new Response(JSON.stringify({ error: 'Invalid latitude or longitude' }), { status: 400, headers: CORS_HEADERS });
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        const timeString = `${hours}:${minutes}:${seconds}`;
        const tz = timezone !== undefined ? timezone : -date.getTimezoneOffset() / 60;
        const birthDetails = {
            dateString,
            timeString,
            lat,
            lng,
            timezone: tz
        };
        const planets = jyotish.default.grahas.getGrahasPosition(birthDetails);
        const moonLongitude = planets.Mo.longitude;
        const moonRashi = jyotish.default.rashis.getRashi(moonLongitude);
        return new Response(JSON.stringify({
            success: true,
            input: {
                dateTime: date.toISOString(),
                location: { lat, lng },
                timezone: tz
            },
            moon: {
                longitude: moonLongitude,
                rashi: moonRashi
            },
            allPlanets: planets
        }), { status: 200, headers: CORS_HEADERS });
    }
    catch (error) {
        console.error('Error calculating rashi:', error);
        const msg = (error && error.message) || String(error);
        return new Response(JSON.stringify({ error: 'Failed to calculate rashi', message: msg }), { status: 500, headers: CORS_HEADERS });
    }
});
serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3000
}, (info) => {
    console.log(`🚀 Hono server running at http://localhost:${info.port}`);
});
(async () => {
    try {
        const swui = await import('@hono/swagger-ui');
        swaggerUI = swui.swaggerUI;
    }
    catch (e) {
        console.warn('@hono/swagger-ui not available, using basic HTML viewer');
    }
    try {
        jyotish = await import('jyotish-calculations');
    }
    catch (e) {
        console.warn('jyotish-calculations not installed:', e.message);
    }
    try {
        swisseph = await import('swisseph-v2');
    }
    catch (e) {
        console.warn('swisseph-v2 not installed:', e.message);
    }
})();
//# sourceMappingURL=index.js.map