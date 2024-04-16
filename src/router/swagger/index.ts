import fs from "fs";
import swaggerJSDoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

/* Swagger definition */
const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      /* API information (required) */
      title: "GH Scrum Poker", /* Title (required) */
      version: "1.0.0", /* Version (required) */
      description: "Node Webserver HTTP API", /* Description (optional) */
    },
    host: `http://${host}:${port}`, /* Host (optional) */
    /* basePath: "/", // Base path (optional) */
  };

export const swaggerOptions = {
    swaggerDefinition,
    apis: ["./src/router/*.ts", "./src/router/*.*.ts", "./src/router/swagger/*.yaml"],
};

/* stored JSON variable to serve on local node endpoint */
// export const openapiSpecification = swaggerJSDoc(options);

export const writeSpecFile = (_options: typeof swaggerOptions): object => {
    const openapiSpecification = swaggerJSDoc(_options);
    /* stored JSON file to pass to 3rd party OpenAPI-Spec renderer */
    fs.writeFile(
        "openapi-spec.json",
        JSON.stringify(openapiSpecification, null, 2), (err) => {
            if (err) {
                console.error("Error writing OpenAPI Specification JSON file: ", err);
            } else {
                console.log("OpenAPI Specification JSON file written successfully!");
            }
        }
    );

    return openapiSpecification;
};

writeSpecFile(swaggerOptions);

/**
 * @example swagger/openAPI reference docs
 * [setup options](https://www.npmjs.com/package/swagger-jsdoc)
 * [example yaml](https://github.com/Surnet/swagger-jsdoc/blob/master/examples/app/parameters.yaml)
 * [example api routes](https://github.com/Surnet/swagger-jsdoc/blob/master/examples/app/routes.js)
 * [swagger-spec blog](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md)
 */
