import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, func, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not set in .env")
    exit(1)

Base = declarative_base()
engine = create_engine(DATABASE_URL, echo=False)

# ----------------------------
# Define Table
# ----------------------------
class LearnerActivity(Base):
    __tablename__ = 'learner_activity'
    
    id = Column(Integer, primary_key=True)
    learner_id = Column(String(50), nullable=False)
    course_id = Column(String(50), nullable=False)
    module_progress = Column(Float, nullable=False)
    time_since_last_activity = Column(Integer, nullable=False)
    quiz_score = Column(Float)

    # Behavioral
    session_duration = Column(Float)
    login_frequency = Column(Integer)
    peak_activity_hour = Column(Integer)
    consecutive_days_inactive = Column(Integer)
    last_engagement_type = Column(String(50))

    # Learning behavior
    video_completion_rate = Column(Float)
    assignment_submission_rate = Column(Float)
    discussion_participation = Column(Integer)
    help_seeking_frequency = Column(Integer)
    peer_interaction_score = Column(Float)

    # Performance
    average_attempt_count = Column(Float)
    difficulty_rating = Column(Float)
    concept_mastery_score = Column(Float)
    learning_velocity = Column(Float)
    stuck_indicator = Column(Boolean)

    # Demographics
    learner_type = Column(String(20))
    time_zone = Column(String(10))
    device_preference = Column(String(20))
    course_enrollment_date = Column(DateTime)
    expected_completion_date = Column(DateTime)

    # Target
    is_high_risk = Column(Boolean, default=False)
    risk_score = Column(Float)

    # Supabase-friendly timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ----------------------------
# Helpers
# ----------------------------
def test_connection():
    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version()")).fetchone()[0]
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
        course_id = f'C{random.randint(101, 110)}'
        module_progress = round(random.uniform(0.05, 1.0), 3)
        time_since_last_activity = random.randint(0, 45)
        quiz_score = round(random.uniform(0.3, 1.0), 2)

        session_duration = round(random.uniform(5, 180), 1)
        login_frequency = random.randint(0, 14)
        peak_activity_hour = random.randint(0, 23)
        consecutive_days_inactive = random.randint(0, time_since_last_activity)
        last_engagement_type = random.choice(engagement_types)

        video_completion_rate = round(random.uniform(0.2, 1.0), 3)
        assignment_submission_rate = round(random.uniform(0.1, 1.0), 3)
        discussion_participation = random.randint(0, 25)
        help_seeking_frequency = random.randint(0, 10)
        peer_interaction_score = round(random.uniform(0.0, 1.0), 3)

        average_attempt_count = round(random.uniform(1.0, 5.0), 2)
        difficulty_rating = round(random.uniform(1.0, 5.0), 1)
        concept_mastery_score = round(random.uniform(0.3, 1.0), 3)
        learning_velocity = round(random.uniform(0.5, 2.0), 3)
        stuck_indicator = random.choice([True, False])

        learner_type = random.choice(learner_types)
        time_zone = random.choice(timezones)
        device_preference = random.choice(devices)

        enrollment_date = datetime.now() - timedelta(days=random.randint(1, 365))
        expected_completion_date = enrollment_date + timedelta(days=random.randint(30, 180))

        # Risk score
        risk_factors = []
        if module_progress < 0.3: risk_factors.append(0.4)
        elif module_progress < 0.6: risk_factors.append(0.2)

        if time_since_last_activity > 14: risk_factors.append(0.5)
        elif time_since_last_activity > 7: risk_factors.append(0.3)

        if login_frequency < 2: risk_factors.append(0.3)
        elif session_duration < 15: risk_factors.append(0.2)

        if quiz_score < 0.6: risk_factors.append(0.3)
        if average_attempt_count > 3: risk_factors.append(0.2)
        if stuck_indicator: risk_factors.append(0.2)

        if assignment_submission_rate < 0.5: risk_factors.append(0.2)
        if help_seeking_frequency == 0 and difficulty_rating > 3: risk_factors.append(0.2)

        risk_score = round(min(sum(risk_factors), 1.0) + random.uniform(-0.1, 0.1), 3)
        risk_score = max(0.0, min(1.0, risk_score))
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
    return data

def create_indexes():
    with engine.connect() as conn:
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_learner_id ON learner_activity(learner_id);",
            "CREATE INDEX IF NOT EXISTS idx_course_id ON learner_activity(course_id);",
            "CREATE INDEX IF NOT EXISTS idx_risk_score ON learner_activity(risk_score);",
            "CREATE INDEX IF NOT EXISTS idx_is_high_risk ON learner_activity(is_high_risk);",
            "CREATE INDEX IF NOT EXISTS idx_last_activity ON learner_activity(time_since_last_activity);",
            "CREATE INDEX IF NOT EXISTS idx_created_at ON learner_activity(created_at);"
        ]
        for sql in indexes:
            try:
                conn.execute(text(sql))
                print(f"✅ Index created: {sql.split('ON')[1].split('(')[0].strip()}")
            except Exception as e:
                print(f"⚠️ Index creation warning: {e}")
        conn.commit()

def seed_enhanced_database():
    if not test_connection():
        return

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables ready")

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        print("Clearing old data...")
        db.query(LearnerActivity).delete()
        db.commit()

        data = generate_enhanced_data()
        batch_size = 1000
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            db.bulk_insert_mappings(LearnerActivity, batch)
            db.commit()
            print(f"✅ Inserted batch {i//batch_size + 1}")

        create_indexes()

        total_count = db.query(LearnerActivity).count()
        high_risk_count = db.query(LearnerActivity).filter(LearnerActivity.is_high_risk == True).count()
        avg_risk_score = db.query(func.avg(LearnerActivity.risk_score)).scalar()

        print(f"\n📊 Stats: {total_count} records | {high_risk_count} high-risk ({high_risk_count/total_count*100:.1f}%) | Avg risk {avg_risk_score:.3f}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding: {e}")
        raise
    finally:
        db.close()

# ----------------------------
# Run
# ----------------------------
if __name__ == "__main__":
    print("🚀 Seeding Supabase PostgreSQL...")
    seed_enhanced_database()
    print("✅ Done")
