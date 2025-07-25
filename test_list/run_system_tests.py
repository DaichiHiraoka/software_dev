#!/usr/bin/env python3
"""
総合テスト自動実行スクリプト
System Test Automation Script
"""

import asyncio
import aiohttp
import csv
import json
import time
import subprocess
import os
import sys
import webbrowser
from datetime import datetime
from typing import List, Dict, Optional

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
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
    @staticmethod
    def magenta(text): return f"{Colors.MAGENTA}{text}{Colors.RESET}"

class SystemTestRunner:
    def __init__(self, base_url="http://localhost:3005"):
        self.base_url = base_url
        self.backend_process = None
        self.frontend_processes = {}
        self.results = []
        
        # フロントエンドポート設定
        self.frontend_ports = {
            'customer': 3000,
            'order_management': 3001,
            'accounting': 3002,
            'shipping': 3003,
            'admin': 3004
        }
        
    def get_system_tests(self) -> List[Dict]:
        """総合テストシナリオ定義"""
        return [
            # エンドツーエンド業務フローテスト
            {
                'category': 'E2E_WORKFLOW',
                'id': 'ST-E2E-001',
                'name': '完全注文処理ワークフロー',
                'description': '顧客注文から発送完了までの全工程',
                'workflow_steps': [
                    {'step': 1, 'system': 'Customer', 'action': '商品検索', 'method': 'GET', 'endpoint': '/api/products?q=', 'expected': 200},
                    {'step': 2, 'system': 'Customer', 'action': '注文作成', 'method': 'POST', 'endpoint': '/api/orders', 'body': {'customer_id': 1, 'products': [{'product_id': 1, 'quantity': 2}], 'total_amount': 2000}, 'expected': 200},
                    {'step': 3, 'system': 'OrderMgmt', 'action': '注文確認', 'method': 'GET', 'endpoint': '/api/orders', 'expected': 200},
                    {'step': 4, 'system': 'OrderMgmt', 'action': '注文承認', 'method': 'PUT', 'endpoint': '/api/orders/1', 'body': {'status': 'confirmed'}, 'expected': 200},
                    {'step': 5, 'system': 'Accounting', 'action': '支払い確認', 'method': 'GET', 'endpoint': '/api/payments', 'expected': 200},
                    {'step': 6, 'system': 'Accounting', 'action': '支払い処理', 'method': 'PUT', 'endpoint': '/api/payments/1', 'body': {'status': 'completed'}, 'expected': 200},
                    {'step': 7, 'system': 'Shipping', 'action': '発送準備', 'method': 'GET', 'endpoint': '/api/shipments', 'expected': 200},
                    {'step': 8, 'system': 'Shipping', 'action': '発送実行', 'method': 'PUT', 'endpoint': '/api/shipments/1', 'body': {'status': 'in_transit'}, 'expected': 200},
                    {'step': 9, 'system': 'Admin', 'action': '統計確認', 'method': 'GET', 'endpoint': '/api/stats', 'expected': 200}
                ]
            },
            
            # システム横断データ整合性テスト
            {
                'category': 'DATA_CONSISTENCY',
                'id': 'ST-DC-001',
                'name': 'システム横断データ整合性',
                'description': '全システム間でのデータ整合性確認',
                'consistency_checks': [
                    {'check': 'TestTable一貫性', 'endpoints': ['/api/TestTable'], 'systems': ['All']},
                    {'check': '注文データ一貫性', 'endpoints': ['/api/orders'], 'systems': ['Customer', 'OrderMgmt', 'Accounting', 'Shipping']},
                    {'check': '支払いデータ一貫性', 'endpoints': ['/api/payments'], 'systems': ['Accounting', 'OrderMgmt']},
                    {'check': '発送データ一貫性', 'endpoints': ['/api/shipments'], 'systems': ['Shipping', 'OrderMgmt']}
                ]
            },
            
            # 負荷・性能テスト
            {
                'category': 'PERFORMANCE',
                'id': 'ST-PF-001',
                'name': '高負荷シナリオテスト',
                'description': '同時アクセス・大量データ処理テスト',
                'load_tests': [
                    {'name': '同時接続テスト', 'concurrent_users': 10, 'duration_sec': 30, 'endpoint': '/api/TestTable'},
                    {'name': '大量データ検索', 'concurrent_users': 5, 'duration_sec': 15, 'endpoint': '/api/products?q='},
                    {'name': 'API応答性能', 'requests': 100, 'max_response_time_ms': 1000, 'endpoint': '/health'}
                ]
            },
            
            # 障害シナリオテスト
            {
                'category': 'FAULT_TOLERANCE',
                'id': 'ST-FT-001',
                'name': '障害耐性テスト',
                'description': 'エラー状況での動作確認',
                'fault_scenarios': [
                    {'scenario': '不正リクエスト', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'invalid': True}, 'expected': 400},
                    {'scenario': '存在しないリソース', 'method': 'GET', 'endpoint': '/api/TestTable/999999', 'expected': 404},
                    {'scenario': 'メソッド不一致', 'method': 'PATCH', 'endpoint': '/api/products', 'expected': 405},
                    {'scenario': 'タイムアウト模擬', 'method': 'GET', 'endpoint': '/api/TestTable', 'timeout': 0.001, 'expected': 'timeout'}
                ]
            },
            
            # セキュリティテスト
            {
                'category': 'SECURITY',
                'id': 'ST-SC-001',
                'name': 'セキュリティ検証',
                'description': '基本的なセキュリティ要件確認',
                'security_tests': [
                    {'test': 'SQLインジェクション対策', 'method': 'GET', 'endpoint': '/api/products?q=\'; DROP TABLE TestTable; --', 'expected': 200},
                    {'test': 'XSS対策', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {'id': 9999, 'name': '<script>alert("xss")</script>', 'price': 100}, 'expected': 200},
                    {'test': '不正なContent-Type', 'method': 'POST', 'endpoint': '/api/TestTable', 'headers': {'Content-Type': 'text/plain'}, 'body': 'invalid', 'expected': 400},
                    {'test': 'CORSヘッダー確認', 'method': 'OPTIONS', 'endpoint': '/api/TestTable', 'expected': [200, 204]}
                ]
            },
            
            # ユーザビリティテスト（API レベル）
            {
                'category': 'USABILITY',
                'id': 'ST-UX-001',
                'name': 'APIユーザビリティ',
                'description': 'API使いやすさ・レスポンス品質',
                'usability_tests': [
                    {'test': 'エラーメッセージ品質', 'method': 'POST', 'endpoint': '/api/TestTable', 'body': {}, 'expected': 400, 'validate_error_msg': True},
                    {'test': 'レスポンス形式統一', 'method': 'GET', 'endpoint': '/api/TestTable', 'expected': 200, 'validate_json': True},
                    {'test': 'ヘルスチェック情報', 'method': 'GET', 'endpoint': '/health', 'expected': 200, 'validate_health_format': True}
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
            for i in range(15):
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
    
    async def execute_single_request(self, request: Dict, timeout_override: Optional[float] = None) -> Dict:
        """単一リクエスト実行"""
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
                    
                    # 期待値チェック（リストの場合は複数のステータスコードを許可）
                    if isinstance(expected, list):
                        success = status_code in expected
                    else:
                        success = status_code == expected
                    
                    # バリデーション実行
                    validation_results = await self._validate_response(request, response_text, response.headers)
                    if validation_results['errors']:
                        success = False
                    
                    return {
                        'name': request.get('name', request.get('action', 'Unknown')),
                        'method': method,
                        'endpoint': request['endpoint'],
                        'expected_status': expected,
                        'actual_status': status_code,
                        'response_time_ms': response_time,
                        'success': success,
                        'error_message': validation_results['errors'][0] if validation_results['errors'] else (None if success else f"Expected {expected}, got {status_code}"),
                        'response_size': len(response_text),
                        'validation_results': validation_results
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
                'response_size': 0,
                'validation_results': {'errors': [], 'warnings': []}
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
                'response_size': 0,
                'validation_results': {'errors': [str(e)], 'warnings': []}
            }
    
    async def _validate_response(self, request: Dict, response_text: str, headers) -> Dict:
        """レスポンスバリデーション"""
        errors = []
        warnings = []
        
        # JSON形式チェック
        if request.get('validate_json'):
            try:
                json.loads(response_text)
            except:
                errors.append("Response is not valid JSON")
        
        # エラーメッセージ品質チェック
        if request.get('validate_error_msg'):
            try:
                error_data = json.loads(response_text)
                if 'error' not in error_data and 'message' not in error_data:
                    warnings.append("Error response lacks descriptive message")
            except:
                errors.append("Error response is not JSON format")
        
        # ヘルスチェック形式チェック
        if request.get('validate_health_format'):
            try:
                health_data = json.loads(response_text)
                required_fields = ['status', 'message', 'port', 'timestamp']
                missing_fields = [f for f in required_fields if f not in health_data]
                if missing_fields:
                    warnings.append(f"Health response missing fields: {missing_fields}")
            except:
                errors.append("Health response is not JSON format")
        
        return {'errors': errors, 'warnings': warnings}
    
    async def execute_workflow_test(self, test: Dict) -> Dict:
        """ワークフローテスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing workflow:')} {test['name']}")
        
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
                print(f"    [OK] Step {step['step']} ({step['system']}): {step['action']} ({step_result['response_time_ms']}ms)")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'workflow',
            'total_steps': len(test['workflow_steps']),
            'passed_steps': sum(1 for r in step_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else f"Failed steps: {[i+1 for i, r in enumerate(step_results) if not r['success']]}",
            'timestamp': datetime.now().isoformat(),
            'step_details': step_results
        }
    
    async def execute_consistency_test(self, test: Dict) -> Dict:
        """データ整合性テスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing consistency:')} {test['name']}")
        
        consistency_results = []
        overall_success = True
        total_time = 0
        
        for check in test['consistency_checks']:
            # 同じエンドポイントに複数回アクセスしてデータ整合性を確認
            check_results = []
            for endpoint in check['endpoints']:
                result1 = await self.execute_single_request({'method': 'GET', 'endpoint': endpoint, 'expected': 200})
                await asyncio.sleep(0.1)  # 少し間を置く
                result2 = await self.execute_single_request({'method': 'GET', 'endpoint': endpoint, 'expected': 200})
                
                # レスポンス内容の一貫性チェック（簡易版）
                consistent = result1['response_size'] == result2['response_size'] and result1['success'] and result2['success']
                
                check_result = {
                    'check_name': check['check'],
                    'endpoint': endpoint,
                    'consistent': consistent,
                    'result1': result1,
                    'result2': result2
                }
                check_results.append(check_result)
                total_time += result1['response_time_ms'] + result2['response_time_ms']
                
                if not consistent:
                    overall_success = False
                    print(f"    [FAIL] {check['check']} ({endpoint}): Data inconsistency detected")
                else:
                    print(f"    [OK] {check['check']} ({endpoint}): Data consistent")
            
            consistency_results.append(check_results)
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'consistency',
            'total_checks': len(test['consistency_checks']),
            'passed_checks': sum(1 for checks in consistency_results for check in checks if check['consistent']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Data inconsistencies detected",
            'timestamp': datetime.now().isoformat(),
            'consistency_details': consistency_results
        }
    
    async def execute_load_test(self, test: Dict) -> Dict:
        """負荷テスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing load test:')} {test['name']}")
        
        load_results = []
        overall_success = True
        total_time = 0
        
        for load_test in test['load_tests']:
            start_time = time.time()
            
            if 'concurrent_users' in load_test:
                # 並行ユーザーテスト
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
                        await asyncio.sleep(0.1)  # 100ms間隔
                    return session_results
                
                # 並行セッション実行
                tasks = [user_session() for _ in range(concurrent_users)]
                all_session_results = await asyncio.gather(*tasks)
                
                # 結果集計
                all_results = [r for session in all_session_results for r in session]
                success_count = sum(1 for r in all_results if r['success'])
                total_requests = len(all_results)
                avg_response_time = sum(r['response_time_ms'] for r in all_results) / total_requests if total_requests > 0 else 0
                
                load_success = success_count / total_requests >= 0.95 if total_requests > 0 else False
                
            else:
                # 大量リクエストテスト
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
                print(f"    [OK] {load_test['name']}: {success_count}/{total_requests} requests succeeded ({success_count/total_requests*100:.1f}%)")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'load',
            'total_load_tests': len(test['load_tests']),
            'passed_load_tests': sum(1 for r in load_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Load test thresholds not met",
            'timestamp': datetime.now().isoformat(),
            'load_details': load_results
        }
    
    async def execute_fault_test(self, test: Dict) -> Dict:
        """障害耐性テスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing fault tolerance:')} {test['name']}")
        
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
                print(f"    [OK] {fault['scenario']}: Expected behavior confirmed")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'fault_tolerance',
            'total_scenarios': len(test['fault_scenarios']),
            'passed_scenarios': sum(1 for r in fault_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Fault tolerance issues detected",
            'timestamp': datetime.now().isoformat(),
            'fault_details': fault_results
        }
    
    async def execute_security_test(self, test: Dict) -> Dict:
        """セキュリティテスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing security:')} {test['name']}")
        
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
                print(f"    [OK] {security_test['test']}: Security requirement met")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'security',
            'total_tests': len(test['security_tests']),
            'passed_tests': sum(1 for r in security_results if r['success']),
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Security vulnerabilities detected",
            'timestamp': datetime.now().isoformat(),
            'security_details': security_results
        }
    
    async def execute_usability_test(self, test: Dict) -> Dict:
        """ユーザビリティテスト実行"""
        print(f"  [EXEC] {Colors.cyan('Executing usability:')} {test['name']}")
        
        usability_results = []
        overall_success = True
        total_time = 0
        warning_count = 0
        
        for usability_test in test['usability_tests']:
            result = await self.execute_single_request(usability_test)
            usability_results.append(result)
            total_time += result['response_time_ms']
            
            # ユーザビリティは警告も含めて評価
            warnings = result.get('validation_results', {}).get('warnings', [])
            if warnings:
                warning_count += len(warnings)
                print(f"    [WARNING] {usability_test['test']}: {len(warnings)} usability warnings")
            
            if not result['success']:
                overall_success = False
                print(f"    [FAIL] {usability_test['test']}: {result['error_message']}")
            else:
                print(f"    [OK] {usability_test['test']}: Usability requirement met")
        
        return {
            'category': test['category'],
            'test_id': test['id'],
            'test_name': test['name'],
            'test_type': 'usability',
            'total_tests': len(test['usability_tests']),
            'passed_tests': sum(1 for r in usability_results if r['success']),
            'warning_count': warning_count,
            'response_time_ms': total_time,
            'success': overall_success,
            'error_message': None if overall_success else "Usability issues detected",
            'timestamp': datetime.now().isoformat(),
            'usability_details': usability_results
        }
    
    async def run_tests(self) -> List[Dict]:
        """全総合テスト実行"""
        tests = self.get_system_tests()
        
        print(f"\n[TESTS] {Colors.blue('Running System Tests...')}")
        print(f"Total Test Scenarios: {Colors.cyan(str(len(tests)))}")
        print("=" * 80)
        
        results = []
        
        for test in tests:
            print(f"\n[TEST] {Colors.blue(test['id'])}: {test['name']}")
            print(f"    {Colors.magenta(test['description'])}")
            
            if test['category'] == 'E2E_WORKFLOW':
                result = await self.execute_workflow_test(test)
            elif test['category'] == 'DATA_CONSISTENCY':
                result = await self.execute_consistency_test(test)
            elif test['category'] == 'PERFORMANCE':
                result = await self.execute_load_test(test)
            elif test['category'] == 'FAULT_TOLERANCE':
                result = await self.execute_fault_test(test)
            elif test['category'] == 'SECURITY':
                result = await self.execute_security_test(test)
            elif test['category'] == 'USABILITY':
                result = await self.execute_usability_test(test)
            else:
                result = {
                    'category': test['category'],
                    'test_id': test['id'],
                    'test_name': test['name'],
                    'success': False,
                    'error_message': f"Unknown test category: {test['category']}"
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
        print(f"[RESULTS] {Colors.blue('System Test Results by Category')}")
        print("=" * 80)
        
        total_tests = len(results)
        total_passed = sum(1 for r in results if r['success'])
        total_failed = total_tests - total_passed
        
        for cat, stats in categories.items():
            success_rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"{cat:>18}: {Colors.cyan(str(stats['total']).rjust(2))} | "
                  f"Passed: {Colors.green(str(stats['passed']).rjust(2))} | "
                  f"Failed: {Colors.red(str(stats['failed']).rjust(2))} | "
                  f"Rate: {Colors.yellow(f'{success_rate:5.1f}%')}")
        
        print("-" * 80)
        overall_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        print(f"{'Total':>18}: {Colors.cyan(str(total_tests).rjust(2))} | "
              f"Passed: {Colors.green(str(total_passed).rjust(2))} | "
              f"Failed: {Colors.red(str(total_failed).rjust(2))} | "
              f"Rate: {Colors.yellow(f'{overall_rate:5.1f}%')}")
        
        return results
    
    def save_results(self, results: List[Dict], filename: str = "system_test_results.csv"):
        """結果保存"""
        flat_results = []
        for result in results:
            base_result = {
                'category': result['category'],
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
            fieldnames = ['category', 'test_id', 'test_name', 'test_type', 
                         'response_time_ms', 'success', 'error_message', 'timestamp']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(flat_results)
        
        print(f"\n[SAVE] {Colors.green('Results saved to:')} {Colors.cyan(filename)}")
    
    async def run_full_system_test_suite(self):
        """完全自動総合テスト実行"""
        print(f"[SYSTEM] {Colors.blue('=== SYSTEM TEST AUTOMATION ===')}")
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
            filename = f"system_test_results_{timestamp}.csv"
            self.save_results(results, filename)
            
            # 最終レポート
            total_tests = len(results)
            passed_tests = sum(1 for r in results if r['success'])
            success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            
            print(f"\n[COMPLETED] {Colors.blue('SYSTEM TEST COMPLETED')}")
            print("=" * 80)
            print(f"[SUMMARY] Final Results:")
            print(f"   Total Scenarios: {Colors.cyan(str(total_tests))}")
            print(f"   Passed: {Colors.green(str(passed_tests))}")
            print(f"   Failed: {Colors.red(str(total_tests - passed_tests))}")
            print(f"   Success Rate: {Colors.yellow(f'{success_rate:.1f}%')}")
            print(f"   Execution Time: {Colors.cyan(f'{execution_time:.2f}s')}")
            print(f"   Report File: {Colors.cyan(filename)}")
            
            # テスト合格判定
            if success_rate >= 80:
                print(f"\n[SUCCESS] {Colors.green('SYSTEM TESTS PASSED!')} (>=80% success rate)")
                return True
            else:
                print(f"\n[WARNING] {Colors.red('SYSTEM TESTS NEED ATTENTION')} (<80% success rate)")
                return False
                
        finally:
            self.stop_backend_server()

async def main():
    runner = SystemTestRunner()
    success = await runner.run_full_system_test_suite()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())