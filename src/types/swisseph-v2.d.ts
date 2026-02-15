declare module 'swisseph-v2' {
    const swisseph: any
    export = swisseph
}
declare module '@hono/swagger-ui' {
  export function swaggerUI(options: { url: string }): any
}