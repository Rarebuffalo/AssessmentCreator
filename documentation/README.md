# Developer Documentation

This directory contains technical documentation for the AI Assessment Creator project. The guides explain the architecture, implementation details, and engineering trade-offs of the system.

## Documentation Index

- [System Architecture](file:///home/Krishna-Singh/AssessmentCreator/documentation/architecture.md)
  - Overview of topology, microservices, databases, queue mechanisms, and end-to-end data pipeline.
- [Backend Implementation Details](file:///home/Krishna-Singh/AssessmentCreator/documentation/backend.md)
  - MongoDB Mongoose schema models, API REST endpoints list, AI prompt construction wrappers, and Puppeteer A4 PDF print layouts.
- [Frontend Implementation Details](file:///home/Krishna-Singh/AssessmentCreator/documentation/frontend.md)
  - Next.js folder layout structure, Zustand client store config, custom Socket.io-client hooks, form wizards, and progress modals.
- [Engineering Decisions & Logic](file:///home/Krishna-Singh/AssessmentCreator/documentation/decisions.md)
  - Rationale behind choices like Redis queues, Puppeteer rendering, WebSocket isolation, and JSON schema parsing safety steps.
