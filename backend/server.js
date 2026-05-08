require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const unitRoutes = require('./routes/units');
const pdfRoutes = require('./routes/pdf');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', unitRoutes);
app.use('/api', pdfRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AZMYA Invoice API is running', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 AZMYA Invoice API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
