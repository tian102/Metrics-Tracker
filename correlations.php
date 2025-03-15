<?php
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();
?>

<div class="row mb-4">
    <div class="col-12">
        <div class="card shadow-sm">
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h2 class="mb-2 mb-md-0">Correlation Analysis</h2>
                <div class="d-flex flex-wrap gap-2">
                    <button id="analyzeNewBtn" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Start New Analysis
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Correlation Analyzer -->
    <div class="col-md-12 mb-4" id="correlationAnalyzer" style="display: none;">
        <div class="card shadow-sm">
            <div class="card-header">
                <h3 class="mb-0">Analyze New Correlation</h3>
            </div>
            <div class="card-body">
                <form id="correlationForm">
                    <div class="row">
                        <div class="col-md-5 mb-3">
                            <label for="primaryMetric" class="form-label">Primary Metric</label>
                            <select class="form-select" id="primaryMetric" required>
                                <option value="">Select Primary Metric</option>
                                <!-- Options will be loaded by JavaScript -->
                            </select>
                        </div>
                        
                        <div class="col-md-5 mb-3">
                            <label for="secondaryMetric" class="form-label">Secondary Metric</label>
                            <select class="form-select" id="secondaryMetric" required>
                                <option value="">Select Secondary Metric</option>
                                <!-- Options will be loaded by JavaScript -->
                            </select>
                        </div>
                        
                        <div class="col-md-2 mb-3">
                            <label class="form-label">Quick Analysis</label>
                            <div class="d-grid">
                                <button type="button" class="btn btn-outline-primary quick-analyze-btn" 
                                        data-primary="sleep_duration" data-secondary="training_volume">
                                    Sleep + Volume
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-5 mb-3">
                            <label for="startDate" class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="startDate" required 
                                value="<?php echo date('Y-m-d', strtotime('-30 days')); ?>">
                        </div>
                        
                        <div class="col-md-5 mb-3">
                            <label for="endDate" class="form-label">End Date</label>
                            <input type="date" class="form-control" id="endDate" required 
                                value="<?php echo date('Y-m-d'); ?>">
                        </div>
                        
                        <div class="col-md-2 mb-3">
                            <label class="form-label d-none d-md-block">&nbsp;</label>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">Analyze</button>
                                <button type="button" id="cancelAnalysisBtn" class="btn btn-outline-secondary">Cancel</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Analysis Results -->
    <div class="col-md-12 mb-4" id="analysisResults" style="display: none;">
        <div class="card shadow-sm">
            <div class="card-header">
                <h3 class="mb-0">Analysis Results</h3>
            </div>
            <div class="card-body">
                <!-- Results will be loaded by JavaScript -->
            </div>
        </div>
    </div>
    
    <!-- Recent Insights -->
    <div class="col-md-8 mb-4">
        <div class="card shadow-sm h-100">
            <div class="card-header">
                <h3 class="mb-0">Recent Insights</h3>
            </div>
            <div class="card-body" id="recentInsights">
                <!-- Recent insights will be loaded by JavaScript -->
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Featured Correlation -->
    <div class="col-md-4 mb-4">
        <div class="card shadow-sm h-100">
            <div class="card-header">
                <h3 class="mb-0">Featured Correlation</h3>
            </div>
            <div class="card-body" id="featuredCorrelation">
                <!-- Featured correlation will be loaded by JavaScript -->
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript -->
<script src="assets/js/correlations.js"></script>

<?php require_once 'includes/footer.php'; ?>