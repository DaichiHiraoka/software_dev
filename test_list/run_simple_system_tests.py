#!/usr/bin/env python3
"""
Simplified System Test Runner - Windows Compatible
"""

import asyncio
import aiohttp
import csv
import subprocess
import os
import sys
import time
import json
from datetime import datetime

class SimpleSystemTestRunner:
    def __init__(self, base_url="http://localhost:3005"):
        self.base_url = base_url
        self.backend_process = None
        
    def get_system_tests(self):
        """System test scenarios"""
        return [
            {
                'id': 'ST-E2E-001',
                'name': 'Complete Order Processing Workflow',
                'category': 'E2E_WORKFLOW',
                'workflow_steps': [
                    {'step': 1, 'system': 'Customer', 'action': 'Product Search', 'method': 'GET', 'endpoint': '/api/products?q=', 'expected': 200},
                    {'step': 2, 'system': 'Customer', 'action': 'Create Order', 'method': 'POST', 'endpoint': '/api/orders', 'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}, 'expected': 200},
                    {'step': 3, 'system': 'OrderMgmt', 'action': 'Get Orders', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
                    {'step': 4, 'system': 'OrderMgmt', 'action': 'Confirm Order', 'method': 'PUT', 'endpoint': '/api/orders/1', 'body': {'status': 'confirmed'}, 'expected': 200},
                    {'step': 5, 'system': 'Accounting', 'action': 'Get Payments', 'method': 'GET', 'endpoint': '/api/payments', 'expected': 200},
                    {'step': 6, 'system': 'Accounting', 'action': 'Process Payment', 'method': 'PUT', 'endpoint': '/api/payments/1', 'body': {'status': 'completed'}, 'expected': 200},
                    {'step': 7, 'system': 'Shipping', 'action': 'Get Shipments', 'method': 'GET', 'endpoint': '/api/shipments', 'expected': 200},
                    {'step': 8, 'system': 'Shipping', 'action': 'Ship Order', 'method': 'PUT', 'endpoint': '/api/shipments/1', 'body': {'status': 'in_transit'}, 'expected': 200},
                    {'step': 9, 'system': 'Admin', 'action': 'Check Stats', 'method': 'GET', 'endpoint': '/api/stats', 'expected': 200}
                ]
            },
            {
                'id': 'ST-PF-001',
                'name': 'High Load Scenario Test',
                'category': 'PERFORMANCE',
                'load_tests': [
                    {'name': 'Concurrent Connections', 'concurrent_users': 10, 'duration_sec': 15, 'endpoint': '/api/TestTable'},
                    {'name': 'Mass Data Search', 'concurrent_users': 5, 'duration_sec': 10, 'endpoint': '/api/products?q='},
                    {'name': 'API Response Performance', 'requests': 50, 'max_response_time_ms': 1000, 'endpoint': '/health'}
                ]
            },
            {
                'id': 'ST-FT-001',
                'name': 'Fault Tolerance Test',
                'category': 'FAULT_TOLERANCE',
                'fault_scenarios': [
                    {'scenario': 'Invalid Request', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'invalid': True}, 'expected': 400},
                    {'scenario': 'Nonexistent Resource', 'method': 'GET', 'endpoint': '/api/TestTable/999999', 'expected': 404},
                    {'scenario': 'Method Mismatch', 'method': 'PATCH', 'endpoint': '/api/products', 'expected': 405}
                ]
            },
            {
                'id': 'ST-SC-001',
                'name': 'Security Verification',
                'category': 'SECURITY',
                'security_tests': [
                    {'test': 'SQL Injection Protection', 'method': 'GET', 'endpoint': "/api/products?q='; DROP TABLE TestTable; --", 'expected': 200},
                    {'test': 'XSS Protection', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 9999, 'name': '<script>alert("xss")</script>', 'price': 100}, 'expected': 200},
                    {'test': 'Invalid Content-Type', 'method': 'POST', 'endpoint': '/api/TestTable', 'headers': {'Content-Type': 'text/plain'}, 'body': 'invalid', 'expected': 400}
                ]
            },
            {
                'id': 'ST-DC-001',
                'name': 'System Data Consistency',
                'category': 'DATA_CONSISTENCY',
                'consistency_checks': [
                    {'check': 'TestTable Consistency', 'endpoints': ['/api/TestTable'], 'systems': ['All']},
                    {'check': 'Order Data Consistency', 'endpoints': ['/api/orders'], 'systems': ['Customer', 'OrderMgmt']},
                    {'check': 'Payment Data Consistency', 'endpoints': ['/api/payments'], 'systems': ['Accounting']},
                    {'check': 'Shipping Data Consistency', 'endpoints': ['/api/shipments'], 'systems': ['Shipping']}
                ]
            }
        ]
    
    async def start_backend_server(self):
        """Start backend server"""
        print("[SERVER] Starting backend server...")
        
        backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
        if not os.path.exists(os.path.join(backend_path, 'server2.js')):
            print("[ERROR] Backend server not found")
            return False
        
        try:
            self.backend_process = subprocess.Popen(
                ['node', 'server2.js'],
                cwd=backend_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            # Wait for server startup
            for i in range(15):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"{self.base_url}/health", timeout=aiohttp.ClientTimeout(total=3)) as response:
                            if response.status == 200:
                                print("[OK] Backend server started successfully")
                                return True
                except:
                    await asyncio.sleep(1)
                    
            print("[ERROR] Failed to start backend server")
            return False
            
        except Exception as e:
            print(f"[ERROR] Error starting backend server: {str(e)}")
            return False
    
    def stop_backend_server(self):
        """Stop backend server"""
        if self.backend_process:
            try:
                if os.name == 'nt':  # Windows
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.backend_process.pid)])
                else:
                    self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
                print("[STOP] Backend server stopped")
            except:
                if self.backend_process.poll() is None:
                    self.backend_process.kill()
    
    async def execute_single_request(self, request, timeout_override=None):
        """Execute single request"""
        start_time = time.time()
        
        try:
            timeout = timeout_override if timeout_override else 10
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{request['endpoint']}"
                method = request['method']
                body = request.get('body')
                headers = request.get('headers', {})
                expected = request['expected']
                
                kwargs = {'timeout': aiohttp.ClientTimeout(total=timeout), 'headers': headers}
                if body:
                    if isinstance(body, str):
                        kwargs['data'] = body
                    else:
                        kwargs['json'] = body
                
                async with session.request(method, url, **kwargs) as response:
                    response_time = int((time.time() - start_time) * 1000)
                    status_code = response.status
                    response_text = await response.text()
                    
                    # Check expected status (can be list for multiple valid statuses)
                    if isinstance(expected, list):
                        success = status_code in expected
                    else:
                        success = status_code == expected
                    
                    return {
                        'name': request.get('name', request.get('action', 'Unknown')),
                        'method': method,
                        'endpoint': request['endpoint'],
                        'expected_status': expected,
                        'actual_status': status_code,
                        'response_time_ms': response_time,
                        'success': success,
                        'error_message': None if success else f"Expected {expected}, got {status_code}",
                        'response_size': len(response_text)
                    }
                    
        except asyncio.TimeoutError:
            response_time = int((time.time() - start_time) * 1000)
            expected_timeout = request['expected'] == 'timeout'
            return {
                'name': request.get('name', request.get('action', 'Unknown')),
                'method': request['method'],
                'endpoint': request['endpoint'],
                'expected_status': request['expected'],
                'actual_status': 'timeout',
                'response_time_ms': response_time,
                'success': expected_timeout,
                'error_message': None if expected_timeout else "Request timeout",
                'response_size': 0
            }
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                'name': request.get('name', request.get('action', 'Unknown')),
                'method': request['method'],
                'endpoint': request['endpoint'],
                'expected_status': request['expected'],
                'actual_status': None,
                'response_time_ms': response_time,
                'success': False,
                'error_message': str(e),
                'response_size': 0
            }
    
    async def execute_workflow_test(self, test):
        """Execute workflow test"""
        print(f"  [RUNNING] Executing workflow: {test['name']}")
        
        step_results = []
        overall_success = True
        total_time = 0
        
        for step in test['workflow_steps']:
            step_result = await self.execute_single_request(step)
            step_results.append(step_result)
            total_time += step_result['response_time_ms']
            
            if not step_result['success']:
                overall_success = False
                print(f"    [FAIL] Step {step['step']} ({step['system']}): {step['action']} - {step_result['error_message']}")
            else:
                print(f"    [PASS] Step {step['step']} ({step['system']}): {step['action']} ({step_result['response_time_ms']}ms)")
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'workflow',
            'total_steps': len(test['workflow_steps']),
            'passed_steps': sum(1 for r in step_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else f"Failed steps: {[i+1 for i, r in enumerate(step_results) if not r['success']]}",
            'timestamp': datetime.now().isoformat()
        }
    
    async def execute_load_test(self, test):
        """Execute load test"""
        print(f"  [RUNNING] Executing load test: {test['name']}")
        
        load_results = []
        overall_success = True
        total_time = 0
        
        for load_test in test['load_tests']:
            start_time = time.time()
            
            if 'concurrent_users' in load_test:
                # Concurrent user test
                duration = load_test['duration_sec']
                concurrent_users = load_test['concurrent_users']
                
                async def user_session():
                    session_results = []
                    session_start = time.time()
                    while time.time() - session_start < duration:
                        result = await self.execute_single_request({
                            'method': 'GET',
                            'endpoint': load_test['endpoint'],
                            'expected': 200
                        })
                        session_results.append(result)
                        await asyncio.sleep(0.1)  # 100ms interval
                    return session_results
                
                # Execute concurrent sessions
                tasks = [user_session() for _ in range(concurrent_users)]
                all_session_results = await asyncio.gather(*tasks)
                
                # Aggregate results
                all_results = [r for session in all_session_results for r in session]
                success_count = sum(1 for r in all_results if r['success'])
                total_requests = len(all_results)
                avg_response_time = sum(r['response_time_ms'] for r in all_results) / total_requests if total_requests > 0 else 0
                
                load_success = success_count / total_requests >= 0.95 if total_requests > 0 else False
                
            else:
                # Bulk request test
                requests_count = load_test['requests']
                max_response_time = load_test['max_response_time_ms']
                
                tasks = [self.execute_single_request({
                    'method': 'GET',
                    'endpoint': load_test['endpoint'],
                    'expected': 200
                }) for _ in range(requests_count)]
                
                all_results = await asyncio.gather(*tasks)
                success_count = sum(1 for r in all_results if r['success'] and r['response_time_ms'] <= max_response_time)
                total_requests = len(all_results)
                avg_response_time = sum(r['response_time_ms'] for r in all_results) / total_requests
                
                load_success = success_count / total_requests >= 0.95
            
            load_time = int((time.time() - start_time) * 1000)
            total_time += load_time
            
            result = {
                'test_name': load_test['name'],
                'total_requests': total_requests,
                'successful_requests': success_count,
                'success_rate': success_count / total_requests if total_requests > 0 else 0,
                'avg_response_time_ms': avg_response_time,
                'test_duration_ms': load_time,
                'success': load_success
            }
            load_results.append(result)
            
            if not load_success:
                overall_success = False
                print(f"    [FAIL] {load_test['name']}: {success_count}/{total_requests} requests succeeded ({success_count/total_requests*100:.1f}%)")
            else:
                print(f"    [PASS] {load_test['name']}: {success_count}/{total_requests} requests succeeded ({success_count/total_requests*100:.1f}%)")
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'load',
            'total_load_tests': len(test['load_tests']),
            'passed_load_tests': sum(1 for r in load_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Load test thresholds not met",
            'timestamp': datetime.now().isoformat()
        }
    
    async def execute_fault_test(self, test):
        """Execute fault tolerance test"""
        print(f"  [RUNNING] Executing fault tolerance: {test['name']}")
        
        fault_results = []
        overall_success = True
        total_time = 0
        
        for fault in test['fault_scenarios']:
            timeout_override = fault.get('timeout', None)
            result = await self.execute_single_request(fault, timeout_override)
            fault_results.append(result)
            total_time += result['response_time_ms']
            
            if not result['success']:
                overall_success = False
                print(f"    [FAIL] {fault['scenario']}: {result['error_message']}")
            else:
                print(f"    [PASS] {fault['scenario']}: Expected behavior confirmed")
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'fault_tolerance',
            'total_scenarios': len(test['fault_scenarios']),
            'passed_scenarios': sum(1 for r in fault_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Fault tolerance issues detected",
            'timestamp': datetime.now().isoformat()
        }
    
    async def execute_security_test(self, test):
        """Execute security test"""
        print(f"  [RUNNING] Executing security: {test['name']}")
        
        security_results = []
        overall_success = True
        total_time = 0
        
        for security_test in test['security_tests']:
            result = await self.execute_single_request(security_test)
            security_results.append(result)
            total_time += result['response_time_ms']
            
            if not result['success']:
                overall_success = False
                print(f"    [FAIL] {security_test['test']}: {result['error_message']}")
            else:
                print(f"    [PASS] {security_test['test']}: Security requirement met")
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'security',
            'total_tests': len(test['security_tests']),
            'passed_tests': sum(1 for r in security_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Security vulnerabilities detected",
            'timestamp': datetime.now().isoformat()
        }
    
    async def execute_consistency_test(self, test):
        """Execute data consistency test"""
        print(f"  [RUNNING] Executing consistency: {test['name']}")
        
        consistency_results = []
        overall_success = True
        total_time = 0
        
        for check in test['consistency_checks']:
            # Access same endpoint multiple times to check consistency
            check_results = []
            for endpoint in check['endpoints']:
                result1 = await self.execute_single_request({'method': 'GET', 'endpoint': endpoint, 'expected': 200})
                await asyncio.sleep(0.1)  # Small delay
                result2 = await self.execute_single_request({'method': 'GET', 'endpoint': endpoint, 'expected': 200})
                
                # Simple consistency check (response size should be similar)
                consistent = result1['response_size'] == result2['response_size'] and result1['success'] and result2['success']
                
                check_result = {
                    'check_name': check['check'],
                    'endpoint': endpoint,
                    'consistent': consistent
                }
                check_results.append(check_result)
                total_time += result1['response_time_ms'] + result2['response_time_ms']
                
                if not consistent:
                    overall_success = False
                    print(f"    [FAIL] {check['check']} ({endpoint}): Data inconsistency detected")
                else:
                    print(f"    [PASS] {check['check']} ({endpoint}): Data consistent")
            
            consistency_results.append(check_results)
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'consistency',
            'total_checks': len(test['consistency_checks']),
            'passed_checks': sum(1 for checks in consistency_results for check in checks if check['consistent']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Data inconsistencies detected",
            'timestamp': datetime.now().isoformat()
        }
    
    async def run_tests(self):
        """Run all system tests"""
        tests = self.get_system_tests()
        
        print(f"\n[TESTS] Running {len(tests)} system test scenarios...")
        print("=" * 80)
        
        results = []
        
        for test in tests:
            print(f"\n[TEST] {test['id']}: {test['name']}")
            
            if test['category'] == 'E2E_WORKFLOW':
                result = await self.execute_workflow_test(test)
            elif test['category'] == 'PERFORMANCE':
                result = await self.execute_load_test(test)
            elif test['category'] == 'FAULT_TOLERANCE':
                result = await self.execute_fault_test(test)
            elif test['category'] == 'SECURITY':
                result = await self.execute_security_test(test)
            elif test['category'] == 'DATA_CONSISTENCY':
                result = await self.execute_consistency_test(test)
            else:
                result = {
                    'test_id': test['id'],
                    'test_name': test['name'],
                    'success': False,
                    'error_message': f"Unknown test category: {test['category']}"
                }
            
            results.append(result)
        
        # Summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print(f"[RESULTS] System Test Summary")
        print("=" * 80)
        print(f"Total Scenarios: {total_tests}")
        print(f"Passed:         {passed_tests}")
        print(f"Failed:         {failed_tests}")
        print(f"Success Rate:   {success_rate:.1f}%")
        
        return results, success_rate >= 80
    
    def save_results(self, results, filename="system_test_results.csv"):
        """Save results to CSV"""
        flat_results = []
        for result in results:
            base_result = {
                'test_id': result['test_id'],
                'test_name': result['test_name'],
                'test_type': result.get('test_type', 'unknown'),
                'response_time_ms': result.get('response_time_ms', 0),
                'success': result['success'],
                'error_message': result.get('error_message', ''),
                'timestamp': result.get('timestamp', datetime.now().isoformat())
            }
            flat_results.append(base_result)
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['test_id', 'test_name', 'test_type', 'response_time_ms', 
                         'success', 'error_message', 'timestamp']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(flat_results)
        
        print(f"\n[SAVE] Results saved to: {filename}")
    
    async def run_full_suite(self):
        """Run complete system test suite"""
        print("[SYSTEM] === SYSTEM TEST AUTOMATION ===")
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Start backend server
        if not await self.start_backend_server():
            print("[ERROR] Cannot start backend server. Aborting tests.")
            return False
        
        try:
            # Run tests
            start_time = time.time()
            results, success = await self.run_tests()
            execution_time = time.time() - start_time
            
            # Save results
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"system_test_results_{timestamp}.csv"
            self.save_results(results, filename)
            
            # Final report
            print(f"\n[COMPLETED] SYSTEM TEST COMPLETED")
            print("=" * 80)
            print(f"[RESULTS] Final Results:")
            print(f"   Total Scenarios: {len(results)}")
            print(f"   Passed: {sum(1 for r in results if r['success'])}")
            print(f"   Failed: {sum(1 for r in results if not r['success'])}")
            print(f"   Success Rate: {sum(1 for r in results if r['success'])/len(results)*100:.1f}%")
            print(f"   Execution Time: {execution_time:.2f}s")
            print(f"   Report File: {filename}")
            
            if success:
                print(f"\n[SUCCESS] SYSTEM TESTS PASSED! (>=80% success rate)")
                return True
            else:
                print(f"\n[WARNING] SYSTEM TESTS NEED ATTENTION (<80% success rate)")
                return False
                
        finally:
            self.stop_backend_server()

async def main():
    runner = SimpleSystemTestRunner()
    success = await runner.run_full_suite()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())