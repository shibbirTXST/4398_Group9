import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Habit Tracking API",
      version: "1.0.0",
      description: "API documentation for the Habit Tracking application",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            },
        },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;