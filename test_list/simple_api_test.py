#!/usr/bin/env python3
"""
シンプルAPIテストランナー
依存関係最小限、Windows環境で確実動作
"""

import json
import time
import csv
import sys
from urllib.request import urlopen, Request, HTTPError
from urllib.parse import urlencode
from datetime import datetime
import concurrent.futures
from typing import List, Dict, Optional

class SimpleApiTest:
    def __init__(self, base_url: str = "http://localhost:3005", timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        
    def run_single_test(self, test_data: Dict) -> Dict:
        """単一テストの実行"""
        start_time = time.time()
        test_id = test_data['id']
        method = test_data['method']
        endpoint = test_data['endpoint']
        expected_status = test_data.get('expected_status', 200)
        body = test_data.get('body')
        
        full_url = f"{self.base_url}{endpoint}"
        
        try:
            # リクエスト作成
            if body:
                data = json.dumps(body).encode('utf-8')
                req = Request(full_url, data=data, method=method)
                req.add_header('Content-Type', 'application/json')
            else:
                req = Request(full_url, method=method)
            
            # リクエスト実行
            with urlopen(req, timeout=self.timeout) as response:
                response_time = int((time.time() - start_time) * 1000)
                status_code = response.status
                response_data = response.read()
                
                success = status_code == expected_status
                error_msg = None if success else f"Expected {expected_status}, got {status_code}"
                
                print(f"{'✅' if success else '❌'} {test_id}: {status_code} ({response_time}ms)")
                
                return {
                    'test_id': test_id,
                    'test_name': test_data['name'],
                    'method': method,
                    'endpoint': endpoint,
                    'status_code': status_code,
                    'response_time_ms': response_time,
                    'success': success,
                    'error_message': error_msg,
                    'timestamp': datetime.now().isoformat(),
                    'response_size_bytes': len(response_data)
                }
                
        except HTTPError as e:
            response_time = int((time.time() - start_time) * 1000)
            status_code = e.code
            success = status_code == expected_status
            error_msg = None if success else f"HTTP Error {status_code}"
            
            print(f"{'✅' if success else '❌'} {test_id}: {status_code} ({response_time}ms)")
            
            return {
                'test_id': test_id,
                'test_name': test_data['name'],
                'method': method,
                'endpoint': endpoint,
                'status_code': status_code,
                'response_time_ms': response_time,
                'success': success,
                'error_message': error_msg,
                'timestamp': datetime.now().isoformat(),
                'response_size_bytes': 0
            }
            
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            print(f"❌ {test_id}: Error - {str(e)} ({response_time}ms)")
            
            return {
                'test_id': test_id,
                'test_name': test_data['name'],
                'method': method,
                'endpoint': endpoint,
                'status_code': None,
                'response_time_ms': response_time,
                'success': False,
                'error_message': str(e),
                'timestamp': datetime.now().isoformat(),
                'response_size_bytes': 0
            }
    
    def get_test_cases(self) -> List[Dict]:
        """テストケース定義"""
        return [
            # 商品管理API
            {'id': 'UT-API-001', 'name': '商品検索API', 'method': 'GET', 'endpoint': '/api/products?q=プレミアム'},
            {'id': 'UT-API-002', 'name': '商品検索API(空文字)', 'method': 'GET', 'endpoint': '/api/products?q='},
            {'id': 'UT-API-003', 'name': '商品検索API(存在しない商品)', 'method': 'GET', 'endpoint': '/api/products?q=存在しない商品'},
            {'id': 'UT-API-004', 'name': 'TestTable全取得', 'method': 'GET', 'endpoint': '/api/TestTable'},
            {'id': 'UT-API-005', 'name': 'TestTable新規作成', 'method': 'POST', 'endpoint': '/api/TestTable', 
             'body': {'id': 9999, 'name': 'テスト商品', 'price': 1000}},
            {'id': 'UT-API-006', 'name': 'TestTable更新', 'method': 'PUT', 'endpoint': '/api/TestTable/9999',
             'body': {'name': '更新商品', 'price': 1500}},
            {'id': 'UT-API-007', 'name': 'TestTable削除', 'method': 'DELETE', 'endpoint': '/api/TestTable/9999'},
            
            # 注文管理API
            {'id': 'UT-API-008', 'name': '注文一覧取得', 'method': 'GET', 'endpoint': '/api/orders'},
            {'id': 'UT-API-009', 'name': '注文一覧取得(フィルタ)', 'method': 'GET', 'endpoint': '/api/orders?status=pending'},
            {'id': 'UT-API-010', 'name': '注文新規作成', 'method': 'POST', 'endpoint': '/api/orders',
             'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}},
            {'id': 'UT-API-011', 'name': '注文ステータス更新', 'method': 'PUT', 'endpoint': '/api/orders/1',
             'body': {'status': 'confirmed'}},
            
            # 支払い管理API
            {'id': 'UT-API-012', 'name': '支払い一覧取得', 'method': 'GET', 'endpoint': '/api/payments'},
            {'id': 'UT-API-013', 'name': '支払いステータス更新', 'method': 'PUT', 'endpoint': '/api/payments/1',
             'body': {'status': 'completed'}},
            
            # 発送管理API
            {'id': 'UT-API-014', 'name': '発送一覧取得', 'method': 'GET', 'endpoint': '/api/shipments'},
            {'id': 'UT-API-015', 'name': '発送ステータス更新', 'method': 'PUT', 'endpoint': '/api/shipments/1',
             'body': {'status': 'in_transit'}},
            
            # 統計情報API
            {'id': 'UT-API-016', 'name': '統計情報取得', 'method': 'GET', 'endpoint': '/api/stats'},
            
            # システムAPI
            {'id': 'UT-API-018', 'name': 'ヘルスチェック', 'method': 'GET', 'endpoint': '/health'},
            {'id': 'UT-API-019', 'name': '存在しないエンドポイント', 'method': 'GET', 'endpoint': '/api/nonexistent', 'expected_status': 404},
            {'id': 'UT-API-020', 'name': '不正なメソッド', 'method': 'PATCH', 'endpoint': '/api/products', 'expected_status': 405},
        ]
    
    def run_all_tests(self, max_workers: int = 10) -> List[Dict]:
        """全テストの並行実行"""
        test_cases = self.get_test_cases()
        
        print(f"🚀 Starting {len(test_cases)} API tests...")
        print("=" * 60)
        
        # 並行実行
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(self.run_single_test, test_cases))
        
        return results
    
    def save_to_csv(self, results: List[Dict], filename: str = 'simple_api_test_results.csv'):
        """CSV保存"""
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['test_id', 'test_name', 'method', 'endpoint', 'status_code', 
                         'response_time_ms', 'success', 'error_message', 'timestamp', 'response_size_bytes']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        print(f"💾 Results saved to: {filename}")
    
    def print_summary(self, results: List[Dict]):
        """サマリー表示"""
        total = len(results)
        passed = sum(1 for r in results if r['success'])
        failed = total - passed
        avg_time = sum(r['response_time_ms'] for r in results) // total if total > 0 else 0
        
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests:   {total}")
        print(f"Passed:        {passed}")
        print(f"Failed:        {failed}")
        print(f"Success Rate:  {passed/total*100:.1f}%")
        print(f"Average Time:  {avg_time}ms")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in results:
                if not result['success']:
                    print(f"  {result['test_id']} - {result['error_message'] or 'Unknown error'}")
        
        print("=" * 60)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Simple API Test Runner')
    parser.add_argument('--base-url', default='http://localhost:3005', help='Base URL')
    parser.add_argument('--output', default='simple_api_test_results.csv', help='Output CSV file')
    parser.add_argument('--timeout', type=int, default=30, help='Timeout seconds')
    
    args = parser.parse_args()
    
    print(f"🔧 Simple API Test Runner")
    print(f"Base URL: {args.base_url}")
    print(f"Output: {args.output}")
    print()
    
    tester = SimpleApiTest(args.base_url, args.timeout)
    
    start_time = time.time()
    results = tester.run_all_tests()
    execution_time = time.time() - start_time
    
    tester.save_to_csv(results, args.output)
    tester.print_summary(results)
    
    print(f"\n⏱️ Total execution time: {execution_time:.2f}s")

if __name__ == "__main__":
    main()