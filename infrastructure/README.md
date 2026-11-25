# Infrastructure Setup for Social Media Platform

This document provides an overview of the infrastructure setup for the Social Media Platform project. It includes details on how to configure and deploy the application using Docker and Kubernetes.

## Docker Setup

### Client

1. Navigate to the `infrastructure/docker` directory.
2. Build the Docker image for the client:
   ```
   docker build -t social-media-platform-client -f Dockerfile .
   ```
3. Run the Docker container for the client:
   ```
   docker run -p 3000:3000 social-media-platform-client
   ```

### Server

1. Navigate to the `infrastructure/docker` directory.
2. Build the Docker image for the server:
   ```
   docker build -t social-media-platform-server -f server.Dockerfile .
   ```
3. Run the Docker container for the server:
   ```
   docker run -p 5000:5000 social-media-platform-server
   ```

## Kubernetes Deployment

1. Ensure you have a Kubernetes cluster set up and configured.
2. Navigate to the `infrastructure/kubernetes` directory.
3. Deploy the application using the provided `deployment.yaml` file:
   ```
   kubectl apply -f deployment.yaml
   ```

## Environment Variables

Make sure to configure the necessary environment variables for both the client and server applications. Refer to the `.env.example` files in the respective directories for guidance on required variables.

## Conclusion

This document serves as a guide for setting up the infrastructure for the Social Media Platform. For further details on specific configurations, refer to the respective Docker and Kubernetes documentation.