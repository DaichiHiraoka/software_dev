#!/usr/bin/env python3
"""
結合テスト自動実行スクリプト
Integration Test Automation Script
"""

import asyncio
import aiohttp
import csv
import json
import time
import subprocess
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    
    @staticmethod
    def green(text): return f"{Colors.GREEN}{text}{Colors.RESET}"
    @staticmethod
    def red(text): return f"{Colors.RED}{text}{Colors.RESET}"
    @staticmethod
    def yellow(text): return f"{Colors.YELLOW}{text}{Colors.RESET}"
    @staticmethod
    def blue(text): return f"{Colors.BLUE}{text}{Colors.RESET}"
    @staticmethod
    def cyan(text): return f"{Colors.CYAN}{text}{Colors.RESET}"

class IntegrationTestRunner:
    def __init__(self, base_url="http://localhost:3005"):
        self.base_url = base_url
        self.backend_process = None
        self.results = []
        
    def get_integration_tests(self) -> List[Dict]:
        """結合テストシナリオ定義"""
        return [
            # API-DB連携テスト
            {
                'category': 'API-DB',
                'id': 'IT-AD-001',
                'name': '商品検索API-DB連携',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': 'データ投入', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 1001, 'name': 'プレミアム商品', 'price': 3000}, 'expected': 200},
                    {'step': 2, 'name': '検索実行', 'method': 'GET', 'endpoint': '/api/products?q=プレミアム', 'expected': 200},
                    {'step': 3, 'name': 'データ削除', 'method': 'DELETE', 'endpoint': '/api/TestTable/1001', 'expected': 200}
                ]
            },
            {
                'category': 'API-DB',
                'id': 'IT-AD-002',
                'name': 'TestTable CRUD連携フロー',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': '作成', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 1002, 'name': '結合テスト商品', 'price': 1500}, 'expected': 200},
                    {'step': 2, 'name': '確認', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200, 'validate': 'contains_id_1002'},
                    {'step': 3, 'name': '更新', 'method': 'PUT', 'endpoint': '/api/TestTable/1002', 'body': {'name': '更新済み商品', 'price': 2000}, 'expected': 200},
                    {'step': 4, 'name': '削除', 'method': 'DELETE', 'endpoint': '/api/TestTable/1002', 'expected': 200},
                    {'step': 5, 'name': '削除確認', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200, 'validate': 'not_contains_id_1002'}
                ]
            },
            
            # フロントエンド-バックエンド連携テスト（APIレベル）
            {
                'category': 'FE-BE',
                'id': 'IT-FE-001',
                'name': '商品一覧取得連携',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': 'テストデータ準備', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 2001, 'name': 'FE連携テスト', 'price': 500}, 'expected': 200},
                    {'step': 2, 'name': '商品一覧取得', 'method': 'GET', 'endpoint': '/api/products', 'expected': 200},
                    {'step': 3, 'name': 'TestTable一覧取得', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
                    {'step': 4, 'name': 'クリーンアップ', 'method': 'DELETE', 'endpoint': '/api/TestTable/2001', 'expected': 200}
                ]
            },
            
            # 注文処理連携テスト
            {
                'category': 'ORDER',
                'id': 'IT-OM-001',
                'name': '注文作成→更新フロー',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': '注文作成', 'method': 'POST', 'endpoint': '/api/orders', 'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}, 'expected': 200},
                    {'step': 2, 'name': '注文一覧確認', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
                    {'step': 3, 'name': '注文ステータス更新', 'method': 'PUT', 'endpoint': '/api/orders/1', 'body': {'status': 'confirmed'}, 'expected': 200},
                    {'step': 4, 'name': '支払いステータス更新', 'method': 'PUT', 'endpoint': '/api/payments/1', 'body': {'status': 'completed'}, 'expected': 200},
                    {'step': 5, 'name': '発送ステータス更新', 'method': 'PUT', 'endpoint': '/api/shipments/1', 'body': {'status': 'in_transit'}, 'expected': 200}
                ]
            },
            
            # エラーハンドリング連携テスト
            {
                'category': 'ERROR',
                'id': 'IT-ER-001',
                'name': 'エラーハンドリング連携',
                'scenario': 'multi_step',
                'steps': [
                    {'step': 1, 'name': '存在しないリソース取得', 'method': 'GET', 'endpoint': '/api/TestTable/99999', 'expected': 404},
                    {'step': 2, 'name': '不正データPOST', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'invalid': 'data'}, 'expected': 400},
                    {'step': 3, 'name': '存在しないリソース更新', 'method': 'PUT', 'endpoint': '/api/TestTable/99999', 'body': {'name': 'test', 'price': 100}, 'expected': 404},
                    {'step': 4, 'name': '存在しないリソース削除', 'method': 'DELETE', 'endpoint': '/api/TestTable/99999', 'expected': 404}
                ]
            },
            
            # 並行処理テスト
            {
                'category': 'CONCURRENT',
                'id': 'IT-CC-001',
                'name': '並行リクエスト処理',
                'scenario': 'concurrent',
                'concurrent_requests': [
                    {'name': '商品検索1', 'method': 'GET', 'endpoint': '/api/products?q=', 'expected': 200},
                    {'name': '商品検索2', 'method': 'GET', 'endpoint': '/api/products?q=プレミアム', 'expected': 200},
                    {'name': 'TestTable取得', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
                    {'name': '注文一覧取得', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
                    {'name': 'ヘルスチェック', 'method': 'GET', 'endpoint': '/health', 'expected': 200}
                ]
            },
            
            # パフォーマンステスト
            {
                'category': 'PERFORMANCE',
                'id': 'IT-PF-001',
                'name': 'レスポンス時間測定',
                'scenario': 'performance',
                'performance_tests': [
                    {'name': 'API応答時間', 'method': 'GET', 'endpoint': '/api/TestTable', 'max_time_ms': 1000, 'expected': 200},
                    {'name': '商品検索応答', 'method': 'GET', 'endpoint': '/api/products', 'max_time_ms': 2000, 'expected': 200},
                    {'name': 'ヘルスチェック応答', 'method': 'GET', 'endpoint': '/health', 'max_time_ms': 500, 'expected': 200}
                ]
            }
        ]
    
    async def check_server_running(self):
        """サーバーが既に起動されているかチェック"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health", timeout=aiohttp.ClientTimeout(total=2)) as response:
                    if response.status == 200:
                        return True
        except:
            pass
        return False

    async def start_backend_server(self):
        """バックエンドサーバー起動（既存サーバーチェック付き）"""
        print(f"[SERVER] {Colors.blue('Checking for existing backend server...')}")
        
        # 既存サーバーチェック
        if await self.check_server_running():
            print(f"[OK] {Colors.green('Backend server is already running')}")
            return True
        
        print(f"[START] {Colors.blue('Starting new backend server...')}")
        
        backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
        if not os.path.exists(os.path.join(backend_path, 'server2.js')):
            print(f"[ERROR] {Colors.red('Backend server not found at:')} {backend_path}")
            return False
        
        try:
            self.backend_process = subprocess.Popen(
                ['node', 'server2.js'],
                cwd=backend_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            # サーバー起動待機
            for i in range(10):
                if await self.check_server_running():
                    print(f"[OK] {Colors.green('Backend server started successfully')}")
                    return True
                await asyncio.sleep(1)
                    
            print(f"[ERROR] {Colors.red('Failed to start backend server')}")
            return False
            
        except Exception as e:
            print(f"[ERROR] {Colors.red('Error starting backend server:')} {str(e)}")
            return False
    
    def stop_backend_server(self):
        """バックエンドサーバー停止"""
        if self.backend_process:
            try:
                if os.name == 'nt':  # Windows
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.backend_process.pid)])
                else:
                    self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
                print(f"🛑 {Colors.yellow('Backend server stopped')}")
            except:
                if self.backend_process.poll() is None:
                    self.backend_process.kill()
    
    async def execute_single_request(self, request: Dict) -> Dict:
        """単一リクエスト実行"""
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
                    
                    # バリデーション実行
                    validation_error = None
                    if success and 'validate' in request:
                        if request['validate'] == 'contains_id_1002':
                            if '1002' not in response_text:
                                success = False
                                validation_error = "Response does not contain ID 1002"
                        elif request['validate'] == 'not_contains_id_1002':
                            if '1002' in response_text:
                                success = False
                                validation_error = "Response still contains ID 1002"
                    
                    return {
                        'name': request.get('name', 'Unknown'),
                        'method': method,
                        'endpoint': request['endpoint'],
                        'expected_status': expected,
                        'actual_status': status_code,
                        'response_time_ms': response_time,
                        'success': success,
                        'error_message': validation_error or (None if success else f"Expected {expected}, got {status_code}"),
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
    
    async def execute_multi_step_test(self, test: Dict) -> Dict:
        """マルチステップテスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing multi-step:')} {test['name']}")
        
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
                print(f"    [OK] Step {step['step']}: {step['name']} ({step_result['response_time_ms']}ms)")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'scenario_type': 'multi_step',
            'total_steps': len(test['steps']),
            'passed_steps': sum(1 for r in step_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else f"Failed steps: {[i+1 for i, r in enumerate(step_results) if not r['success']]}",
            'timestamp': datetime.now().isoformat(),
            'step_details': step_results
        }
    
    async def execute_concurrent_test(self, test: Dict) -> Dict:
        """並行処理テスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing concurrent:')} {test['name']}")
        
        start_time = time.time()
        tasks = [self.execute_single_request(req) for req in test['concurrent_requests']]
        results = await asyncio.gather(*tasks)
        total_time = int((time.time() - start_time) * 1000)
        
        success_count = sum(1 for r in results if r['success'])
        overall_success = success_count == len(results)
        
        for i, result in enumerate(results):
            status = "[OK]" if result['success'] else "[FAIL]"
            print(f"    {status} Request {i+1}: {result['name']} ({result['response_time_ms']}ms)")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'scenario_type': 'concurrent',
            'total_requests': len(test['concurrent_requests']),
            'successful_requests': success_count,
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else f"Failed requests: {len(results) - success_count}",
            'timestamp': datetime.now().isoformat(),
            'request_details': results
        }
    
    async def execute_performance_test(self, test: Dict) -> Dict:
        """パフォーマンステスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing performance:')} {test['name']}")
        
        perf_results = []
        overall_success = True
        total_time = 0
        
        for perf_test in test['performance_tests']:
            result = await self.execute_single_request(perf_test)
            max_time = perf_test.get('max_time_ms', 1000)
            
            perf_success = result['success'] and result['response_time_ms'] <= max_time
            if not perf_success:
                overall_success = False
                if result['response_time_ms'] > max_time:
                    result['error_message'] = f"Response time {result['response_time_ms']}ms exceeds limit {max_time}ms"
            
            perf_results.append({**result, 'performance_success': perf_success, 'max_time_ms': max_time})
            total_time += result['response_time_ms']
            
            status = "[OK]" if perf_success else "[FAIL]"
            print(f"    {status} {perf_test['name']}: {result['response_time_ms']}ms (limit: {max_time}ms)")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'scenario_type': 'performance',
            'total_tests': len(test['performance_tests']),
            'passed_tests': sum(1 for r in perf_results if r['performance_success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Performance thresholds exceeded",
            'timestamp': datetime.now().isoformat(),
            'performance_details': perf_results
        }
    
    async def run_tests(self) -> List[Dict]:
        """全結合テスト実行"""
        tests = self.get_integration_tests()
        
        print(f"\n[TESTS] {Colors.blue('Running Integration Tests...')}")
        print(f"Total Test Scenarios: {Colors.cyan(str(len(tests)))}")
        print("=" * 80)
        
        results = []
        
        for test in tests:
            print(f"\n[TEST] {Colors.blue(test['id'])}: {test['name']}")
            
            if test['scenario'] == 'multi_step':
                result = await self.execute_multi_step_test(test)
            elif test['scenario'] == 'concurrent':
                result = await self.execute_concurrent_test(test)
            elif test['scenario'] == 'performance':
                result = await self.execute_performance_test(test)
            else:
                result = {
                    'category': test['category'],
                    'test_id': test['id'],
                    'test_name': test['name'],
                    'success': False,
                    'error_message': f"Unknown scenario type: {test['scenario']}"
                }
            
            results.append(result)
        
        # カテゴリ別集計
        categories = {}
        for result in results:
            cat = result['category']
            if cat not in categories:
                categories[cat] = {'total': 0, 'passed': 0, 'failed': 0}
            categories[cat]['total'] += 1
            if result['success']:
                categories[cat]['passed'] += 1
            else:
                categories[cat]['failed'] += 1
        
        # サマリー表示
        print("\n" + "=" * 80)
        print(f"[RESULTS] {Colors.blue('Integration Test Results by Category')}")
        print("=" * 80)
        
        total_tests = len(results)
        total_passed = sum(1 for r in results if r['success'])
        total_failed = total_tests - total_passed
        
        for cat, stats in categories.items():
            success_rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"{cat:>12}: {Colors.cyan(str(stats['total']).rjust(2))} | "
                  f"Passed: {Colors.green(str(stats['passed']).rjust(2))} | "
                  f"Failed: {Colors.red(str(stats['failed']).rjust(2))} | "
                  f"Rate: {Colors.yellow(f'{success_rate:5.1f}%')}")
        
        print("-" * 80)
        overall_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        print(f"{'Total':>12}: {Colors.cyan(str(total_tests).rjust(2))} | "
              f"Passed: {Colors.green(str(total_passed).rjust(2))} | "
              f"Failed: {Colors.red(str(total_failed).rjust(2))} | "
              f"Rate: {Colors.yellow(f'{overall_rate:5.1f}%')}")
        
        return results
    
    def save_results(self, results: List[Dict], filename: str = "integration_test_results.csv"):
        """結果保存"""
        # 結果をフラット化してCSV保存用に変換
        flat_results = []
        for result in results:
            base_result = {
                'category': result['category'],
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
            fieldnames = ['category', 'test_id', 'test_name', 'scenario_type', 
                         'response_time_ms', 'success', 'error_message', 'timestamp']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(flat_results)
        
        print(f"\n[SAVE] {Colors.green('Results saved to:')} {Colors.cyan(filename)}")
    
    async def run_full_integration_test_suite(self):
        """完全自動結合テスト実行"""
        print(f"[INTEGRATION] {Colors.blue('=== INTEGRATION TEST AUTOMATION ===')}")
        print(f"Start Time: {Colors.cyan(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))}")
        
        # バックエンドサーバー起動
        if not await self.start_backend_server():
            print(f"[ERROR] {Colors.red('Cannot start backend server. Aborting tests.')}")
            return False
        
        try:
            # テスト実行
            start_time = time.time()
            results = await self.run_tests()
            execution_time = time.time() - start_time
            
            # 結果保存
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"integration_test_results_{timestamp}.csv"
            self.save_results(results, filename)
            
            # 最終レポート
            total_tests = len(results)
            passed_tests = sum(1 for r in results if r['success'])
            success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            
            print(f"\n[COMPLETED] {Colors.blue('INTEGRATION TEST COMPLETED')}")
            print("=" * 80)
            print(f"[SUMMARY] Final Results:")
            print(f"   Total Scenarios: {Colors.cyan(str(total_tests))}")
            print(f"   Passed: {Colors.green(str(passed_tests))}")
            print(f"   Failed: {Colors.red(str(total_tests - passed_tests))}")
            print(f"   Success Rate: {Colors.yellow(f'{success_rate:.1f}%')}")
            print(f"   Execution Time: {Colors.cyan(f'{execution_time:.2f}s')}")
            print(f"   Report File: {Colors.cyan(filename)}")
            
            # テスト合格判定
            if success_rate >= 85:
                print(f"\n[SUCCESS] {Colors.green('INTEGRATION TESTS PASSED!')} (>=85% success rate)")
                return True
            else:
                print(f"\n[WARNING] {Colors.red('INTEGRATION TESTS NEED ATTENTION')} (<85% success rate)")
                return False
                
        finally:
            self.stop_backend_server()

async def main():
    runner = IntegrationTestRunner()
    success = await runner.run_full_integration_test_suite()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())