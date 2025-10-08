export default () => ({
    app: {
        port: parseInt(process.env.PORT ?? '3000', 10),
        throttle_ttl: parseInt(process.env.THROTTLE_TTL ?? '60'),
        throttle_limit: parseInt(process.env.THROTTLE_LIMIT ?? '10'),
    },
});
