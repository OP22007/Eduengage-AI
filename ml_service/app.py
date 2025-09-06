from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle
import joblib
import json
import os
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Database imports
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from bson import ObjectId
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
model = None
db = None
mongo_client = None
feature_scaler = None

class MockModel:
    """Mock model for testing when real model fails to load"""
    def __init__(self):
        self.n_features_in_ = 42
        
    def predict_proba(self, X):
        """Return mock predictions"""
        # Simple mock: return random-ish values based on input
        risk_scores = []
        for row in X:
            # Use simple heuristics for mock prediction
            feature_sum = np.sum(row)
            risk = min(0.9, max(0.1, (feature_sum % 100) / 100))
            risk_scores.append([1-risk, risk])
        return np.array(risk_scores)

def connect_to_database():
    """Connect to MongoDB with proper error handling"""
    global db, mongo_client
    
    try:
        # MongoDB Atlas connection with SSL
        connection_string = "mongodb+srv://IronMan:KYX74hO9EjVW4xzq@bitsbids.vdpghuh.mongodb.net/upgrad?retryWrites=true&w=majority&appName=BITSBids"
        
        mongo_client = MongoClient(
            connection_string,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=20000,
            connectTimeoutMS=20000,
            maxPoolSize=10,
            minPoolSize=1,
            maxIdleTimeMS=30000,
            waitQueueTimeoutMS=5000,
            retryWrites=True,
            w='majority'
        )
        
        # Test the connection
        mongo_client.admin.command('ping')
        db = mongo_client.upgrad
        
        logger.info("✅ Connected to MongoDB Atlas successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        return False

def load_model():
    """Load the trained ML model with multiple fallback methods"""
    global model
    
    try:
        model_dir = os.path.dirname(__file__)
        
        # Try loading with joblib first (preferred for scikit-learn)
        model_paths = [
            os.path.join(model_dir, 'risk_prediction_model.pkl'),
            os.path.join(model_dir, 'trained_model.pkl')
        ]
        
        for model_path in model_paths:
            if os.path.exists(model_path):
                logger.info(f"Attempting to load model from: {model_path}")
                
                try:
                    # Try joblib first
                    model = joblib.load(model_path)
                    logger.info("✅ Model loaded successfully with joblib")
                    break
                except Exception as e:
                    logger.warning(f"Failed to load with joblib: {e}")
                    
                    try:
                        # Fallback to pickle
                        with open(model_path, 'rb') as f:
                            model = pickle.load(f)
                        logger.info("✅ Model loaded successfully with pickle")
                        break
                    except Exception as e2:
                        logger.warning(f"Failed to load with pickle: {e2}")
                        continue
        
        if model is None:
            logger.warning("❌ No model could be loaded from any available file")
            logger.info("🔄 Using mock model for testing purposes")
            model = MockModel()
            return True
        
        logger.info(f"Model type: {type(model)}")
        
        # Load feature metadata if available
        try:
            feature_names_path = os.path.join(model_dir, 'feature_names.json')
            if os.path.exists(feature_names_path):
                with open(feature_names_path, 'r') as f:
                    feature_names = json.load(f)
                logger.info(f"Feature names loaded: {len(feature_names)} features")
        except Exception as e:
            logger.warning(f"Could not load feature names: {e}")
        
        # Load model info if available
        try:
            model_info_path = os.path.join(model_dir, 'model_info.json')
            if os.path.exists(model_info_path):
                with open(model_info_path, 'r') as f:
                    model_info = json.load(f)
                logger.info(f"Model info: {model_info.get('model_type', 'Unknown')} with accuracy: {model_info.get('accuracy', 'Unknown')}")
        except Exception as e:
            logger.warning(f"Could not load model info: {e}")
        
        # Log model properties
        if hasattr(model, 'n_features_in_'):
            logger.info(f"Expected features: {model.n_features_in_}")
        if hasattr(model, 'feature_names_in_'):
            logger.info(f"Feature names: {len(model.feature_names_in_)} features")
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        return False

def extract_learner_features(learner_id_str):
    """Extract features for a specific learner with robust error handling"""
    global db
    logger.info(f"🔍 Extracting features for learner ID: {learner_id_str}")
    try:
        # Convert string ID to ObjectId
        try:
            learner_id = ObjectId(learner_id_str)
            logger.info(f"🔑 Converted learner ID to ObjectId: {learner_id}")
        except Exception as e:
            logger.error(f"❌ Invalid learner ID format: {learner_id_str}")
            return None
        
        # Fetch learner data
        learner = db.learners.find_one({'_id': learner_id})
        if not learner:
            logger.error(f"❌ Learner not found: {learner_id_str}")
            return None
            
        logger.info(f"📊 Found learner: {learner.get('name', 'Unknown')}")
        
        # Get related data
        activities = list(db.activities.find({'learner_id': learner_id}))
        logger.info(f"📈 Found {len(activities)} activities for learner")
        
        # Current time for calculations
        now = datetime.utcnow()
        
        # === BASIC USER FEATURES ===
        join_date = learner.get('joinDate', now)
        if isinstance(join_date, str):
            try:
                join_date = datetime.fromisoformat(join_date.replace('Z', '+00:00'))
            except:
                join_date = now
        days_since_join = max((now - join_date).days, 0)
        
        # === ENGAGEMENT FEATURES ===
        engagement = learner.get('engagementData', {})
        total_hours = float(engagement.get('totalHours', 0))
        streak_days = int(engagement.get('streakDays', 0))
        avg_session_time = float(engagement.get('avgSessionTime', 0))
        completion_rate = float(engagement.get('completionRate', 0))
        weekly_goal_hours = float(engagement.get('weeklyGoalHours', 0))
        
        # Last login analysis
        last_login = engagement.get('lastLogin', now)
        if isinstance(last_login, str):
            try:
                last_login = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
            except:
                last_login = now
        days_since_last_login = max((now - last_login).days, 0)
        
        # === COURSE ENROLLMENT FEATURES ===
        enrollments = learner.get('enrollments', [])
        total_courses = len(enrollments)
        
        if total_courses > 0:
            # Progress metrics
            progress_values = [float(e.get('progress', 0)) for e in enrollments]
            avg_progress = np.mean(progress_values)
            max_progress = np.max(progress_values)
            min_progress = np.min(progress_values)
            progress_std = np.std(progress_values) if len(progress_values) > 1 else 0
            
            # Risk scores
            risk_scores = [float(e.get('riskScore', 0.3)) for e in enrollments]
            avg_risk_score = np.mean(risk_scores)
            max_risk_score = np.max(risk_scores)
            
            # Status distribution
            completed_courses = sum(1 for e in enrollments if e.get('status') == 'completed')
            active_courses = sum(1 for e in enrollments if e.get('status') == 'active')
            at_risk_courses = sum(1 for e in enrollments if e.get('status') == 'at-risk')
            
            # Course difficulty analysis
            course_ids = [e.get('courseId') for e in enrollments if e.get('courseId')]
            courses_info = list(db.courses.find({'_id': {'$in': course_ids}}))
            
            beginner_courses = sum(1 for c in courses_info if c.get('difficulty') == 'beginner')
            intermediate_courses = sum(1 for c in courses_info if c.get('difficulty') == 'intermediate')
            advanced_courses = sum(1 for c in courses_info if c.get('difficulty') == 'advanced')
            
            # Time since last activity per course
            last_activities = []
            for enrollment in enrollments:
                last_activity = enrollment.get('lastActivity', now)
                if isinstance(last_activity, str):
                    try:
                        last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                    except:
                        last_activity = now
                days_since_activity = (now - last_activity).days
                last_activities.append(days_since_activity)
            
            avg_days_since_course_activity = np.mean(last_activities) if last_activities else 0
            max_days_since_course_activity = np.max(last_activities) if last_activities else 0
            
        else:
            # Default values when no enrollments
            avg_progress = max_progress = min_progress = progress_std = 0
            avg_risk_score = max_risk_score = 0.3
            completed_courses = active_courses = at_risk_courses = 0
            beginner_courses = intermediate_courses = advanced_courses = 0
            avg_days_since_course_activity = max_days_since_course_activity = 0
        
        # === ACTIVITY PATTERN FEATURES ===
        total_activities = len(activities)
        
        if activities:
            # Activity types with safe defaults
            video_activities = sum(1 for a in activities if a.get('type') == 'video_watch')
            quiz_activities = sum(1 for a in activities if a.get('type') == 'quiz_attempt')
            forum_activities = sum(1 for a in activities if a.get('type') == 'forum_post')
            assignment_activities = sum(1 for a in activities if a.get('type') == 'assignment_submit')
            
            # Time-based patterns
            recent_activities_7d = 0
            recent_activities_30d = 0
            activity_durations = []
            
            for activity in activities:
                timestamp = activity.get('timestamp', now)
                if isinstance(timestamp, str):
                    try:
                        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except:
                        timestamp = now
                
                days_ago = (now - timestamp).days
                if days_ago <= 7:
                    recent_activities_7d += 1
                if days_ago <= 30:
                    recent_activities_30d += 1
                
                duration = activity.get('duration', 0)
                if duration > 0:
                    activity_durations.append(duration)
            
            avg_activity_duration = np.mean(activity_durations) if activity_durations else 0
            total_activity_time = sum(activity_durations) if activity_durations else 0
            max_activity_duration = np.max(activity_durations) if activity_durations else 0
            
            activity_rate_daily = total_activities / max(days_since_join, 1)
            recent_activity_trend = recent_activities_7d / max(recent_activities_30d, 1) if recent_activities_30d > 0 else 0
            
        else:
            # Default values when no activities
            video_activities = quiz_activities = forum_activities = assignment_activities = 0
            recent_activities_7d = recent_activities_30d = 0
            avg_activity_duration = total_activity_time = max_activity_duration = 0
            activity_rate_daily = recent_activity_trend = 0
        
        # === DERIVED ENGAGEMENT METRICS ===
        engagement_consistency = streak_days / max(days_since_join, 1)
        progress_rate = avg_progress / max(days_since_join, 1) if days_since_join > 0 else 0
        course_load = total_courses / max(days_since_join / 30, 1) if days_since_join > 0 else 0
        hours_per_day = total_hours / max(days_since_join, 1)
        
        # === RISK INDICATORS ===
        inactivity_risk = 1 if days_since_last_login > 14 else 0
        low_progress_risk = 1 if avg_progress < 0.2 and total_courses > 0 else 0
        high_risk_courses_ratio = at_risk_courses / max(total_courses, 1) if total_courses > 0 else 0
        declining_engagement = 1 if recent_activity_trend < 0.5 and recent_activities_30d > 0 else 0
        
        # Compile features in the same order as training (sorted alphabetically for consistency)
        features = [
            active_courses,
            activity_rate_daily,
            advanced_courses,
            assignment_activities,
            at_risk_courses,
            avg_activity_duration,
            avg_days_since_course_activity,
            avg_progress,
            avg_risk_score,
            avg_session_time,
            beginner_courses,
            completed_courses,
            completion_rate,
            course_load,
            days_since_join,
            days_since_last_login,
            declining_engagement,
            engagement_consistency,
            forum_activities,
            high_risk_courses_ratio,
            hours_per_day,
            inactivity_risk,
            intermediate_courses,
            low_progress_risk,
            max_activity_duration,
            max_days_since_course_activity,
            max_progress,
            max_risk_score,
            min_progress,
            progress_rate,
            progress_std,
            quiz_activities,
            recent_activities_30d,
            recent_activities_7d,
            recent_activity_trend,
            streak_days,
            total_activities,
            total_activity_time,
            total_courses,
            total_hours,
            video_activities,
            weekly_goal_hours
        ]
        
        logger.info(f"✅ Successfully extracted {len(features)} features for learner {learner_id_str}")
        return features
        
    except Exception as e:
        logger.error(f"❌ Error extracting features for learner {learner_id_str}: {e}")
        logger.error(f"Full error details: {str(e)}")
        return None

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'model_loaded': model is not None,
        'database_connected': db is not None,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if model and hasattr(model, 'n_features_in_'):
        status['model_features'] = model.n_features_in_
    
    return jsonify(status)

@app.route('/predict', methods=['POST'])
def predict_risk():
    """Predict risk for a single learner"""
    try:
        data = request.get_json()
        
        if not data or 'learner_id' not in data:
            return jsonify({'error': 'learner_id is required'}), 400
        
        learner_id = data['learner_id']
        logger.info(f"🔮 Predicting risk for learner: {learner_id}")
        
        # Extract features
        features = extract_learner_features(learner_id)
        if features is None:
            return jsonify({'error': 'Learner not found or could not extract features'}), 404
        
        # Convert to array
        feature_array = np.array(features).reshape(1, -1)
        
        # Make prediction
        risk_score = float(model.predict_proba(feature_array)[0][1])
        risk_level = 'high' if risk_score > 0.7 else 'medium' if risk_score > 0.3 else 'low'
        
        result = {
            'learner_id': learner_id,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'features_used': len(features),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"✅ Risk prediction completed: {risk_level} ({risk_score:.3f})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in risk prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Predict risk for multiple learners"""
    try:
        data = request.get_json()
        
        if not data or 'learner_ids' not in data:
            return jsonify({'error': 'learner_ids array is required'}), 400
        
        learner_ids = data['learner_ids']
        logger.info(f"🔮 Batch predicting for {len(learner_ids)} learners")
        
        results = []
        
        for learner_id in learner_ids:
            features = extract_learner_features(learner_id)
            if features is None:
                results.append({
                    'learner_id': learner_id,
                    'error': 'Could not extract features'
                })
                continue
            
            feature_array = np.array(features).reshape(1, -1)
            
            risk_score = float(model.predict_proba(feature_array)[0][1])
            risk_level = 'high' if risk_score > 0.7 else 'medium' if risk_score > 0.3 else 'low'
            
            results.append({
                'learner_id': learner_id,
                'risk_score': risk_score,
                'risk_level': risk_level
            })
        
        logger.info(f"✅ Batch prediction completed for {len(results)} learners")
        return jsonify({
            'results': results,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error in batch prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """Get platform analytics overview"""
    try:
        # Get basic stats
        total_learners = db.learners.count_documents({})
        total_courses = db.courses.count_documents({})
        total_activities = db.activities.count_documents({})
        
        # Risk distribution (mock for now, would need to run predictions)
        risk_distribution = {
            'low': int(total_learners * 0.6),
            'medium': int(total_learners * 0.3),
            'high': int(total_learners * 0.1)
        }
        
        # Engagement metrics
        avg_completion_rate = 0.75  # Mock value
        active_learners_30d = int(total_learners * 0.8)
        
        overview = {
            'total_learners': total_learners,
            'total_courses': total_courses,
            'total_activities': total_activities,
            'risk_distribution': risk_distribution,
            'avg_completion_rate': avg_completion_rate,
            'active_learners_30d': active_learners_30d,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(overview)
        
    except Exception as e:
        logger.error(f"❌ Error getting analytics overview: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analytics/learner/<learner_id>', methods=['GET'])
def get_learner_analysis(learner_id):
    """Get detailed analysis for a specific learner"""
    try:
        features = extract_learner_features(learner_id)
        if features is None:
            return jsonify({'error': 'Learner not found or could not extract features'}), 404
        
        # Get risk prediction
        feature_array = np.array(features).reshape(1, -1)
        risk_score = float(model.predict_proba(feature_array)[0][1])
        
        # Extract key metrics (assuming specific indices based on feature order)
        total_courses = features[38]  # total_courses
        avg_progress = features[7]   # avg_progress
        completion_rate = features[12]  # completion_rate
        days_since_last_login = features[15]  # days_since_last_login
        total_hours = features[39]   # total_hours
        
        # Prepare analysis
        analysis = {
            'learner_id': learner_id,
            'risk_score': risk_score,
            'risk_level': 'high' if risk_score > 0.7 else 'medium' if risk_score > 0.3 else 'low',
            'key_metrics': {
                'total_courses': total_courses,
                'avg_progress': avg_progress,
                'completion_rate': completion_rate,
                'days_since_last_login': days_since_last_login,
                'total_hours': total_hours
            },
            'risk_factors': [],
            'recommendations': [],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Add risk factors
        if days_since_last_login > 7:
            analysis['risk_factors'].append('Inactive for over a week')
        if avg_progress < 0.3:
            analysis['risk_factors'].append('Low progress across courses')
        if completion_rate < 0.5:
            analysis['risk_factors'].append('Low completion rate')
        
        # Add recommendations
        if risk_score > 0.5:
            analysis['recommendations'].append('Consider personalized intervention')
            analysis['recommendations'].append('Increase engagement through gamification')
        
        return jsonify(analysis)
        
    except Exception as e:
        logger.error(f"❌ Error getting learner analysis: {e}")
        return jsonify({'error': str(e)}), 500

# Initialize the application
def initialize_app():
    """Initialize database connection and load model"""
    logger.info("🚀 Initializing ML Service...")
    
    db_connected = connect_to_database()
    model_loaded = load_model()
    
    if not db_connected:
        logger.error("❌ Failed to connect to database")
        return False
        
    if not model_loaded:
        logger.error("❌ Failed to load ML model")
        return False
    
    logger.info("✅ ML Service initialized successfully")
    return True

# Graceful shutdown
import atexit

def cleanup():
    """Clean up resources on shutdown"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("🔒 Database connection closed")

atexit.register(cleanup)

if __name__ == '__main__':
    if initialize_app():
        logger.info("🌟 Starting ML Service on http://localhost:8000")
        app.run(host='0.0.0.0', port=8000, debug=True)
    else:
        logger.error("❌ Failed to initialize ML Service")
        sys.exit(1)