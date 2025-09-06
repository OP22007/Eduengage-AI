import pymongo
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score
import joblib
import json
import warnings
warnings.filterwarnings('ignore')

class EngagementRiskPredictor:
    """
    ML model to predict learner dropout risk based on engagement patterns
    according to the hackathon plan specifications
    """
    
    def __init__(self):
        self.mongo_uri = "mongodb+srv://IronMan:KYX74hO9EjVW4xzq@bitsbids.vdpghuh.mongodb.net/upgrad"
        self.db = None
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.client = None
        
    def connect_to_mongodb(self):
        """Connect to MongoDB database with proper connection handling"""
        print("Connecting to MongoDB...")
        try:
            self.client = pymongo.MongoClient(
                self.mongo_uri,
                maxPoolSize=50,
                minPoolSize=5,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=5000,
                serverSelectionTimeoutMS=10000,
                socketTimeoutMS=20000,
            )
            self.db = self.client.upgrad
            # Test connection
            self.db.command('ping')
            print(f"Connected! Collections: {self.db.list_collection_names()}")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise
    
    def close_connection(self):
        """Properly close MongoDB connection"""
        if self.client:
            self.client.close()
            print("🔒 MongoDB connection closed")
        
    def extract_comprehensive_features(self):
        """
        Extract comprehensive features according to the hackathon plan:
        - Engagement patterns
        - Learning behavior
        - Course performance
        - Activity patterns
        - Risk indicators
        """
        print("Extracting comprehensive features...")
        
        # Get all learners
        learners = list(self.db.learners.find({}))
        print(f"Processing {len(learners)} learners...")
        
        features_data = []
        now = datetime.now()
        
        for i, learner in enumerate(learners):
            if i % 50 == 0:
                print(f"Processing learner {i+1}/{len(learners)}")
                
            try:
                learner_id = learner['_id']
                user_id = learner.get('userId')
                
                # Get user data
                user = self.db.users.find_one({'_id': user_id}) if user_id else {}
                
                # Get activities for this learner
                activities = list(self.db.activities.find({'learnerId': learner_id}))
                
                # === BASIC PROFILE FEATURES ===
                profile = user.get('profile', {}) if user else {}
                join_date = profile.get('joinDate', now)
                if isinstance(join_date, str):
                    join_date = datetime.fromisoformat(join_date.replace('Z', '+00:00'))
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
                    last_login = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
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
                    progress_std = np.std(progress_values)
                    
                    # Risk scores
                    risk_scores = [float(e.get('riskScore', 0)) for e in enrollments]
                    avg_risk_score = np.mean(risk_scores)
                    max_risk_score = np.max(risk_scores)
                    
                    # Status distribution
                    completed_courses = sum(1 for e in enrollments if e.get('status') == 'completed')
                    active_courses = sum(1 for e in enrollments if e.get('status') == 'active')
                    at_risk_courses = sum(1 for e in enrollments if e.get('status') == 'at-risk')
                    
                    # Course difficulty analysis (if available)
                    course_ids = [e.get('courseId') for e in enrollments]
                    courses_info = list(self.db.courses.find({'_id': {'$in': course_ids}}))
                    
                    beginner_courses = sum(1 for c in courses_info if c.get('difficulty') == 'beginner')
                    intermediate_courses = sum(1 for c in courses_info if c.get('difficulty') == 'intermediate')
                    advanced_courses = sum(1 for c in courses_info if c.get('difficulty') == 'advanced')
                    
                    # Time since last activity per course
                    last_activities = []
                    for enrollment in enrollments:
                        last_activity = enrollment.get('lastActivity', now)
                        if isinstance(last_activity, str):
                            last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                        days_since_activity = (now - last_activity).days
                        last_activities.append(days_since_activity)
                    
                    avg_days_since_course_activity = np.mean(last_activities)
                    max_days_since_course_activity = np.max(last_activities)
                    
                else:
                    avg_progress = max_progress = min_progress = progress_std = 0
                    avg_risk_score = max_risk_score = 0
                    completed_courses = active_courses = at_risk_courses = 0
                    beginner_courses = intermediate_courses = advanced_courses = 0
                    avg_days_since_course_activity = max_days_since_course_activity = 0
                
                # === ACTIVITY PATTERN FEATURES ===
                total_activities = len(activities)
                
                if activities:
                    # Activity types
                    video_activities = sum(1 for a in activities if a.get('type') == 'video_watch')
                    quiz_activities = sum(1 for a in activities if a.get('type') == 'quiz_attempt')
                    forum_activities = sum(1 for a in activities if a.get('type') == 'forum_post')
                    assignment_activities = sum(1 for a in activities if a.get('type') == 'assignment_submit')
                    
                    # Time-based patterns
                    recent_activities_7d = 0
                    recent_activities_30d = 0
                    activity_durations = []
                    
                    for activity in activities:
                        # Activity timestamp analysis
                        timestamp = activity.get('timestamp', now)
                        if isinstance(timestamp, str):
                            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        
                        days_ago = (now - timestamp).days
                        if days_ago <= 7:
                            recent_activities_7d += 1
                        if days_ago <= 30:
                            recent_activities_30d += 1
                        
                        # Duration analysis
                        duration = activity.get('duration', 0)
                        if duration > 0:
                            activity_durations.append(duration)
                    
                    # Activity duration statistics
                    if activity_durations:
                        avg_activity_duration = np.mean(activity_durations)
                        total_activity_time = sum(activity_durations)
                        max_activity_duration = np.max(activity_durations)
                    else:
                        avg_activity_duration = total_activity_time = max_activity_duration = 0
                    
                    # Activity frequency patterns
                    activity_rate_daily = total_activities / max(days_since_join, 1) if days_since_join > 0 else 0
                    recent_activity_trend = recent_activities_7d / max(recent_activities_30d, 1) if recent_activities_30d > 0 else 0
                    
                else:
                    video_activities = quiz_activities = forum_activities = assignment_activities = 0
                    recent_activities_7d = recent_activities_30d = 0
                    avg_activity_duration = total_activity_time = max_activity_duration = 0
                    activity_rate_daily = recent_activity_trend = 0
                
                # === DERIVED ENGAGEMENT METRICS ===
                engagement_consistency = streak_days / max(days_since_join, 1) if days_since_join > 0 else 0
                progress_rate = avg_progress / max(days_since_join, 1) if days_since_join > 0 else 0
                course_load = total_courses / max(days_since_join / 30, 1) if days_since_join > 0 else 0
                hours_per_day = total_hours / max(days_since_join, 1) if days_since_join > 0 else 0
                
                # === RISK INDICATORS ===
                # High-risk patterns identification
                inactivity_risk = 1 if days_since_last_login > 14 else 0
                low_progress_risk = 1 if avg_progress < 0.2 and total_courses > 0 else 0
                high_risk_courses_ratio = at_risk_courses / max(total_courses, 1) if total_courses > 0 else 0
                declining_engagement = 1 if recent_activity_trend < 0.5 and recent_activities_30d > 0 else 0
                
                # === TARGET VARIABLE ===
                # Define dropout risk based on multiple indicators
                # According to the plan: predict if learner will drop out
                is_high_risk = 1 if (
                    at_risk_courses > 0 or 
                    avg_risk_score > 0.6 or
                    days_since_last_login > 21 or
                    (avg_progress < 0.3 and days_since_join > 30)
                ) else 0
                
                # Compile all features
                features = {
                    # Basic profile
                    'days_since_join': days_since_join,
                    'days_since_last_login': days_since_last_login,
                    
                    # Engagement metrics
                    'total_hours': total_hours,
                    'streak_days': streak_days,
                    'avg_session_time': avg_session_time,
                    'completion_rate': completion_rate,
                    'weekly_goal_hours': weekly_goal_hours,
                    
                    # Course metrics
                    'total_courses': total_courses,
                    'avg_progress': avg_progress,
                    'max_progress': max_progress,
                    'min_progress': min_progress,
                    'progress_std': progress_std,
                    'avg_risk_score': avg_risk_score,
                    'max_risk_score': max_risk_score,
                    
                    # Course status
                    'completed_courses': completed_courses,
                    'active_courses': active_courses,
                    'at_risk_courses': at_risk_courses,
                    
                    # Course difficulty
                    'beginner_courses': beginner_courses,
                    'intermediate_courses': intermediate_courses,
                    'advanced_courses': advanced_courses,
                    
                    # Activity patterns
                    'total_activities': total_activities,
                    'video_activities': video_activities,
                    'quiz_activities': quiz_activities,
                    'forum_activities': forum_activities,
                    'assignment_activities': assignment_activities,
                    'recent_activities_7d': recent_activities_7d,
                    'recent_activities_30d': recent_activities_30d,
                    'avg_activity_duration': avg_activity_duration,
                    'total_activity_time': total_activity_time,
                    'max_activity_duration': max_activity_duration,
                    
                    # Derived metrics
                    'engagement_consistency': engagement_consistency,
                    'progress_rate': progress_rate,
                    'course_load': course_load,
                    'hours_per_day': hours_per_day,
                    'activity_rate_daily': activity_rate_daily,
                    'recent_activity_trend': recent_activity_trend,
                    'avg_days_since_course_activity': avg_days_since_course_activity,
                    'max_days_since_course_activity': max_days_since_course_activity,
                    
                    # Risk indicators
                    'inactivity_risk': inactivity_risk,
                    'low_progress_risk': low_progress_risk,
                    'high_risk_courses_ratio': high_risk_courses_ratio,
                    'declining_engagement': declining_engagement,
                    
                    # Target
                    'is_high_risk': is_high_risk,
                    
                    # Metadata
                    'learner_id': str(learner_id)
                }
                
                features_data.append(features)
                
            except Exception as e:
                print(f"Error processing learner {learner_id}: {e}")
                continue
        
        print(f"Successfully extracted features for {len(features_data)} learners")
        return pd.DataFrame(features_data)
    
    def train_models(self):
        """Train multiple ML models and select the best performer"""
        print("Starting comprehensive model training...")
        
        # Connect and extract features
        self.connect_to_mongodb()
        df = self.extract_comprehensive_features()
        
        if df.empty:
            print("No data available for training!")
            return
        
        print(f"Dataset shape: {df.shape}")
        print(f"Features: {df.columns.tolist()}")
        
        # Prepare features and target
        feature_columns = [col for col in df.columns if col not in ['is_high_risk', 'learner_id']]
        X = df[feature_columns]
        y = df['is_high_risk']
        
        # Handle missing values
        X = X.fillna(0)
        
        print(f"\\nTarget distribution:")
        print(y.value_counts())
        print(f"High-risk percentage: {y.mean():.2%}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        print(f"\\nTraining set size: {X_train.shape[0]}")
        print(f"Test set size: {X_test.shape[0]}")
        
        # Train multiple models
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                class_weight='balanced'
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                random_state=42
            )
        }
        
        best_model = None
        best_score = 0
        best_model_name = ""
        results = {}
        
        for name, model in models.items():
            print(f"\\nTraining {name}...")
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Predictions
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
            
            # Evaluate
            accuracy = accuracy_score(y_test, y_pred)
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            print(f"{name} Results:")
            print(f"Accuracy: {accuracy:.4f}")
            print(f"AUC Score: {auc_score:.4f}")
            print("\\nClassification Report:")
            print(classification_report(y_test, y_pred))
            
            # Store results
            results[name] = {
                'accuracy': accuracy,
                'auc_score': auc_score,
                'model': model
            }
            
            # Track best model based on AUC score
            if auc_score > best_score:
                best_score = auc_score
                best_model = model
                best_model_name = name
        
        print(f"\\n🏆 Best Model: {best_model_name} (AUC: {best_score:.4f})")
        
        # Feature importance analysis
        if hasattr(best_model, 'feature_importances_'):
            feature_importance = pd.DataFrame({
                'feature': feature_columns,
                'importance': best_model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print("\\n📊 Top 15 Most Important Features:")
            print(feature_importance.head(15).to_string(index=False))
        
        # Save the best model
        print("\\n💾 Saving model artifacts...")
        
        # Save model and scaler
        joblib.dump(best_model, 'risk_prediction_model.pkl')
        joblib.dump(scaler, 'feature_scaler.pkl')
        
        # Save feature columns
        with open('feature_names.json', 'w') as f:
            json.dump(feature_columns, f)
        
        # Save model metadata
        model_info = {
            'model_type': best_model_name,
            'accuracy': float(best_score),
            'feature_count': len(feature_columns),
            'training_samples': int(X_train.shape[0]),
            'high_risk_percentage': float(y.mean()),
            'feature_columns': feature_columns,
            'training_date': datetime.now().isoformat(),
            'all_results': {k: {
                'accuracy': float(v['accuracy']),
                'auc_score': float(v['auc_score'])
            } for k, v in results.items()}
        }
        
        with open('model_info.json', 'w') as f:
            json.dump(model_info, f, indent=2)
        
        # Save feature importance
        if hasattr(best_model, 'feature_importances_'):
            feature_importance.to_csv('feature_importance.csv', index=False)
        
        print("\\n✅ Model training completed successfully!")
        print("Files saved:")
        print("- risk_prediction_model.pkl (trained model)")
        print("- feature_scaler.pkl (feature scaler)")
        print("- feature_names.json (feature list)")
        print("- model_info.json (model metadata)")
        print("- feature_importance.csv (feature importance)")
        
        return best_model, scaler, feature_columns

if __name__ == "__main__":
    print("🚀 Starting Engagement & Retention Intelligence Platform ML Training")
    print("=" * 80)
    
    predictor = EngagementRiskPredictor()
    
    try:
        model, scaler, features = predictor.train_models()
        print("\n🎯 Training Complete! Ready for production deployment.")
    except Exception as e:
        print(f"❌ Training failed: {e}")
        raise
    finally:
        # Ensure connection is properly closed
        predictor.close_connection()
