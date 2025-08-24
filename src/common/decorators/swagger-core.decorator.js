const commonResponses = {
  200: { description: "Success" },
  400: { description: "Invalid input data" },
  401: { description: "Invalid login credentials or unauthorized" },
  500: { description: "Internal server error" },
};

/**
 * Creates a static Swagger JSDoc comment for POST endpoint
 * @param {string} path - The API path (e.g., "/register")
 * @param {string} summary - Summary of the endpoint function
 * @param {Object} schema - Schema for the request body
 * @returns {string} - Static JSDoc comment as a YAML string
 */
function ApiPost(path, summary, schema) {
  return `
    /**
     * @swagger
     * ${path}:
     *   post:
     *     summary: ${summary}
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: ${schema.type}
     *             properties:
     *               ${Object.entries(schema.properties)
                 .map(([key, value]) => `${key}:\n                  type: ${value.type}`)
                 .join("\n                ")}
     *             ${schema.required ? `required: [${schema.required.join(", ")}]` : ""}
     *     responses:
     *       200:
     *         description: ${commonResponses[200].description}
     *       400:
     *         description: ${commonResponses[400].description}
     *       401:
     *         description: ${commonResponses[401].description}
     *       500:
     *         description: ${commonResponses[500].description}
     * */
  `.trim();
}

module.exports = { ApiPost };