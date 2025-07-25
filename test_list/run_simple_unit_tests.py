#!/usr/bin/env python3
"""
Simplified Unit Test Runner - Windows Compatible
"""

import asyncio
import aiohttp
import csv
import subprocess
import os
import sys
import time
from datetime import datetime

class SimpleUnitTestRunner:
    def __init__(self, base_url="http://localhost:3005"):
        self.base_url = base_url
        self.backend_process = None
        
    def get_unit_tests(self):
        """Simple unit test cases"""
        return [
            {'id': 'UT-API-001', 'name': 'Product Search API', 'method': 'GET', 'endpoint': '/api/products?q=premium', 'expected': 200},
            {'id': 'UT-API-002', 'name': 'Product Search Empty', 'method': 'GET', 'endpoint': '/api/products?q=', 'expected': 200},
            {'id': 'UT-API-003', 'name': 'TestTable Get All', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
            {'id': 'UT-API-004', 'name': 'TestTable Create', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 9999, 'name': 'Test Product', 'price': 1000}, 'expected': 200},
            {'id': 'UT-API-005', 'name': 'TestTable Update', 'method': 'PUT', 'endpoint': '/api/TestTable/9999', 'body': {'name': 'Updated Product', 'price': 1500}, 'expected': 200},
            {'id': 'UT-API-006', 'name': 'TestTable Delete', 'method': 'DELETE', 'endpoint': '/api/TestTable/9999', 'expected': 200},
            {'id': 'UT-API-007', 'name': 'Orders List', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
            {'id': 'UT-API-008', 'name': 'Orders Create', 'method': 'POST', 'endpoint': '/api/orders', 'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}, 'expected': 200},
            {'id': 'UT-API-009', 'name': 'Payments List', 'method': 'GET', 'endpoint': '/api/payments', 'expected': 200},
            {'id': 'UT-API-010', 'name': 'Shipments List', 'method': 'GET', 'endpoint': '/api/shipments', 'expected': 200},
            {'id': 'UT-API-011', 'name': 'Stats API', 'method': 'GET', 'endpoint': '/api/stats', 'expected': 200},
            {'id': 'UT-API-012', 'name': 'Health Check', 'method': 'GET', 'endpoint': '/health', 'expected': 200},
            {'id': 'UT-API-013', 'name': 'Nonexistent Endpoint', 'method': 'GET', 'endpoint': '/api/nonexistent', 'expected': 404},
            {'id': 'UT-API-014', 'name': 'Invalid Method', 'method': 'PATCH', 'endpoint': '/api/products', 'expected': 405},
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
            for i in range(10):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(f"{self.base_url}/health", timeout=aiohttp.ClientTimeout(total=2)) as response:
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
    
    async def execute_test(self, test):
        """Execute single test"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{test['endpoint']}"
                method = test['method']
                body = test.get('body')
                expected = test['expected']
                
                kwargs = {'timeout': aiohttp.ClientTimeout(total=10)}
                if body:
                    kwargs['json'] = body
                
                async with session.request(method, url, **kwargs) as response:
                    response_time = int((time.time() - start_time) * 1000)
                    status_code = response.status
                    response_text = await response.text()
                    
                    success = status_code == expected
                    
                    return {
                        'test_id': test['id'],
                        'test_name': test['name'],
                        'method': method,
                        'endpoint': test['endpoint'],
                        'expected_status': expected,
                        'actual_status': status_code,
                        'response_time_ms': response_time,
                        'success': success,
                        'error_message': None if success else f"Expected {expected}, got {status_code}",
                        'timestamp': datetime.now().isoformat(),
                        'response_size': len(response_text)
                    }
                    
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                'test_id': test['id'],
                'test_name': test['name'],
                'method': test['method'],
                'endpoint': test['endpoint'],
                'expected_status': test['expected'],
                'actual_status': None,
                'response_time_ms': response_time,
                'success': False,
                'error_message': str(e),
                'timestamp': datetime.now().isoformat(),
                'response_size': 0
            }
    
    async def run_tests(self):
        """Run all tests"""
        tests = self.get_unit_tests()
        
        print(f"\n[TESTS] Running {len(tests)} unit tests...")
        print("=" * 60)
        
        # Execute tests concurrently
        tasks = [self.execute_test(test) for test in tests]
        results = await asyncio.gather(*tasks)
        
        # Display results
        for result in results:
            status = "[PASS]" if result['success'] else "[FAIL]"
            print(f"{status} {result['test_id']}: {result['test_name']} ({result['response_time_ms']}ms)")
        
        # Summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 60)
        print(f"[RESULTS] Unit Test Summary")
        print("=" * 60)
        print(f"Total Tests:    {total_tests}")
        print(f"Passed:         {passed_tests}")
        print(f"Failed:         {failed_tests}")
        print(f"Success Rate:   {success_rate:.1f}%")
        
        return results, success_rate >= 90
    
    def save_results(self, results, filename="unit_test_results.csv"):
        """Save results to CSV"""
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['test_id', 'test_name', 'method', 'endpoint', 'expected_status', 
                         'actual_status', 'response_time_ms', 'success', 'error_message', 
                         'timestamp', 'response_size']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        print(f"\n[SAVE] Results saved to: {filename}")
    
    async def run_full_suite(self):
        """Run complete test suite"""
        print("[UNIT] === UNIT TEST AUTOMATION ===")
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
            filename = f"unit_test_results_{timestamp}.csv"
            self.save_results(results, filename)
            
            # Final report
            print(f"\n[COMPLETED] UNIT TEST COMPLETED")
            print("=" * 60)
            print(f"[RESULTS] Final Results:")
            print(f"   Total Tests: {len(results)}")
            print(f"   Passed: {sum(1 for r in results if r['success'])}")
            print(f"   Failed: {sum(1 for r in results if not r['success'])}")
            print(f"   Success Rate: {sum(1 for r in results if r['success'])/len(results)*100:.1f}%")
            print(f"   Execution Time: {execution_time:.2f}s")
            print(f"   Report File: {filename}")
            
            if success:
                print(f"\n[SUCCESS] UNIT TESTS PASSED! (>=90% success rate)")
                return True
            else:
                print(f"\n[WARNING] UNIT TESTS NEED ATTENTION (<90% success rate)")
                return False
                
        finally:
            self.stop_backend_server()

async def main():
    runner = SimpleUnitTestRunner()
    success = await runner.run_full_suite()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())