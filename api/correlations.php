<?php
require_once '../includes/functions.php';
require_once '../includes/user_functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('HTTP/1.1 401 Unauthorized');
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Get current user ID
$userId = $_SESSION['user_id'];

// Set headers for JSON response
header('Content-Type: application/json');

// Check request method
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get correlations for the user
        if (isset($_GET['action']) && $_GET['action'] === 'analyze') {
            analyzeCorrelations($userId);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'insights') {
            getCorrelationInsights($userId);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'metrics') {
            getAvailableMetrics($userId);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        break;
        
    case 'POST':
        // Save user preferences for correlations
        echo json_encode(['success' => false, 'message' => 'Not implemented yet']);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}

/**
 * Get saved correlation insights for a user
 * @param int $userId User ID
 */
function getCorrelationInsights($userId) {
    $db = new Database();
    
    $db->query("SELECT * FROM correlation_insights 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC");
    $db->bind(':user_id', $userId);
    
    $insights = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $insights]);
}

/**
 * Get available metrics for correlation analysis
 * @param int $userId User ID
 */
function getAvailableMetrics($userId) {
    // Define available metrics for correlation analysis
    $metrics = [
        [
            'id' => 'sleep_duration',
            'name' => 'Sleep Duration',
            'category' => 'daily',
            'description' => 'How many hours of sleep you got'
        ],
        [
            'id' => 'energy_level',
            'name' => 'Energy Level',
            'category' => 'daily',
            'description' => 'Your reported energy level (1-10)'
        ],
        [
            'id' => 'stress_level',
            'name' => 'Stress Level',
            'category' => 'daily',
            'description' => 'Your reported stress level (1-10)'
        ],
        [
            'id' => 'motivation_level',
            'name' => 'Motivation Level',
            'category' => 'daily',
            'description' => 'Your reported motivation level (1-10)'
        ],
        [
            'id' => 'weight',
            'name' => 'Body Weight',
            'category' => 'daily',
            'description' => 'Your body weight measurement'
        ],
        [
            'id' => 'calories',
            'name' => 'Calorie Intake',
            'category' => 'daily',
            'description' => 'Your total calorie intake for the day'
        ],
        [
            'id' => 'protein',
            'name' => 'Protein Intake',
            'category' => 'daily',
            'description' => 'Your protein intake in grams'
        ],
        [
            'id' => 'carbs',
            'name' => 'Carb Intake',
            'category' => 'daily',
            'description' => 'Your carbohydrate intake in grams'
        ],
        [
            'id' => 'fats',
            'name' => 'Fat Intake',
            'category' => 'daily',
            'description' => 'Your fat intake in grams'
        ],
        [
            'id' => 'water_intake',
            'name' => 'Water Intake',
            'category' => 'daily',
            'description' => 'Your water intake in liters'
        ],
        [
            'id' => 'training_volume',
            'name' => 'Training Volume',
            'category' => 'training',
            'description' => 'Total weight lifted (sets × reps × weight)'
        ],
        [
            'id' => 'training_duration',
            'name' => 'Training Duration',
            'category' => 'training',
            'description' => 'How long your workout lasted'
        ],
        [
            'id' => 'exercise_load',
            'name' => 'Exercise Load',
            'category' => 'training',
            'description' => 'Average weight used for exercises'
        ],
        [
            'id' => 'stimulus_rating',
            'name' => 'Stimulus Rating',
            'category' => 'training',
            'description' => 'Your reported stimulus from workouts (1-10)'
        ],
        [
            'id' => 'fatigue_rating',
            'name' => 'Fatigue Rating',
            'category' => 'training',
            'description' => 'Your reported fatigue from workouts (1-10)'
        ]
    ];
    
    echo json_encode(['success' => true, 'data' => $metrics]);
}

/**
 * Analyze correlations between different metrics
 * @param int $userId User ID
 */
