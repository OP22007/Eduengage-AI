import os
import random
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, func
from sqlalchemy.orm import declarative_base, sessionmaker

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

Base = declarative_base()
engine = create_engine(DATABASE_URL)

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
            'risk_score': risk_score
        })
    
    print(f"Generated {len(data)} enhanced records.")
    print(f"High-risk learners: {sum(1 for d in data if d['is_high_risk'])}")
    return data

def seed_enhanced_database():
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(LearnerActivity).delete()
        db.commit()

        # Generate and insert new data
        data = generate_enhanced_data()

        batch_size = 1000
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            db.bulk_insert_mappings(LearnerActivity, batch)
            db.commit()
            print(f"Inserted batch {i//batch_size + 1}/{(len(data) + batch_size - 1)//batch_size}")

        print("Enhanced database seeded successfully!")
        
        # Print some statistics
        total_count = db.query(LearnerActivity).count()
        high_risk_count = db.query(LearnerActivity).filter(LearnerActivity.is_high_risk == True).count()
        avg_risk_score = db.query(func.avg(LearnerActivity.risk_score)).scalar()
        
        print(f"Total records: {total_count}")
        print(f"High-risk learners: {high_risk_count} ({high_risk_count/total_count*100:.1f}%)")
        print(f"Average risk score: {avg_risk_score:.3f}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_enhanced_database()