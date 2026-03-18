import express from 'express';
import cors from 'cors';

// import leaveRoutes from './modules/leave/leave.route.js';

const app = express();

app.use(cors());
app.use(express.json());

// app.use('/api/leave', leaveRoutes);

export default app;