function analyzeCorrelations($userId) {
    // Define parameters for analysis
    $primaryMetric = isset($_GET['primary_metric']) ? $_GET['primary_metric'] : null;
    $secondaryMetric = isset($_GET['secondary_metric']) ? $_GET['secondary_metric'] : null;
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    
    // Validate parameters
    if (!$primaryMetric || !$secondaryMetric) {
        echo json_encode(['success' => false, 'message' => 'Primary and secondary metrics are required']);
        exit;
    }
    
    if (!validateDate($startDate) || !validateDate($endDate)) {
        echo json_encode(['success' => false, 'message' => 'Invalid date range']);
        exit;
    }
    
    // Get data based on the metrics
    $data = getCorrelationData($userId, $primaryMetric, $secondaryMetric, $startDate, $endDate);
    
    if (count($data) < 5) {
        echo json_encode([
            'success' => false, 
            'message' => 'Not enough data points for correlation analysis. Need at least 5 data points.'
        ]);
        exit;
    }
    
    // Calculate correlation
    $correlationResults = calculateCorrelation($data, $primaryMetric, $secondaryMetric);
    
    // Generate insight text
    $insight = generateInsightText(
        $correlationResults['correlation'], 
        $primaryMetric, 
        $secondaryMetric, 
        $correlationResults['primary_avg'],
        $correlationResults['secondary_avg']
    );
    
    // Save insight to database
    saveCorrelationInsight(
        $userId, 
        $primaryMetric, 
        $secondaryMetric, 
        $correlationResults['correlation'],
        $correlationResults['strength'],
        $correlationResults['direction'],
        $insight,
        $startDate,
        $endDate,
        count($data)
    );
    
    // Return results
    echo json_encode([
        'success' => true,
        'data' => [
            'correlation' => $correlationResults['correlation'],
            'correlation_strength' => $correlationResults['strength'],
            'direction' => $correlationResults['direction'],
            'insight' => $insight,
            'chart_data' => $data,
            'data_points' => count($data),
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]
    ]);
}

/**
 * Get data for correlation analysis
 * @param int $userId User ID
 * @param string $primaryMetric Primary metric ID
 * @param string $secondaryMetric Secondary metric ID
 * @param string $startDate Start date (YYYY-MM-DD)
 * @param string $endDate End date (YYYY-MM-DD)
 * @return array Array of data points with both metrics
 */
