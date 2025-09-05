import os
import random
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, func, text
from sqlalchemy.orm import declarative_base, sessionmaker

from dotenv import load_dotenv
load_dotenv()

# Supabase connection string format:
# postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
SUPABASE_URL = os.getenv("SUPABASE_URL")  # Your Supabase database URL
SUPABASE_PASSWORD = os.getenv("SUPABASE_PASSWORD")  # Your database password

# Construct the connection string
DATABASE_URL = f"postgresql://postgres:{SUPABASE_PASSWORD}@{SUPABASE_URL}/postgres"

Base = declarative_base()
engine = create_engine(DATABASE_URL, echo=False)

class LearnerActivity(Base):
    __tablename__ = 'learner_activity'
    
    id = Column(Integer, primary_key=True)
    learner_id = Column(String(50), nullable=False)
    course_id = Column(String(50), nullable=False)
    module_progress = Column(Float, nullable=False)
    time_since_last_activity = Column(Integer, nullable=False)
    quiz_score = Column(Float)
    
    # Temporal & Behavioral Patterns
    session_duration = Column(Float)  # Average session time in minutes
    login_frequency = Column(Integer)  # Logins per week
    peak_activity_hour = Column(Integer)  # 0-23
    consecutive_days_inactive = Column(Integer)
    last_engagement_type = Column(String(50))
    
    # Learning Behavior Indicators
    video_completion_rate = Column(Float)
    assignment_submission_rate = Column(Float)
    discussion_participation = Column(Integer)
    help_seeking_frequency = Column(Integer)
    peer_interaction_score = Column(Float)
    
    # Performance & Difficulty Metrics
    average_attempt_count = Column(Float)
    difficulty_rating = Column(Float)  # 1-5 scale
    concept_mastery_score = Column(Float)
    learning_velocity = Column(Float)  # Relative to peer average
    stuck_indicator = Column(Boolean)
    
    # Demographic & Context
    learner_type = Column(String(20))
    time_zone = Column(String(10))
    device_preference = Column(String(20))
    course_enrollment_date = Column(DateTime)
    expected_completion_date = Column(DateTime)
    
    # Target variable (enhanced)
    is_high_risk = Column(Boolean, default=False)
    risk_score = Column(Float)  # 0.0-1.0 probability of dropping out
    
    # Add timestamps for Supabase best practices
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def test_connection():
    """Test the database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version}")
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def generate_enhanced_data(num_rows=45000):
    print("Generating enhanced learner data...")
    data = []
    
    engagement_types = ['video', 'quiz', 'assignment', 'discussion', 'reading']
    learner_types = ['working_professional', 'student', 'career_changer', 'entrepreneur']
    timezones = ['UTC+05:30', 'UTC-05:00', 'UTC+00:00', 'UTC+08:00', 'UTC-08:00']
    devices = ['mobile', 'desktop', 'tablet']
    
    for _ in range(num_rows):
        learner_id = f'L{random.randint(1000, 9999)}'
        course_id = f'C{random.randint(101, 110)}'  # More courses
        
        # Basic metrics
        module_progress = round(random.uniform(0.05, 1.0), 3)
        time_since_last_activity = random.randint(0, 45)
        quiz_score = round(random.uniform(0.3, 1.0), 2)
        
        # Temporal & Behavioral
        session_duration = round(random.uniform(5, 180), 1)  # 5 min to 3 hours
        login_frequency = random.randint(0, 14)  # 0-14 logins per week
        peak_activity_hour = random.randint(0, 23)
        consecutive_days_inactive = random.randint(0, time_since_last_activity)
        last_engagement_type = random.choice(engagement_types)
        
        # Learning Behavior
        video_completion_rate = round(random.uniform(0.2, 1.0), 3)
        assignment_submission_rate = round(random.uniform(0.1, 1.0), 3)
        discussion_participation = random.randint(0, 25)
        help_seeking_frequency = random.randint(0, 10)
        peer_interaction_score = round(random.uniform(0.0, 1.0), 3)
        
        # Performance & Difficulty
        average_attempt_count = round(random.uniform(1.0, 5.0), 2)
        difficulty_rating = round(random.uniform(1.0, 5.0), 1)
        concept_mastery_score = round(random.uniform(0.3, 1.0), 3)
        learning_velocity = round(random.uniform(0.5, 2.0), 3)  # Relative to average
        stuck_indicator = random.choice([True, False])
        
        # Demographic & Context
        learner_type = random.choice(learner_types)
        time_zone = random.choice(timezones)
        device_preference = random.choice(devices)
        
        enrollment_date = datetime.now() - timedelta(days=random.randint(1, 365))
        expected_completion_date = enrollment_date + timedelta(days=random.randint(30, 180))
        
        # Enhanced risk calculation with multiple factors
        risk_factors = []
        
        # Progress-based risk
        if module_progress < 0.3:
            risk_factors.append(0.4)
        elif module_progress < 0.6:
            risk_factors.append(0.2)
        else:
            risk_factors.append(0.0)
            
        # Activity-based risk
        if time_since_last_activity > 14:
            risk_factors.append(0.5)
        elif time_since_last_activity > 7:
            risk_factors.append(0.3)
        else:
            risk_factors.append(0.0)
            
        # Engagement-based risk
        if login_frequency < 2:
            risk_factors.append(0.3)
        elif session_duration < 15:
            risk_factors.append(0.2)
        else:
            risk_factors.append(0.0)
            
        # Performance-based risk
        if quiz_score < 0.6:
            risk_factors.append(0.3)
        if average_attempt_count > 3:
            risk_factors.append(0.2)
        if stuck_indicator:
            risk_factors.append(0.2)
            
        # Behavioral risk
        if assignment_submission_rate < 0.5:
            risk_factors.append(0.2)
        if help_seeking_frequency == 0 and difficulty_rating > 3:
            risk_factors.append(0.2)
            
        # Calculate composite risk score
        risk_score = min(sum(risk_factors), 1.0)
        risk_score = round(risk_score + random.uniform(-0.1, 0.1), 3)  # Add noise
        risk_score = max(0.0, min(1.0, risk_score))  # Clamp to [0,1]
        
        is_high_risk = risk_score > 0.6
        
        data.append({
            'learner_id': learner_id,
            'course_id': course_id,
            'module_progress': module_progress,
            'time_since_last_activity': time_since_last_activity,
            'quiz_score': quiz_score,
            'session_duration': session_duration,
            'login_frequency': login_frequency,
            'peak_activity_hour': peak_activity_hour,
            'consecutive_days_inactive': consecutive_days_inactive,
            'last_engagement_type': last_engagement_type,
            'video_completion_rate': video_completion_rate,
            'assignment_submission_rate': assignment_submission_rate,
            'discussion_participation': discussion_participation,
            'help_seeking_frequency': help_seeking_frequency,
            'peer_interaction_score': peer_interaction_score,
            'average_attempt_count': average_attempt_count,
            'difficulty_rating': difficulty_rating,
            'concept_mastery_score': concept_mastery_score,
            'learning_velocity': learning_velocity,
            'stuck_indicator': stuck_indicator,
            'learner_type': learner_type,
            'time_zone': time_zone,
            'device_preference': device_preference,
            'course_enrollment_date': enrollment_date,
            'expected_completion_date': expected_completion_date,
            'is_high_risk': is_high_risk,
            'risk_score': risk_score,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
    
    print(f"Generated {len(data)} enhanced records.")
    print(f"High-risk learners: {sum(1 for d in data if d['is_high_risk'])}")
    return data

def create_indexes():
    """Create useful indexes for better query performance"""
    with engine.connect() as conn:
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_learner_activity_learner_id ON learner_activity(learner_id);",
            "CREATE INDEX IF NOT EXISTS idx_learner_activity_course_id ON learner_activity(course_id);",
            "CREATE INDEX IF NOT EXISTS idx_learner_activity_risk_score ON learner_activity(risk_score);",
            "CREATE INDEX IF NOT EXISTS idx_learner_activity_is_high_risk ON learner_activity(is_high_risk);",
            "CREATE INDEX IF NOT EXISTS idx_learner_activity_last_activity ON learner_activity(time_since_last_activity);",
            "CREATE INDEX IF NOT EXISTS idx_learner_activity_created_at ON learner_activity(created_at);"
        ]
        
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                print(f"✅ Created index: {index_sql.split('ON')[1].split('(')[0].strip()}")
            except Exception as e:
                print(f"⚠️  Index creation warning: {e}")
        
        conn.commit()

def seed_enhanced_database():
    """Seed the database with enhanced learner data"""
    if not test_connection():
        return
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        print("Clearing existing data...")
        db.query(LearnerActivity).delete()
        db.commit()
        print("✅ Existing data cleared!")
        
        # Generate new data
        data = generate_enhanced_data()

        # Insert data in batches for better performance
        batch_size = 1000
        total_batches = (len(data) + batch_size - 1) // batch_size
        
        print(f"Inserting data in {total_batches} batches of {batch_size} records each...")
        
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            db.bulk_insert_mappings(LearnerActivity, batch)
            db.commit()
            print(f"✅ Inserted batch {i//batch_size + 1}/{total_batches}")

        print("Creating performance indexes...")
        create_indexes()

        print("\n🎉 Enhanced database seeded successfully!")
        
        # Show summary statistics
        total_count = db.query(LearnerActivity).count()
        high_risk_count = db.query(LearnerActivity).filter(LearnerActivity.is_high_risk == True).count()
        avg_risk_score = db.query(func.avg(LearnerActivity.risk_score)).scalar()
        
        print(f"\n📊 Summary Statistics:")
        print(f"   Total records: {total_count:,}")
        print(f"   High-risk learners: {high_risk_count:,} ({high_risk_count/total_count*100:.1f}%)")
        print(f"   Average risk score: {avg_risk_score:.3f}")
        
        # Show sample data
        print(f"\n🔍 Sample records:")
        sample_records = db.query(LearnerActivity).limit(3).all()
        for record in sample_records:
            print(f"   Learner {record.learner_id}: Risk {record.risk_score:.3f}, Progress {record.module_progress:.1%}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()

def verify_data():
    """Verify the data was inserted correctly"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Basic counts
        total_count = db.query(LearnerActivity).count()
        print(f"Total records in database: {total_count:,}")
        
        # Risk distribution
        risk_distribution = db.query(
            LearnerActivity.is_high_risk,
            func.count(LearnerActivity.id)
        ).group_by(LearnerActivity.is_high_risk).all()
        
        print("\nRisk Distribution:")
        for is_high_risk, count in risk_distribution:
            risk_level = "High Risk" if is_high_risk else "Low Risk"
            print(f"  {risk_level}: {count:,} ({count/total_count*100:.1f}%)")
            
        # Course distribution
        course_distribution = db.query(
            LearnerActivity.course_id,
            func.count(LearnerActivity.id)
        ).group_by(LearnerActivity.course_id).limit(5).all()
        
        print("\nTop 5 Courses by Enrollment:")
        for course_id, count in course_distribution:
            print(f"  {course_id}: {count:,} learners")
            
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting Supabase PostgreSQL seeding process...")
    print("=" * 50)
    
    # Check environment variables
    if not SUPABASE_URL or not SUPABASE_PASSWORD:
        print("❌ Please set SUPABASE_URL and SUPABASE_PASSWORD environment variables")
        exit(1)
    
    seed_enhanced_database()
    verify_data()
    
    print("\n" + "=" * 50)
    print("✅ Process completed successfully!")