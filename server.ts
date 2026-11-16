
import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

import { getSampleDatasets } from './src/data/sampleDatasets';
import { parseAndCleanCsv } from './src/services/dataCleaner';
import { classifyDataset } from './src/services/columnDetector';
import {
  trainXGBoostPipeline,
  predictCropYield,
  TrainedModelResult
} from './src/services/xgboostEngine';
import {
  generateAgriculturalAnalysis,
  compareAgriculturalDatasets
} from './src/services/agriculturalInsights';

// ------------------------------------------
// Supabase Configuration
// ------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env file'
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------
// Start Express Server
// ------------------------------------------

async function startServer() {
  const app = express();
  const PORT = process.env.PORT
    ? parseInt(process.env.PORT)
    : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({
    limit: '50mb',
    extended: true
  }));

  // In-memory model cache for active session
  let currentActiveModel: TrainedModelResult | null = null;

  // ------------------------------------------
  // 1. General Health Check
  // ------------------------------------------

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      framework: 'CropYield AI XGBoost Engine',
      timestamp: new Date().toISOString()
    });
  });

  // ------------------------------------------
  // 2. Supabase Connection Health Check
  // ------------------------------------------

  app.get('/api/supabase-health', async (_req, res) => {
    try {
      const { data, error } =
        await supabase.storage.listBuckets();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        connected: true,
        bucketCount: data.length,
        message: 'Supabase connected successfully'
      });

    } catch (error) {
      console.error('Supabase connection error:', error);

      res.status(503).json({
        success: false,
        connected: false,
        message: 'Supabase connection failed. Check server configuration.'
      });
    }
  });

  // ------------------------------------------
  // 3. Sample Benchmark Datasets List
  // ------------------------------------------

  app.get('/api/sample-datasets', (_req, res) => {
    try {
      const datasets = getSampleDatasets();

      const metadataList = datasets.map(d => ({
        id: d.id,
        name: d.name,
        filename: d.filename,
        category: d.category,
        description: d.description,
        hasYieldTarget: d.hasYieldTarget,
        targetColumn: d.targetColumn,
        recordsCount: d.recordsCount,
        featuredColumns: d.featuredColumns
      }));

      res.json({
        success: true,
        datasets: metadataList
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // ------------------------------------------
  // 4. Get Single Sample Dataset CSV
  // ------------------------------------------

  app.get('/api/sample-datasets/:id', (req, res) => {
    try {
      const datasets = getSampleDatasets();

      const match = datasets.find(
        d => d.id === req.params.id
      );

      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found'
        });
      }

      res.setHeader('Content-Type', 'text/csv');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${match.filename}"`
      );

      res.send(match.csvData);

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // ------------------------------------------
  // 5. Upload and Process CSV
  // ------------------------------------------

  app.post('/api/upload-and-process', (req, res) => {
    try {
      const { csvText, filename } = req.body;

      if (!csvText || typeof csvText !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid csvText in request body.'
        });
      }

      const cleaned = parseAndCleanCsv(csvText);

      const classification = classifyDataset(
        cleaned.columns
      );

      const analysis = generateAgriculturalAnalysis(
        cleaned.rows,
        cleaned.columns
      );

      let modelResult = null;

      if (
        classification.hasYieldTarget &&
        classification.targetColumn
      ) {
        modelResult = trainXGBoostPipeline(
          cleaned.rows,
          classification.targetColumn
        );

        if (modelResult.isTrained) {
          currentActiveModel = modelResult;
        }
      }

      res.json({
        success: true,
        filename: filename || 'agricultural_dataset.csv',
        cleaned,
        classification,
        analysis,
        modelResult
      });

    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });

  // ------------------------------------------
  // 6. Train XGBoost Model
  // ------------------------------------------

  app.post('/api/train-model', (req, res) => {
    try {
      const {
        rows,
        targetColumn,
        selectedFeatures,
        hyperparameters
      } = req.body;

      if (
        !rows ||
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: 'Valid dataset rows required.'
        });
      }

      const result = trainXGBoostPipeline(
        rows,
        targetColumn,
        selectedFeatures,
        hyperparameters
      );

      if (result.isTrained) {
        currentActiveModel = result;
      }

      res.json({
        success: true,
        result
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // ------------------------------------------
  // 7. Predict Crop Yield
  // ------------------------------------------

  app.post('/api/predict', (req, res) => {
    try {
      const { inputs, model } = req.body;

      const activeModel = model || currentActiveModel;

      if (
        !activeModel ||
        !activeModel.isTrained
      ) {
        return res.status(400).json({
          success: false,
          error: 'No active trained XGBoost model found. Please train a model first using a dataset with numerical yield.'
        });
      }

      const prediction = predictCropYield(
        activeModel,
        inputs || {}
      );

      res.json({
        success: true,
        prediction
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // ------------------------------------------
  // 8. Compare Two Datasets
  // ------------------------------------------

  app.post('/api/compare-datasets', (req, res) => {
    try {
      const { datasetA, datasetB } = req.body;

      if (!datasetA || !datasetB) {
        return res.status(400).json({
          success: false,
          error: 'Both datasetA and datasetB are required.'
        });
      }

      const comparison = compareAgriculturalDatasets(
        datasetA,
        datasetB
      );

      res.json({
        success: true,
        comparison
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // ------------------------------------------
  // Vite Development Middleware
  // ------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);

  } else {
    app.use(express.static(
      path.join(__dirname, 'dist')
    ));

    app.get('*', (_req, res) => {
      res.sendFile(
        path.join(__dirname, 'dist', 'index.html')
      );
    });
  }

  // ------------------------------------------
  // Start Server
  // ------------------------------------------

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `CropYield AI server running at http://localhost:${PORT}`
    );

    console.log('Supabase client initialized.');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
