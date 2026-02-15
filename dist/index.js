import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { join } from 'path';
// 1. Load dependencies with top-level await
let swaggerUI = null;
try {
    const swui = await import('@hono/swagger-ui');
    swaggerUI = swui.swaggerUI;
}
catch (e) {
    console.warn('⚠️ @hono/swagger-ui not available, using basic HTML viewer');
}
let jyotish = null;
try {
    jyotish = await import('jyotish-calculations');
}
catch (e) {
    console.error('❌ jyotish-calculations not installed:', e.message);
}
let swisseph = null;
try {
    swisseph = await import('swisseph-v2');
    // Configure swisseph path if available
    const ephePath = join(process.cwd(), 'server/ephemeris');
    const asAny = swisseph;
    const setter = asAny.swe_set_ephe_path ||
        asAny.default?.swe_set_ephe_path ||
        asAny.set_ephe_path ||
        asAny.swe_set_ephemeris_path;
    if (typeof setter === 'function') {
        setter(ephePath);
        console.log('✅ swisseph ephemeris path set:', ephePath);
    }
    else {
        console.warn('⚠️ swisseph: no ephemeris-setter function found');
    }
}
catch (e) {
    console.warn('⚠️ swisseph-v2 not installed:', e.message);
}
const app = new Hono();
// 2. OpenAPI 3.1.0 Specification
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
                        content: { 'text/plain': { schema: { type: 'string', example: 'OK' } } }
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
            post: {
                summary: 'Calculate moon sign and planetary positions',
                tags: ['Rashi Calculation'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['dateTime', 'latitude', 'longitude'],
                                properties: {
                                    dateTime: { type: 'string', format: 'date-time', example: '2026-02-15T12:00:00Z' },
                                    latitude: { type: 'number', example: 21.1458 },
                                    longitude: { type: 'number', example: 79.0882 },
                                    timezone: { type: 'number', example: 5.5 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': { description: 'Calculation successful' },
                    '400': { description: 'Invalid parameters' },
                    '500': { description: 'Calculation error' },
                    '530': { description: 'Service unavailable' }
                }
            }
        }
    }
};
// 3. Routes
// Serve static files from /public
app.use('/*', serveStatic({ root: './public' }));
// Health & OpenAPI JSON
app.get('/', (c) => c.text('OK'));
app.get('/health', (c) => c.json({ status: 'healthy', modules: { jyotish: !!jyotish, swisseph: !!swisseph } }));
app.get('/openapi.json', (c) => c.json(openAPISpec));
// Geocoding API (using Nominatim)
app.post('/api/geocode', async (c) => {
    try {
        const { q, city, state, country, pincode } = await c.req.json();
        let queryString = '';
        let limit = 1;
        if (q) {
            queryString = encodeURIComponent(q);
            limit = 10; // Increase limit for better autocomplete options
        }
        else {
            const queryParts = [city, state, country, pincode].filter(Boolean);
            queryString = encodeURIComponent(queryParts.join(', '));
        }
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryString}&limit=${limit}`, {
            headers: { 'User-Agent': 'MoonSignApp/0.1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const results = data.map(item => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName: item.display_name,
                // Helper fields for UI
                name: item.name || item.display_name.split(',')[0],
                subtext: item.display_name.split(',').slice(1).join(',').trim()
            }));
            return c.json(limit === 1 ? results[0] : results, 200, CORS_HEADERS);
        }
        return c.json({ error: 'Location not found' }, 404, CORS_HEADERS);
    }
    catch (error) {
        console.error('Geocoding Error:', error);
        return c.json({ error: 'Geocoding failed' }, 500, CORS_HEADERS);
    }
});
// Swagger UI
if (swaggerUI) {
    app.get('/docs', swaggerUI({ url: '/openapi.json' }));
}
else {
    app.get('/docs', (c) => {
        return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Moonsign API - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/openapi.json",
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "StandaloneLayout"
    })
  </script>
</body>
</html>`);
    });
}
// CORS Helper
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};
// Rashi Calculation API
app.options('/api/rashi', (c) => new Response('', { status: 204, headers: CORS_HEADERS }));
app.post('/api/rashi', async (c) => {
    try {
        if (!jyotish?.default) {
            return c.json({ error: 'jyotish-calculations module not available' }, 503, CORS_HEADERS);
        }
        const { dateTime, latitude, longitude, timezone } = await c.req.json();
        if (!dateTime || latitude === undefined || longitude === undefined) {
            return c.json({ error: 'Missing required parameters' }, 400, CORS_HEADERS);
        }
        const date = new Date(dateTime);
        if (isNaN(date.getTime()))
            return c.json({ error: 'Invalid date format' }, 400, CORS_HEADERS);
        const lat = parseFloat(String(latitude));
        const lng = parseFloat(String(longitude));
        const tz = timezone !== undefined ? timezone : -date.getTimezoneOffset() / 60;
        const birthDetails = {
            dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            timeString: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`,
            lat,
            lng,
            timezone: tz
        };
        const planets = jyotish.default.grahas.getGrahasPosition(birthDetails);
        const moonLongitude = planets.Mo.longitude;
        const moonRashi = jyotish.default.rashis.getRashi(moonLongitude);
        return c.json({
            success: true,
            input: { dateTime: date.toISOString(), location: { lat, lng }, timezone: tz },
            moon: { longitude: moonLongitude, rashi: moonRashi },
            allPlanets: planets
        }, 200, CORS_HEADERS);
    }
    catch (error) {
        console.error('Calculation Error:', error);
        return c.json({ error: 'Failed to calculate rashi', message: error.message }, 500, CORS_HEADERS);
    }
});
// 4. Start Server
const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, (info) => {
    console.log(`🚀 Server ready at http://localhost:${info.port}`);
    console.log(`📖 Documentation: http://localhost:${info.port}/docs`);
});
//# sourceMappingURL=index.js.map