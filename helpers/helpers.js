
// ------------------------------------------------------------
// HELPER FUNCTION
// ------------------------------------------------------------
// Helper function to handle API responses
function handleResponse(
    res,
    err,
    data,
    notFoundStatusCode = 404,
    notFoundMessage = "Not found",
    changes = null
  ) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!data && !changes) {
      res.status(notFoundStatusCode).json({ error: notFoundMessage });
      return;
    }
    res.json(data);
  }
  module.exports = { handleResponse };