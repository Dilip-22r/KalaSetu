// ─── Global error handler ─────────────────────────────────────────────────────
// Mount LAST in server.js via: app.use(errorHandler)
// Catches any unhandled errors passed via next(err)
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  const status = err.status || err.statusCode || 500;

  console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${err.message}`);

  res.status(status).json({
    message: isDev ? err.message : "An internal error occurred. Please try again.",
  });
};

export default errorHandler;
