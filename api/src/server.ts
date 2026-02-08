import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import { PORT } from './config/constants';
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
    try {
        // Test database connection before starting server (optional)
        if (process.env.DATABASE_CONNECTION_STRING || process.env.DB_HOST) {
            await testConnection();
        } else {
            console.log('Database connection skipped (no DATABASE_CONNECTION_STRING or DB_HOST)');
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
