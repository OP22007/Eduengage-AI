import React from 'react';

const mockCourses = [
  {
    title: 'Introduction to Artificial Intelligence',
    image: '/ai-course.jpg',
    deadline: '2025-09-15',
    description: 'Learn the basics of AI, including machine learning, neural networks, and real-world applications. No prior experience required.',
    message: 'You are doing great! Keep learning and growing.'
  },
  {
    title: 'Full Stack Web Development',
    image: '/webdev-course.jpg',
    deadline: '2025-09-20',
    description: 'Master HTML, CSS, JavaScript, React, and Node.js to build modern web applications from scratch.',
    message: 'Every step you take brings you closer to your goals!'
  },
  {
    title: 'Data Science Essentials',
    image: '/datascience-course.jpg',
    deadline: '2025-09-25',
    description: 'Explore data analysis, visualization, and machine learning using Python and real-world datasets.',
    message: 'Believe in yourself, you are capable of amazing things.'
  },
  {
    title: 'UI/UX Design Fundamentals',
    image: '/uiux-course.jpg',
    deadline: '2025-09-28',
    description: 'Understand the principles of user interface and user experience design to create beautiful, user-friendly products.',
    message: 'Your creativity can change the world. Keep designing!'
  }
];

export default function MockCoursesPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', background: 'linear-gradient(120deg, #f0f4ff 0%, #f9f9f9 100%)', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', color: '#1a237e' }}>Featured Courses</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {mockCourses.map((course, idx) => (
          <div
            key={idx}
            className="mock-course-card"
            style={{
              boxShadow: '0 4px 24px rgba(30, 64, 175, 0.08)',
              borderRadius: '16px',
              background: '#fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '450px',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
          >
      <style>{`
        .mock-course-card:hover {
          transform: translateY(-6px) scale(1.02);
        }
      `}</style>
            <div style={{ height: '180px', background: '#e3eafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={course.image} alt={course.title} style={{ maxHeight: '160px', maxWidth: '90%', objectFit: 'cover', borderRadius: '12px' }} />
            </div>
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#3949ab', fontSize: '1.4rem' }}>{course.title}</h2>
              <p style={{ color: '#616161', margin: '0 0 1rem 0', fontSize: '1rem' }}>{course.description}</p>
              <div style={{ marginTop: 'auto' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}><span style={{ color: '#1976d2' }}>Deadline:</span> {course.deadline}</p>
                <p style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1.05rem' }}>{course.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Performance Graph Section */}
      <section style={{ maxWidth: '700px', margin: '3rem auto 0', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(30, 64, 175, 0.06)', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', color: '#1a237e', marginBottom: '1.5rem' }}>Your Consistency Performance</h2>
        <p style={{ textAlign: 'center', color: '#616161', marginBottom: '2rem' }}>
          Here’s a look at your learning consistency over the past weeks. Keep up the great work!
        </p>
        <MockPerformanceGraph />
      </section>
    </main>
  );
}

// Simple SVG line chart for mock performance
function MockPerformanceGraph() {
  // Mock data: consistency percentage for 7 weeks
  const data = [60, 70, 80, 75, 90, 95, 92];
  const maxVal = 100;
  const width = 600;
  const height = 200;
  const padding = 40;
  const points = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - ((val / maxVal) * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ display: 'block', margin: '0 auto', background: '#f5f7fa', borderRadius: '12px' }}>
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#bdbdbd" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#bdbdbd" strokeWidth="2" />
        {/* Line */}
        <polyline
          fill="none"
          stroke="#1976d2"
          strokeWidth="4"
          points={points}
        />
        {/* Points */}
        {data.map((val, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
          const y = height - padding - ((val / maxVal) * (height - 2 * padding));
          return (
            <circle key={i} cx={x} cy={y} r="7" fill="#42a5f5" stroke="#fff" strokeWidth="2" />
          );
        })}
        {/* Labels */}
        {data.map((val, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
          return (
            <text key={i} x={x} y={height - padding + 24} textAnchor="middle" fontSize="1rem" fill="#616161">{`W${i + 1}`}</text>
          );
        })}
        {/* Y-axis labels */}
        {[60, 80, 100].map((v, i) => (
          <text key={i} x={padding - 10} y={height - padding - ((v / maxVal) * (height - 2 * padding)) + 5} textAnchor="end" fontSize="0.95rem" fill="#616161">{v}%</text>
        ))}
      </svg>
      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#2e7d32', fontWeight: 500, fontSize: '1.1rem' }}>
        Awesome consistency! Your learning streak is impressive.
      </div>
    </div>
  );
}
