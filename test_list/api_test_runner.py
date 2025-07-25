#!/usr/bin/env python3
"""
高性能APIテストランナー (Python版)
Rust版よりも実行が簡単で、同等の機能を提供
"""

import asyncio
import aiohttp
import csv
import json
import time
import argparse
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple
import sys
from dataclasses import dataclass, asdict

@dataclass
class TestResult:
    test_id: str
    test_name: str
    method: str
    endpoint: str
    status_code: Optional[int]
    response_time_ms: int
    success: bool
    error_message: Optional[str]
    timestamp: str
    response_size: int

@dataclass
class ApiTest:
    id: str
    name: str
    method: str
    endpoint: str
    body: Optional[Dict] = None
    expected_status: int = 200
    headers: Optional[Dict[str, str]] = None

class Colors:
    """コンソール出力用カラーコード"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
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

class ApiTestRunner:
    def __init__(self, base_url: str, timeout: int = 30, verbose: bool = False):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.verbose = verbose
        
    def create_test_suite(self) -> List[ApiTest]:
        """テストスイートの作成"""
        return [
            # Product Management API Tests
            ApiTest("UT-API-001", "商品検索API", "GET", "/api/products?q=プレミアム"),
            ApiTest("UT-API-002", "商品検索API(空文字)", "GET", "/api/products?q="),
            ApiTest("UT-API-003", "商品検索API(存在しない商品)", "GET", "/api/products?q=存在しない商品"),
            ApiTest("UT-API-004", "TestTable全取得", "GET", "/api/TestTable"),
            ApiTest(
                "UT-API-005", "TestTable新規作成", "POST", "/api/TestTable",
                body={"id": 9999, "name": "テスト商品", "price": 1000},
                headers={"Content-Type": "application/json"}
            ),
            ApiTest(
                "UT-API-006", "TestTable更新", "PUT", "/api/TestTable/9999",
                body={"name": "更新商品", "price": 1500},
                headers={"Content-Type": "application/json"}
            ),
            ApiTest("UT-API-007", "TestTable削除", "DELETE", "/api/TestTable/9999"),
            
            # Order Management API Tests
            ApiTest("UT-API-008", "注文一覧取得", "GET", "/api/orders"),
            ApiTest("UT-API-009", "注文一覧取得(フィルタ)", "GET", "/api/orders?status=pending"),
            ApiTest(
                "UT-API-010", "注文新規作成", "POST", "/api/orders",
                body={
                    "customer_id": 1,
                    "products": [{"product_id": 1, "quantity": 2}],
                    "total_amount": 2000
                },
                headers={"Content-Type": "application/json"}
            ),
            ApiTest(
                "UT-API-011", "注文ステータス更新", "PUT", "/api/orders/1",
                body={"status": "confirmed"},
                headers={"Content-Type": "application/json"}
            ),

            # Payment Management API Tests
            ApiTest("UT-API-012", "支払い一覧取得", "GET", "/api/payments"),
            ApiTest(
                "UT-API-013", "支払いステータス更新", "PUT", "/api/payments/1",
                body={"status": "completed"},
                headers={"Content-Type": "application/json"}
            ),

            # Shipping Management API Tests
            ApiTest("UT-API-014", "発送一覧取得", "GET", "/api/shipments"),
            ApiTest(
                "UT-API-015", "発送ステータス更新", "PUT", "/api/shipments/1",
                body={"status": "in_transit"},
                headers={"Content-Type": "application/json"}
            ),

            # Statistics API Tests
            ApiTest("UT-API-016", "統計情報取得", "GET", "/api/stats"),

            # System API Tests
            ApiTest("UT-API-018", "ヘルスチェック", "GET", "/health"),
            ApiTest("UT-API-019", "存在しないエンドポイント", "GET", "/api/nonexistent", expected_status=404),
            ApiTest("UT-API-020", "不正なメソッド", "PATCH", "/api/products", expected_status=405),
        ]

    async def execute_test(self, session: aiohttp.ClientSession, test: ApiTest) -> TestResult:
        """単一テストの実行"""
        start_time = time.time()
        full_url = f"{self.base_url}{test.endpoint}"
        
        if self.verbose:
            print(f"🔧 {Colors.yellow(test.id)} {Colors.green(test.method)} {Colors.cyan(full_url)}")

        try:
            # リクエストの準備
            kwargs = {
                'timeout': aiohttp.ClientTimeout(total=self.timeout),
                'headers': test.headers or {}
            }
            
            if test.body:
                kwargs['json'] = test.body

            # リクエスト実行
            async with session.request(test.method, full_url, **kwargs) as response:
                response_time = int((time.time() - start_time) * 1000)
                status_code = response.status
                response_text = await response.text()
                response_size = len(response_text.encode('utf-8'))
                
                success = status_code == test.expected_status
                error_message = None if success else f"Expected {test.expected_status}, got {status_code}"
                
                if self.verbose:
                    status_icon = "✅" if success else "❌"
                    print(f"  {Colors.green(status_icon) if success else Colors.red(status_icon)} "
                          f"Status: {Colors.cyan(str(status_code))} ({Colors.yellow(str(response_time))}ms)")
                
                return TestResult(
                    test_id=test.id,
                    test_name=test.name,
                    method=test.method,
                    endpoint=test.endpoint,
                    status_code=status_code,
                    response_time_ms=response_time,
                    success=success,
                    error_message=error_message,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    response_size=response_size
                )

        except asyncio.TimeoutError:
            response_time = int((time.time() - start_time) * 1000)
            if self.verbose:
                print(f"  {Colors.yellow('⏰')} Timeout after {response_time}ms")
            
            return TestResult(
                test_id=test.id,
                test_name=test.name,
                method=test.method,
                endpoint=test.endpoint,
                status_code=None,
                response_time_ms=response_time,
                success=False,
                error_message="Request timeout",
                timestamp=datetime.now(timezone.utc).isoformat(),
                response_size=0
            )
        
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            if self.verbose:
                print(f"  {Colors.red('❌')} Error: {Colors.red(str(e))}")
            
            return TestResult(
                test_id=test.id,
                test_name=test.name,
                method=test.method,
                endpoint=test.endpoint,
                status_code=None,
                response_time_ms=response_time,
                success=False,
                error_message=str(e),
                timestamp=datetime.now(timezone.utc).isoformat(),
                response_size=0
            )

    async def run_all_tests(self) -> List[TestResult]:
        """全テストの並行実行"""
        tests = self.create_test_suite()
        print(f"🚀 {Colors.green('Starting API tests with')} {Colors.yellow(str(len(tests)))} {Colors.green('test cases...')}")
        
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=50)
        async with aiohttp.ClientSession(connector=connector) as session:
            # 全テストを並行実行
            tasks = [self.execute_test(session, test) for test in tests]
            results = await asyncio.gather(*tasks)
        
        return results

    def write_csv_results(self, results: List[TestResult], filename: str) -> None:
        """CSV結果の書き込み"""
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = [
                'test_id', 'test_name', 'method', 'endpoint', 'status_code',
                'response_time_ms', 'success', 'error_message', 'timestamp', 
                'response_size_bytes'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for result in results:
                writer.writerow({
                    'test_id': result.test_id,
                    'test_name': result.test_name,
                    'method': result.method,
                    'endpoint': result.endpoint,
                    'status_code': result.status_code or 'NULL',
                    'response_time_ms': result.response_time_ms,
                    'success': result.success,
                    'error_message': result.error_message or '',
                    'timestamp': result.timestamp,
                    'response_size_bytes': result.response_size
                })

    def print_summary(self, results: List[TestResult]) -> None:
        """テスト結果サマリーの表示"""
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r.success)
        failed_tests = total_tests - passed_tests
        
        total_time = sum(r.response_time_ms for r in results)
        avg_time = total_time // total_tests if total_tests > 0 else 0
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n{Colors.blue('=' * 60)}")
        print(f"{Colors.blue('📊 TEST SUMMARY')}")
        print(f"{Colors.blue('=' * 60)}")
        
        print(f"Total Tests:    {Colors.cyan(str(total_tests))}")
        print(f"Passed:         {Colors.green(str(passed_tests))}")
        print(f"Failed:         {Colors.red(str(failed_tests))}")
        print(f"Success Rate:   {Colors.yellow(f'{success_rate:.1f}%')}")
        print(f"Total Time:     {Colors.yellow(f'{total_time}ms')}")
        print(f"Average Time:   {Colors.yellow(f'{avg_time}ms')}")
        
        if failed_tests > 0:
            print(f"\n{Colors.red('❌ FAILED TESTS:')}")
            for result in results:
                if not result.success:
                    print(f"  {Colors.red(result.test_id)} {Colors.red(result.test_name)} - "
                          f"{Colors.red(result.error_message or 'Unknown error')}")
        
        print(f"{Colors.blue('=' * 60)}")

async def main():
    parser = argparse.ArgumentParser(description='Automated API testing tool for e-commerce system')
    parser.add_argument('-b', '--base-url', default='http://localhost:3005', 
                       help='Base URL for API server (default: http://localhost:3005)')
    parser.add_argument('-o', '--output', default='api_test_results.csv', 
                       help='Output CSV filename (default: api_test_results.csv)')
    parser.add_argument('-t', '--timeout', type=int, default=30, 
                       help='Request timeout in seconds (default: 30)')
    parser.add_argument('-v', '--verbose', action='store_true', 
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    print(f"🔧 {Colors.green('API Test Runner Starting...')}")
    print(f"Base URL: {Colors.cyan(args.base_url)}")
    print(f"Output File: {Colors.cyan(args.output)}")
    print(f"Timeout: {Colors.cyan(f'{args.timeout}s')}")
    print()
    
    runner = ApiTestRunner(args.base_url, args.timeout, args.verbose)
    
    start_time = time.time()
    results = await runner.run_all_tests()
    total_execution_time = time.time() - start_time
    
    # CSV出力
    try:
        runner.write_csv_results(results, args.output)
        print(f"💾 {Colors.green('Results written to:')} {Colors.cyan(args.output)}")
    except Exception as e:
        print(f"❌ {Colors.red('Failed to write CSV:')} {Colors.red(str(e))}")
    
    # サマリー表示
    runner.print_summary(results)
    
    print(f"\n⏱️  {Colors.blue('Total execution time:')} {Colors.yellow(f'{total_execution_time:.2f}s')}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.yellow('⚠️  Test execution interrupted by user')}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.red('❌ Fatal error:')} {Colors.red(str(e))}")
        sys.exit(1)