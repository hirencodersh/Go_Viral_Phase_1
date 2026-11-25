
import express, { Application, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi";

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  "/api-docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: "Social Media Platform API - Swagger UI",
  })
);

app.get("/api-docs.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use("/api", apiRoutes);

app.get("/", (_req, res: Response) => {
  res.send("Welcome to Social Media Platform API");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