function getCorrelationData($userId, $primaryMetric, $secondaryMetric, $startDate, $endDate) {
    $db = new Database();
    $data = [];
    
    // Classify metrics
    $dailyMetrics = ['sleep_duration', 'energy_level', 'stress_level', 'motivation_level', 
                    'weight', 'calories', 'protein', 'carbs', 'fats', 'water_intake'];
    
    $trainingMetrics = ['training_volume', 'training_duration', 'exercise_load', 
                        'stimulus_rating', 'fatigue_rating'];
    
    // Get data based on metric categories
    if (in_array($primaryMetric, $dailyMetrics) && in_array($secondaryMetric, $dailyMetrics)) {
        // Both metrics are daily metrics
        $query = "SELECT date, ";
        
        // Add primary metric
        if ($primaryMetric === 'sleep_duration') {
            $query .= "TIMESTAMPDIFF(HOUR, sleep_start, sleep_end) as primary_value, ";
        } else {
            $query .= "$primaryMetric as primary_value, ";
        }
        
        // Add secondary metric
        if ($secondaryMetric === 'sleep_duration') {
            $query .= "TIMESTAMPDIFF(HOUR, sleep_start, sleep_end) as secondary_value ";
        } else {
            $query .= "$secondaryMetric as secondary_value ";
        }
        
        $query .= "FROM daily_metrics 
                  WHERE user_id = :user_id 
                  AND date BETWEEN :start_date AND :end_date
                  AND (";
        
        // Primary metric check
        if ($primaryMetric === 'sleep_duration') {
            $query .= "(sleep_start IS NOT NULL AND sleep_end IS NOT NULL)";
        } else {
            $query .= "$primaryMetric IS NOT NULL";
        }
        
        $query .= " AND ";
        
        // Secondary metric check
        if ($secondaryMetric === 'sleep_duration') {
            $query .= "(sleep_start IS NOT NULL AND sleep_end IS NOT NULL)";
        } else {
            $query .= "$secondaryMetric IS NOT NULL";
        }
        
        $query .= ") ORDER BY date";
        
        $db->query($query);
        $db->bind(':user_id', $userId);
        $db->bind(':start_date', $startDate);
        $db->bind(':end_date', $endDate);
        
        $data = $db->resultSet();
    } elseif (in_array($primaryMetric, $trainingMetrics) && in_array($secondaryMetric, $trainingMetrics)) {
        // Both metrics are training metrics
        // Query logic for getting training metrics
        // This would be more complex since they're spread across multiple tables
        // Simplified version for now
        $query = "SELECT t.date, ";
        
        // Add primary metric calculation
        switch ($primaryMetric) {
            case 'training_volume':
                $query .= "SUM(w.sets * w.reps * w.load_weight) as primary_value, ";
                break;
            case 'training_duration':
                $query .= "TIMESTAMPDIFF(MINUTE, t.training_start, t.training_end) as primary_value, ";
                break;
            case 'exercise_load':
                $query .= "AVG(w.load_weight) as primary_value, ";
                break;
            case 'stimulus_rating':
                $query .= "AVG(w.stimulus) as primary_value, ";
                break;
            case 'fatigue_rating':
                $query .= "AVG(w.fatigue_level) as primary_value, ";
                break;
        }
        
        // Add secondary metric calculation
        switch ($secondaryMetric) {
            case 'training_volume':
                $query .= "SUM(w.sets * w.reps * w.load_weight) as secondary_value ";
                break;
            case 'training_duration':
                $query .= "TIMESTAMPDIFF(MINUTE, t.training_start, t.training_end) as secondary_value ";
                break;
            case 'exercise_load':
                $query .= "AVG(w.load_weight) as secondary_value ";
                break;
            case 'stimulus_rating':
                $query .= "AVG(w.stimulus) as secondary_value ";
                break;
            case 'fatigue_rating':
                $query .= "AVG(w.fatigue_level) as secondary_value ";
                break;
        }
        
        $query .= "FROM training_sessions t
                  JOIN workout_details w ON t.id = w.session_id
                  WHERE t.user_id = :user_id 
                  AND t.date BETWEEN :start_date AND :end_date
                  AND t.training_start IS NOT NULL
                  AND t.training_end IS NOT NULL";
                  
        // Add specific conditions for primary metric
        switch ($primaryMetric) {
            case 'exercise_load':
                $query .= " AND w.load_weight IS NOT NULL";
                break;
            case 'stimulus_rating':
                $query .= " AND w.stimulus IS NOT NULL";
                break;
            case 'fatigue_rating':
                $query .= " AND w.fatigue_level IS NOT NULL";
                break;
        }
        
        // Add specific conditions for secondary metric
        switch ($secondaryMetric) {
            case 'exercise_load':
                $query .= " AND w.load_weight IS NOT NULL";
                break;
            case 'stimulus_rating':
                $query .= " AND w.stimulus IS NOT NULL";
                break;
            case 'fatigue_rating':
                $query .= " AND w.fatigue_level IS NOT NULL";
                break;
        }
        
        $query .= " GROUP BY t.date ORDER BY t.date";
        
        $db->query($query);
        $db->bind(':user_id', $userId);
        $db->bind(':start_date', $startDate);
        $db->bind(':end_date', $endDate);
        
        $data = $db->resultSet();
    } else {
        // Cross-category analysis (daily vs training)
        // This is more complex as we need to join different tables
        // For now, we'll get data from each category separately and merge by date
        
        // Get daily metrics data
        $dailyMetricName = in_array($primaryMetric, $dailyMetrics) ? $primaryMetric : $secondaryMetric;
        $dailyMetricKey = in_array($primaryMetric, $dailyMetrics) ? 'primary_value' : 'secondary_value';
        
        $query = "SELECT date, ";
        
        if ($dailyMetricName === 'sleep_duration') {
            $query .= "TIMESTAMPDIFF(HOUR, sleep_start, sleep_end) as $dailyMetricKey ";
        } else {
            $query .= "$dailyMetricName as $dailyMetricKey ";
        }
        
        $query .= "FROM daily_metrics 
                  WHERE user_id = :user_id 
                  AND date BETWEEN :start_date AND :end_date
                  AND ";
        
        if ($dailyMetricName === 'sleep_duration') {
            $query .= "(sleep_start IS NOT NULL AND sleep_end IS NOT NULL)";
        } else {
            $query .= "$dailyMetricName IS NOT NULL";
        }
        
        $query .= " ORDER BY date";
        
        $db->query($query);
        $db->bind(':user_id', $userId);
        $db->bind(':start_date', $startDate);
        $db->bind(':end_date', $endDate);
        
        $dailyData = $db->resultSet();
        $dailyDataByDate = [];
        
        foreach ($dailyData as $row) {
            $dailyDataByDate[$row['date']] = $row[$dailyMetricKey];
        }
        
        // Get training metrics data
        $trainingMetricName = in_array($primaryMetric, $trainingMetrics) ? $primaryMetric : $secondaryMetric;
        $trainingMetricKey = in_array($primaryMetric, $trainingMetrics) ? 'primary_value' : 'secondary_value';
        
        $query = "SELECT t.date, ";
        
        switch ($trainingMetricName) {
            case 'training_volume':
                $query .= "SUM(w.sets * w.reps * w.load_weight) as $trainingMetricKey ";
                break;
            case 'training_duration':
                $query .= "TIMESTAMPDIFF(MINUTE, t.training_start, t.training_end) as $trainingMetricKey ";
                break;
            case 'exercise_load':
                $query .= "AVG(w.load_weight) as $trainingMetricKey ";
                break;
            case 'stimulus_rating':
                $query .= "AVG(w.stimulus) as $trainingMetricKey ";
                break;
            case 'fatigue_rating':
                $query .= "AVG(w.fatigue_level) as $trainingMetricKey ";
                break;
        }
        
        $query .= "FROM training_sessions t
                  JOIN workout_details w ON t.id = w.session_id
                  WHERE t.user_id = :user_id 
                  AND t.date BETWEEN :start_date AND :end_date
                  AND t.training_start IS NOT NULL
                  AND t.training_end IS NOT NULL";
                  
        // Add specific conditions based on the training metric
        switch ($trainingMetricName) {
            case 'exercise_load':
                $query .= " AND w.load_weight IS NOT NULL";
                break;
            case 'stimulus_rating':
                $query .= " AND w.stimulus IS NOT NULL";
                break;
            case 'fatigue_rating':
                $query .= " AND w.fatigue_level IS NOT NULL";
                break;
        }
        
        $query .= " GROUP BY t.date ORDER BY t.date";
        
        $db->query($query);
        $db->bind(':user_id', $userId);
        $db->bind(':start_date', $startDate);
        $db->bind(':end_date', $endDate);
        
        $trainingData = $db->resultSet();
        $trainingDataByDate = [];
        
        foreach ($trainingData as $row) {
            $trainingDataByDate[$row['date']] = $row[$trainingMetricKey];
        }
        
        // Merge data where we have both metrics for the same date
        foreach ($dailyDataByDate as $date => $dailyValue) {
            if (isset($trainingDataByDate[$date])) {
                $data[] = [
                    'date' => $date,
                    $dailyMetricKey => $dailyValue,
                    $trainingMetricKey => $trainingDataByDate[$date]
                ];
            }
        }
    }
    
    return $data;
}

/**
 * Calculate correlation between two metrics
 * @param array $data Array of data points with both metrics
 * @param string $primaryMetric Primary metric ID
 * @param string $secondaryMetric Secondary metric ID
 * @return array Correlation results
 */
function calculateCorrelation($data, $primaryMetric, $secondaryMetric) {
    // Extract values
    $primaryValues = array_column($data, 'primary_value');
    $secondaryValues = array_column($data, 'secondary_value');
    
    // Calculate means
    $n = count($data);
    $primaryMean = array_sum($primaryValues) / $n;
    $secondaryMean = array_sum($secondaryValues) / $n;
    
    // Calculate correlation coefficient (Pearson)
    $numerator = 0;
    $denominatorA = 0;
    $denominatorB = 0;
    
    for ($i = 0; $i < $n; $i++) {
        $aDeviation = $primaryValues[$i] - $primaryMean;
        $bDeviation = $secondaryValues[$i] - $secondaryMean;
        
        $numerator += $aDeviation * $bDeviation;
        $denominatorA += $aDeviation * $aDeviation;
        $denominatorB += $bDeviation * $bDeviation;
    }
    
    $denominator = sqrt($denominatorA * $denominatorB);
    
    $correlation = ($denominator == 0) ? 0 : $numerator / $denominator;
    
    // Determine correlation strength and direction
    $strength = 'weak';
    if (abs($correlation) >= 0.7) {
        $strength = 'strong';
    } elseif (abs($correlation) >= 0.4) {
        $strength = 'moderate';
    }
    
    $direction = ($correlation >= 0) ? 'positive' : 'negative';
    
    return [
        'correlation' => round($correlation, 2),
        'strength' => $strength,
        'direction' => $direction,
        'primary_avg' => $primaryMean,
        'secondary_avg' => $secondaryMean
    ];
}

/**
 * Generate human-readable insight text based on correlation
 * @param float $correlation Correlation coefficient
 * @param string $primaryMetric Primary metric ID
 * @param string $secondaryMetric Secondary metric ID
 * @param float $primaryAvg Average value of primary metric
 * @param float $secondaryAvg Average value of secondary metric
 * @return string Insight text
 */
function generateInsightText($correlation, $primaryMetric, $secondaryMetric, $primaryAvg, $secondaryAvg) {
    // Get metric names
    $metricNames = [
        'sleep_duration' => 'sleep duration',
        'energy_level' => 'energy level',
        'stress_level' => 'stress level',
        'motivation_level' => 'motivation level',
        'weight' => 'body weight',
        'calories' => 'calorie intake',
        'protein' => 'protein intake',
        'carbs' => 'carbohydrate intake',
        'fats' => 'fat intake',
        'water_intake' => 'water intake',
        'training_volume' => 'training volume',
        'training_duration' => 'workout duration',
        'exercise_load' => 'exercise load',
        'stimulus_rating' => 'muscle stimulus',
        'fatigue_rating' => 'workout fatigue'
    ];
    
    $primaryName = $metricNames[$primaryMetric] ?? $primaryMetric;
    $secondaryName = $metricNames[$secondaryMetric] ?? $secondaryMetric;
    
    // Format averages
    $primaryAvgFormatted = formatMetricValue($primaryMetric, $primaryAvg);
    $secondaryAvgFormatted = formatMetricValue($secondaryMetric, $secondaryAvg);
    
    // No correlation
    if (abs($correlation) < 0.2) {
        return "There appears to be no significant relationship between your $primaryName and $secondaryName. " .
               "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
    }
    
    // Positive correlation
    if ($correlation > 0) {
        if ($correlation >= 0.7) {
            return "There is a strong positive relationship between your $primaryName and $secondaryName. " .
                   "When your $primaryName increases, your $secondaryName tends to increase as well. " .
                   "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
        } elseif ($correlation >= 0.4) {
            return "There is a moderate positive relationship between your $primaryName and $secondaryName. " .
                   "When your $primaryName increases, your $secondaryName tends to increase somewhat. " .
                   "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
        } else {
            return "There is a weak positive relationship between your $primaryName and $secondaryName. " .
                   "When your $primaryName increases, your $secondaryName may increase slightly. " .
                   "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
        }
    }
    
    // Negative correlation
    if ($correlation < 0) {
        if ($correlation <= -0.7) {
            return "There is a strong negative relationship between your $primaryName and $secondaryName. " .
                   "When your $primaryName increases, your $secondaryName tends to decrease. " .
                   "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
        } elseif ($correlation <= -0.4) {
            return "There is a moderate negative relationship between your $primaryName and $secondaryName. " .
                   "When your $primaryName increases, your $secondaryName tends to decrease somewhat. " .
                   "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
        } else {
            return "There is a weak negative relationship between your $primaryName and $secondaryName. " .
                   "When your $primaryName increases, your $secondaryName may decrease slightly. " .
                   "Your average $primaryName is $primaryAvgFormatted and your average $secondaryName is $secondaryAvgFormatted.";
        }
    }
    
    // Fallback (shouldn't reach here)
    return "Analysis of your $primaryName and $secondaryName shows a correlation of $correlation.";
}

/**
 * Format metric value for display
 * @param string $metric Metric ID
 * @param float $value Metric value
 * @return string Formatted value
 */
function formatMetricValue($metric, $value) {
    switch ($metric) {
        case 'sleep_duration':
            return round($value, 1) . ' hours';
        case 'energy_level':
        case 'stress_level':
        case 'motivation_level':
        case 'stimulus_rating':
        case 'fatigue_rating':
            return round($value, 1) . '/10';
        case 'weight':
            return round($value, 1) . ' kg';
        case 'calories':
            return round($value) . ' calories';
        case 'protein':
        case 'carbs':
        case 'fats':
            return round($value, 1) . ' g';
        case 'water_intake':
            return round($value, 1) . ' liters';
        case 'training_duration':
            return round($value) . ' minutes';
        case 'exercise_load':
            return round($value, 1) . ' kg';
        case 'training_volume':
            return round($value) . ' units';
        default:
            return round($value, 2);
    }
}

/**
 * Save correlation insight to database
 * @param int $userId User ID
 * @param string $primaryMetric Primary metric ID
 * @param string $secondaryMetric Secondary metric ID
 * @param float $correlationValue Correlation coefficient
 * @param string $correlationStrength Correlation strength (strong, moderate, weak)
 * @param string $direction Correlation direction (positive, negative)
 * @param string $insightText Human-readable insight text
 * @param string $firstDate First date in the analysis range
 * @param string $lastDate Last date in the analysis range
 * @param int $dataPoints Number of data points in the analysis
 * @return bool Success status
 */
function saveCorrelationInsight($userId, $primaryMetric, $secondaryMetric, $correlationValue, 
                               $correlationStrength, $direction, $insightText, 
                               $firstDate, $lastDate, $dataPoints) {
    $db = new Database();
    
    // First check if we have a similar insight already
    $db->query("SELECT id FROM correlation_insights 
                WHERE user_id = :user_id 
                AND primary_metric = :primary_metric 
                AND secondary_metric = :secondary_metric
                AND ABS(correlation_value - :correlation_value) < 0.1
                AND last_date >= :first_date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':primary_metric', $primaryMetric);
    $db->bind(':secondary_metric', $secondaryMetric);
    $db->bind(':correlation_value', $correlationValue);
    $db->bind(':first_date', $firstDate);
    
    $existingInsight = $db->single();
    
    if ($existingInsight) {
        // Update existing insight
        $db->query("UPDATE correlation_insights SET 
                    correlation_value = :correlation_value,
                    correlation_strength = :correlation_strength,
                    direction = :direction,
                    insight_text = :insight_text,
                    last_date = :last_date,
                    data_points = :data_points,
                    created_at = NOW()
                    WHERE id = :id");
        
        $db->bind(':correlation_value', $correlationValue);
        $db->bind(':correlation_strength', $correlationStrength);
        $db->bind(':direction', $direction);
        $db->bind(':insight_text', $insightText);
        $db->bind(':last_date', $lastDate);
        $db->bind(':data_points', $dataPoints);
        $db->bind(':id', $existingInsight['id']);
        
        return $db->execute();
    } else {
        // Create new insight
        $db->query("INSERT INTO correlation_insights 
                    (user_id, primary_metric, secondary_metric, correlation_value, 
                     correlation_strength, direction, insight_text, first_date, last_date, data_points) 
                    VALUES 
                    (:user_id, :primary_metric, :secondary_metric, :correlation_value, 
                     :correlation_strength, :direction, :insight_text, :first_date, :last_date, :data_points)");
        
        $db->bind(':user_id', $userId);
        $db->bind(':primary_metric', $primaryMetric);
        $db->bind(':secondary_metric', $secondaryMetric);
        $db->bind(':correlation_value', $correlationValue);
        $db->bind(':correlation_strength', $correlationStrength);
        $db->bind(':direction', $direction);
        $db->bind(':insight_text', $insightText);
        $db->bind(':first_date', $firstDate);
        $db->bind(':last_date', $lastDate);
        $db->bind(':data_points', $dataPoints);
        
        return $db->execute();
    }
}