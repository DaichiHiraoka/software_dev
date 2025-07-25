#!/usr/bin/env python3
"""
単体テスト自動実行スクリプト
Unit Test Automation Script
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

class UnitTestRunner:
    def __init__(self, base_url="http://localhost:3005", output_dir=None):
        self.base_url = base_url
        self.backend_process = None
        self.results = []
        self.output_dir = output_dir
        
    def get_unit_tests(self) -> List[Dict]:
        """単体テストケース定義"""
        return [
            # API単体テスト
            {'category': 'API', 'id': 'UT-API-001', 'name': '商品検索API', 'method': 'GET', 'endpoint': '/api/products?q=プレミアム', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-002', 'name': '商品検索API(空文字)', 'method': 'GET', 'endpoint': '/api/products?q=', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-003', 'name': '商品検索API(存在しない商品)', 'method': 'GET', 'endpoint': '/api/products?q=存在しない商品', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-004', 'name': 'TestTable全取得', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-005', 'name': 'TestTable新規作成', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 9999, 'name': 'テスト商品', 'price': 1000}, 'expected': 200},
            {'category': 'API', 'id': 'UT-API-006', 'name': 'TestTable更新', 'method': 'PUT', 'endpoint': '/api/TestTable/9999', 'body': {'name': '更新商品', 'price': 1500}, 'expected': 200},
            {'category': 'API', 'id': 'UT-API-007', 'name': 'TestTable削除', 'method': 'DELETE', 'endpoint': '/api/TestTable/9999', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-008', 'name': '注文一覧取得', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-009', 'name': '注文一覧取得(フィルタ)', 'method': 'GET', 'endpoint': '/api/orders?status=pending', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-010', 'name': '注文新規作成', 'method': 'POST', 'endpoint': '/api/orders', 'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}, 'expected': 200},
            {'category': 'API', 'id': 'UT-API-011', 'name': '注文ステータス更新', 'method': 'PUT', 'endpoint': '/api/orders/1', 'body': {'status': 'confirmed'}, 'expected': 200},
            {'category': 'API', 'id': 'UT-API-012', 'name': '支払い一覧取得', 'method': 'GET', 'endpoint': '/api/payments', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-013', 'name': '支払いステータス更新', 'method': 'PUT', 'endpoint': '/api/payments/1', 'body': {'status': 'completed'}, 'expected': 200},
            {'category': 'API', 'id': 'UT-API-014', 'name': '発送一覧取得', 'method': 'GET', 'endpoint': '/api/shipments', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-015', 'name': '発送ステータス更新', 'method': 'PUT', 'endpoint': '/api/shipments/1', 'body': {'status': 'in_transit'}, 'expected': 200},
            {'category': 'API', 'id': 'UT-API-016', 'name': '統計情報取得', 'method': 'GET', 'endpoint': '/api/stats', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-018', 'name': 'ヘルスチェック', 'method': 'GET', 'endpoint': '/health', 'expected': 200},
            {'category': 'API', 'id': 'UT-API-019', 'name': '存在しないエンドポイント', 'method': 'GET', 'endpoint': '/api/nonexistent', 'expected': 404},
            {'category': 'API', 'id': 'UT-API-020', 'name': '不正なメソッド', 'method': 'PATCH', 'endpoint': '/api/products', 'expected': 405},
            
            # データベース単体テスト（APIを通して）
            {'category': 'DB', 'id': 'UT-DB-001', 'name': 'データベース接続確認', 'method': 'GET', 'endpoint': '/health', 'expected': 200},
            {'category': 'DB', 'id': 'UT-DB-002', 'name': 'Products挿入確認', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 9998, 'name': 'DB テスト', 'price': 500}, 'expected': 200},
            {'category': 'DB', 'id': 'UT-DB-003', 'name': 'データ検索確認', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200},
            {'category': 'DB', 'id': 'UT-DB-004', 'name': 'データ更新確認', 'method': 'PUT', 'endpoint': '/api/TestTable/9998', 'body': {'name': 'DB更新テスト', 'price': 750}, 'expected': 200},
            {'category': 'DB', 'id': 'UT-DB-005', 'name': 'データ削除確認', 'method': 'DELETE', 'endpoint': '/api/TestTable/9998', 'expected': 200},
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
        
        print(f"[SERVER] {Colors.blue('Starting new backend server...')}")
        
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
        """バックエンドサーバー停止（自分で起動したプロセスのみ）"""
        if self.backend_process:
            try:
                if os.name == 'nt':  # Windows
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.backend_process.pid)])
                else:
                    self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
                print(f"[STOP] {Colors.yellow('Backend server stopped')}")
                self.backend_process = None
            except:
                if self.backend_process.poll() is None:
                    self.backend_process.kill()
                self.backend_process = None
        # 既存のサーバーを使用した場合は停止しない
    
    async def execute_test(self, test: Dict) -> Dict:
        """テスト実行"""
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
                        'category': test['category'],
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
                'category': test['category'],
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
    
    async def run_tests(self) -> List[Dict]:
        """全単体テスト実行"""
        tests = self.get_unit_tests()
        
        print(f"\n[TESTS] {Colors.blue('Running Unit Tests...')}")
        print(f"Total Tests: {Colors.cyan(str(len(tests)))}")
        print("=" * 80)
        
        # テスト実行
        tasks = [self.execute_test(test) for test in tests]
        results = await asyncio.gather(*tasks)
        
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
            
            # 結果表示
            status = "[PASS]" if result['success'] else "[FAIL]"
            print(f"{status} {result['test_id']}: {result['test_name']} ({result['response_time_ms']}ms)")
        
        # カテゴリ別サマリー
        print("\n" + "=" * 80)
        print(f"[RESULTS] {Colors.blue('Unit Test Results by Category')}")
        print("=" * 80)
        
        total_tests = len(results)
        total_passed = sum(1 for r in results if r['success'])
        total_failed = total_tests - total_passed
        
        for cat, stats in categories.items():
            success_rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"{cat:>3} Tests: {Colors.cyan(str(stats['total']).rjust(3))} | "
                  f"Passed: {Colors.green(str(stats['passed']).rjust(3))} | "
                  f"Failed: {Colors.red(str(stats['failed']).rjust(3))} | "
                  f"Rate: {Colors.yellow(f'{success_rate:5.1f}%')}")
        
        print("-" * 80)
        overall_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        print(f"{'Total':>3}: {Colors.cyan(str(total_tests).rjust(7))} | "
              f"Passed: {Colors.green(str(total_passed).rjust(3))} | "
              f"Failed: {Colors.red(str(total_failed).rjust(3))} | "
              f"Rate: {Colors.yellow(f'{overall_rate:5.1f}%')}")
        
        return results
    
    def save_results(self, results: List[Dict], filename: str = None):
        """結果保存"""
        # ファイル名が指定されていない場合、デフォルトのファイル名を使用
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"unit_test_results_{timestamp}.csv"
        
        # 出力ディレクトリが指定されている場合、そこに配置
        if self.output_dir:
            import os
            filename = os.path.join(self.output_dir, os.path.basename(filename))
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['category', 'test_id', 'test_name', 'method', 'endpoint', 
                         'expected_status', 'actual_status', 'response_time_ms', 
                         'success', 'error_message', 'timestamp', 'response_size']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        print(f"\n[SAVE] {Colors.green('Results saved to:')} {Colors.cyan(filename)}")
        return filename
    
    async def run_full_unit_test_suite(self):
        """完全自動単体テスト実行"""
        print(f"[UNIT TEST] {Colors.blue('=== UNIT TEST AUTOMATION ===')}")
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
            
            # 結果保存（出力ディレクトリを考慮）
            filename = self.save_results(results)
            
            # 最終レポート
            total_tests = len(results)
            passed_tests = sum(1 for r in results if r['success'])
            success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            
            print(f"\n[COMPLETED] {Colors.blue('UNIT TEST COMPLETED')}")
            print("=" * 80)
            print(f"[RESULTS] Final Results:")
            print(f"   Total Tests: {Colors.cyan(str(total_tests))}")
            print(f"   Passed: {Colors.green(str(passed_tests))}")
            print(f"   Failed: {Colors.red(str(total_tests - passed_tests))}")
            print(f"   Success Rate: {Colors.yellow(f'{success_rate:.1f}%')}")
            print(f"   Execution Time: {Colors.cyan(f'{execution_time:.2f}s')}")
            print(f"   Report File: {Colors.cyan(filename)}")
            
            # テスト合格判定
            if success_rate >= 90:
                print(f"\n[SUCCESS] {Colors.green('UNIT TESTS PASSED!')} (>=90% success rate)")
                return True
            else:
                print(f"\n[WARNING] {Colors.red('UNIT TESTS NEED ATTENTION')} (<90% success rate)")
                return False
                
        finally:
            self.stop_backend_server()

async def main():
    import argparse
    
    # コマンドライン引数を解析
    parser = argparse.ArgumentParser(description='Unit Test Runner')
    parser.add_argument('--output-dir', type=str, help='Output directory for CSV files')
    args = parser.parse_args()
    
    runner = UnitTestRunner(output_dir=args.output_dir)
    success = await runner.run_full_unit_test_suite()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())