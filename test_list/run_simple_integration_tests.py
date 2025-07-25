#!/usr/bin/env python3
"""
Simplified Integration Test Runner - Windows Compatible
"""

import asyncio
import aiohttp
import csv
import subprocess
import os
import sys
import time
from datetime import datetime

class SimpleIntegrationTestRunner:
    def __init__(self, base_url="http://localhost:3005"):
        self.base_url = base_url
        self.backend_process = None
        
    def get_integration_tests(self):
        """Integration test scenarios"""
        return [
            {
                'id': 'IT-AD-001',
                'name': 'Product Search API-DB Integration',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': 'Create Test Data', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 1001, 'name': 'Premium Product', 'price': 3000}, 'expected': 200},
                    {'step': 2, 'name': 'Search Product', 'method': 'GET', 'endpoint': '/api/products?q=Premium', 'expected': 200},
                    {'step': 3, 'name': 'Cleanup Data', 'method': 'DELETE', 'endpoint': '/api/TestTable/1001', 'expected': 200}
                ]
            },
            {
                'id': 'IT-AD-002',
                'name': 'TestTable CRUD Integration Flow',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': 'Create', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 1002, 'name': 'Integration Test Product', 'price': 1500}, 'expected': 200},
                    {'step': 2, 'name': 'Verify', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
                    {'step': 3, 'name': 'Update', 'method': 'PUT', 'endpoint': '/api/TestTable/1002', 'body': {'name': 'Updated Product', 'price': 2000}, 'expected': 200},
                    {'step': 4, 'name': 'Delete', 'method': 'DELETE', 'endpoint': '/api/TestTable/1002', 'expected': 200}
                ]
            },
            {
                'id': 'IT-OM-001',
                'name': 'Order Creation to Update Flow',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': 'Create Order', 'method': 'POST', 'endpoint': '/api/orders', 'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}, 'expected': 200},
                    {'step': 2, 'name': 'Get Orders', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
                    {'step': 3, 'name': 'Update Order Status', 'method': 'PUT', 'endpoint': '/api/orders/1', 'body': {'status': 'confirmed'}, 'expected': 200},
                    {'step': 4, 'name': 'Update Payment', 'method': 'PUT', 'endpoint': '/api/payments/1', 'body': {'status': 'completed'}, 'expected': 200},
                    {'step': 5, 'name': 'Update Shipping', 'method': 'PUT', 'endpoint': '/api/shipments/1', 'body': {'status': 'in_transit'}, 'expected': 200}
                ]
            },
            {
                'id': 'IT-CC-001',
                'name': 'Concurrent Request Processing',
                'scenario': 'concurrent',
                'concurrent_requests': [
                    {'name': 'Product Search 1', 'method': 'GET', 'endpoint': '/api/products?q=', 'expected': 200},
                    {'name': 'Product Search 2', 'method': 'GET', 'endpoint': '/api/products?q=Premium', 'expected': 200},
                    {'name': 'TestTable Get', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
                    {'name': 'Orders Get', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
                    {'name': 'Health Check', 'method': 'GET', 'endpoint': '/health', 'expected': 200}
                ]
            },
            {
                'id': 'IT-ER-001',
                'name': 'Error Handling Integration',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': 'Nonexistent Resource', 'method': 'GET', 'endpoint': '/api/TestTable/99999', 'expected': 404},
                    {'step': 2, 'name': 'Invalid Data POST', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'invalid': 'data'}, 'expected': 400},
                    {'step': 3, 'name': 'Update Nonexistent', 'method': 'PUT', 'endpoint': '/api/TestTable/99999', 'body': {'name': 'test', 'price': 100}, 'expected': 404},
                    {'step': 4, 'name': 'Delete Nonexistent', 'method': 'DELETE', 'endpoint': '/api/TestTable/99999', 'expected': 404}
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
    
    async def execute_single_request(self, request):
        """Execute single request"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{request['endpoint']}"
                method = request['method']
                body = request.get('body')
                expected = request['expected']
                
                kwargs = {'timeout': aiohttp.ClientTimeout(total=10)}
                if body:
                    kwargs['json'] = body
                
                async with session.request(method, url, **kwargs) as response:
                    response_time = int((time.time() - start_time) * 1000)
                    status_code = response.status
                    response_text = await response.text()
                    
                    success = status_code == expected
                    
                    return {
                        'name': request.get('name', 'Unknown'),
                        'method': method,
                        'endpoint': request['endpoint'],
                        'expected_status': expected,
                        'actual_status': status_code,
                        'response_time_ms': response_time,
                        'success': success,
                        'error_message': None if success else f"Expected {expected}, got {status_code}",
                        'response_size': len(response_text)
                    }
                    
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                'name': request.get('name', 'Unknown'),
                'method': request['method'],
                'endpoint': request['endpoint'],
                'expected_status': request['expected'],
                'actual_status': None,
                'response_time_ms': response_time,
                'success': False,
                'error_message': str(e),
                'response_size': 0
            }
    
    async def execute_multi_step_test(self, test):
        """Execute multi-step test"""
        print(f"  [RUNNING] Executing multi-step: {test['name']}")
        
        step_results = []
        overall_success = True
        total_time = 0
        
        for step in test['steps']:
            step_result = await self.execute_single_request(step)
            step_results.append(step_result)
            total_time += step_result['response_time_ms']
            
            if not step_result['success']:
                overall_success = False
                print(f"    [FAIL] Step {step['step']}: {step['name']} - {step_result['error_message']}")
            else:
                print(f"    [PASS] Step {step['step']}: {step['name']} ({step_result['response_time_ms']}ms)")
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'scenario_type': 'multi_step',
            'total_steps': len(test['steps']),
            'passed_steps': sum(1 for r in step_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else f"Failed steps: {[i+1 for i, r in enumerate(step_results) if not r['success']]}",
            'timestamp': datetime.now().isoformat()
        }
    
    async def execute_concurrent_test(self, test):
        """Execute concurrent test"""
        print(f"  [RUNNING] Executing concurrent: {test['name']}")
        
        start_time = time.time()
        tasks = [self.execute_single_request(req) for req in test['concurrent_requests']]
        results = await asyncio.gather(*tasks)
        total_time = int((time.time() - start_time) * 1000)
        
        success_count = sum(1 for r in results if r['success'])
        overall_success = success_count == len(results)
        
        for i, result in enumerate(results):
            status = "[PASS]" if result['success'] else "[FAIL]"
            print(f"    {status} Request {i+1}: {result['name']} ({result['response_time_ms']}ms)")
        
        return {
            'test_id': test['id'],
            'test_name': test['name'],
            'scenario_type': 'concurrent',
            'total_requests': len(test['concurrent_requests']),
            'successful_requests': success_count,
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else f"Failed requests: {len(results) - success_count}",
            'timestamp': datetime.now().isoformat()
        }
    
    async def run_tests(self):
        """Run all integration tests"""
        tests = self.get_integration_tests()
        
        print(f"\n[TESTS] Running {len(tests)} integration test scenarios...")
        print("=" * 80)
        
        results = []
        
        for test in tests:
            print(f"\n[TEST] {test['id']}: {test['name']}")
            
            if test['scenario'] == 'multi_step':
                result = await self.execute_multi_step_test(test)
            elif test['scenario'] == 'concurrent':
                result = await self.execute_concurrent_test(test)
            else:
                result = {
                    'test_id': test['id'],
                    'test_name': test['name'],
                    'success': False,
                    'error_message': f"Unknown scenario type: {test['scenario']}"
                }
            
            results.append(result)
        
        # Summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print(f"[RESULTS] Integration Test Summary")
        print("=" * 80)
        print(f"Total Scenarios: {total_tests}")
        print(f"Passed:         {passed_tests}")
        print(f"Failed:         {failed_tests}")
        print(f"Success Rate:   {success_rate:.1f}%")
        
        return results, success_rate >= 85
    
    def save_results(self, results, filename="integration_test_results.csv"):
        """Save results to CSV"""
        # Flatten results for CSV
        flat_results = []
        for result in results:
            base_result = {
                'test_id': result['test_id'],
                'test_name': result['test_name'],
                'scenario_type': result.get('scenario_type', 'unknown'),
                'response_time_ms': result.get('response_time_ms', 0),
                'success': result['success'],
                'error_message': result.get('error_message', ''),
                'timestamp': result.get('timestamp', datetime.now().isoformat())
            }
            flat_results.append(base_result)
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['test_id', 'test_name', 'scenario_type', 'response_time_ms', 
                         'success', 'error_message', 'timestamp']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(flat_results)
        
        print(f"\n[SAVE] Results saved to: {filename}")
    
    async def run_full_suite(self):
        """Run complete integration test suite"""
        print("[INTEGRATION] === INTEGRATION TEST AUTOMATION ===")
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
            filename = f"integration_test_results_{timestamp}.csv"
            self.save_results(results, filename)
            
            # Final report
            print(f"\n[COMPLETED] INTEGRATION TEST COMPLETED")
            print("=" * 80)
            print(f"[RESULTS] Final Results:")
            print(f"   Total Scenarios: {len(results)}")
            print(f"   Passed: {sum(1 for r in results if r['success'])}")
            print(f"   Failed: {sum(1 for r in results if not r['success'])}")
            print(f"   Success Rate: {sum(1 for r in results if r['success'])/len(results)*100:.1f}%")
            print(f"   Execution Time: {execution_time:.2f}s")
            print(f"   Report File: {filename}")
            
            if success:
                print(f"\n[SUCCESS] INTEGRATION TESTS PASSED! (>=85% success rate)")
                return True
            else:
                print(f"\n[WARNING] INTEGRATION TESTS NEED ATTENTION (<85% success rate)")
                return False
                
        finally:
            self.stop_backend_server()

async def main():
    runner = SimpleIntegrationTestRunner()
    success = await runner.run_full_suite()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())