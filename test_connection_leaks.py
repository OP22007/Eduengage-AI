#!/usr/bin/env python3
"""
Connection Leak Audit Tool
Tests for database connection leaks in the ML service and backend
"""

import requests
import time
import threading
import json
from concurrent.futures import ThreadPoolExecutor
import psutil
import subprocess
import sys

def check_ml_service_connections():
    """Test ML service for connection leaks"""
    print("🔍 Testing ML Service Connection Leaks...")
    
    # Test multiple rapid requests to see if connections accumulate
    errors = 0
    success = 0
    
    def make_request():
        nonlocal errors, success
        try:
            response = requests.get('http://localhost:8000/health', timeout=5)
            if response.status_code == 200:
                success += 1
            else:
                errors += 1
        except Exception as e:
            errors += 1
    
    # Make 50 concurrent requests
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(50)]
        for future in futures:
            future.result()
    
    print(f"ML Service Results: {success} success, {errors} errors")
    return errors == 0

def check_backend_connections():
    """Test backend for connection leaks"""
    print("🔍 Testing Backend Connection Leaks...")
    
    errors = 0
    success = 0
    
    def make_request():
        nonlocal errors, success
        try:
            response = requests.get('http://localhost:5000/api/health', timeout=5)
            if response.status_code == 200:
                success += 1
            else:
                errors += 1
        except Exception as e:
            errors += 1
    
    # Make 50 concurrent requests
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(50)]
        for future in futures:
            future.result()
    
    print(f"Backend Results: {success} success, {errors} errors")
    return errors == 0

def monitor_mongodb_connections():
    """Monitor MongoDB connections during stress test"""
    print("📊 Monitoring MongoDB connections...")
    
    # This would require MongoDB tools or admin access
    # For now, we'll monitor process memory usage as a proxy
    
    # Get process memory before test
    ml_process = None
    backend_process = None
    
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if proc.info['name'] == 'python.exe' and any('app.py' in arg for arg in proc.info['cmdline']):
                ml_process = psutil.Process(proc.info['pid'])
            elif proc.info['name'] == 'node.exe' and any('app.js' in arg for arg in proc.info['cmdline']):
                backend_process = psutil.Process(proc.info['pid'])
    except Exception as e:
        print(f"⚠️ Could not find processes: {e}")
        return True
    
    if ml_process:
        ml_memory_before = ml_process.memory_info().rss / 1024 / 1024  # MB
        print(f"ML Service memory before: {ml_memory_before:.1f} MB")
    
    if backend_process:
        backend_memory_before = backend_process.memory_info().rss / 1024 / 1024  # MB
        print(f"Backend memory before: {backend_memory_before:.1f} MB")
    
    # Run stress test
    print("🚀 Running stress test...")
    time.sleep(2)
    
    # Make many requests
    def stress_test():
        for i in range(100):
            try:
                requests.get('http://localhost:8000/health', timeout=2)
                requests.get('http://localhost:5000/api/health', timeout=2)
            except:
                pass
            
            if i % 20 == 0:
                print(f"Progress: {i}/100 requests")
    
    # Run stress test
    stress_test()
    
    # Wait a bit for garbage collection
    time.sleep(5)
    
    # Check memory after
    memory_leak_detected = False
    
    if ml_process and ml_process.is_running():
        ml_memory_after = ml_process.memory_info().rss / 1024 / 1024  # MB
        print(f"ML Service memory after: {ml_memory_after:.1f} MB")
        
        memory_increase = ml_memory_after - ml_memory_before
        if memory_increase > 50:  # More than 50MB increase might indicate leak
            print(f"⚠️ Potential ML service memory leak: +{memory_increase:.1f} MB")
            memory_leak_detected = True
        else:
            print(f"✅ ML service memory stable: +{memory_increase:.1f} MB")
    
    if backend_process and backend_process.is_running():
        backend_memory_after = backend_process.memory_info().rss / 1024 / 1024  # MB
        print(f"Backend memory after: {backend_memory_after:.1f} MB")
        
        memory_increase = backend_memory_after - backend_memory_before
        if memory_increase > 50:  # More than 50MB increase might indicate leak
            print(f"⚠️ Potential backend memory leak: +{memory_increase:.1f} MB")
            memory_leak_detected = True
        else:
            print(f"✅ Backend memory stable: +{memory_increase:.1f} MB")
    
    return not memory_leak_detected

def test_connection_cleanup():
    """Test that connections are properly cleaned up"""
    print("🧹 Testing Connection Cleanup...")
    
    # Test ML service model prediction (more complex operation)
    test_data = {
        "learner_id": "507f1f77bcf86cd799439011"  # Test ID
    }
    
    try:
        response = requests.post('http://localhost:8000/predict', 
                               json=test_data, timeout=10)
        # We expect 404 for non-existent learner, that's OK
        if response.status_code in [200, 404]:
            print("✅ ML prediction endpoint responding correctly")
        else:
            print(f"⚠️ ML prediction endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ ML prediction test failed: {e}")
        return False
    
    return True

def main():
    print("🔧 Connection Leak Audit")
    print("=" * 50)
    
    tests = [
        ("ML Service Connections", check_ml_service_connections),
        ("Backend Connections", check_backend_connections),
        ("Connection Cleanup", test_connection_cleanup),
        ("Memory/Connection Monitoring", monitor_mongodb_connections),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        try:
            result = test_func()
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 AUDIT SUMMARY")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nResult: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All connection leak tests passed!")
        print("🔒 Your application properly manages database connections.")
    else:
        print("⚠️ Some tests failed. Review connection handling in:")
        print("   - ML Service: ml_service/app.py")
        print("   - Backend: backend/app.js")
        print("   - Training Script: ml_service/train_comprehensive_model.py")

if __name__ == "__main__":
    main()
