import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface"

export const corsConfig: CorsOptions = {
  origin: 'http://localhost:3001',  // Allow requests from this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',  // Allow these HTTP methods
    allowedHeaders: 'Content-Type, Authorization',  // Specify allowed headers
    credentials: true,
}

