use chrono::{DateTime, Utc};
use clap::Parser;
use colored::*;
use csv::Writer;
use futures::future::join_all;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs::File;
use std::time::{Duration, Instant};
use tokio::time::timeout;

#[derive(Parser)]
#[command(name = "api_test_runner")]
#[command(about = "Automated API testing tool for e-commerce system")]
struct Args {
    #[arg(short, long, default_value = "http://localhost:3005")]
    base_url: String,

    #[arg(short, long, default_value = "api_test_results.csv")]
    output: String,

    #[arg(short, long, default_value = "30")]
    timeout: u64,

    #[arg(short, long)]
    verbose: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TestResult {
    test_id: String,
    test_name: String,
    method: String,
    endpoint: String,
    status_code: Option<u16>,
    response_time_ms: u64,
    success: bool,
    error_message: Option<String>,
    timestamp: DateTime<Utc>,
    response_size: usize,
}

#[derive(Debug, Clone)]
struct ApiTest {
    id: String,
    name: String,
    method: String,
    endpoint: String,
    body: Option<Value>,
    expected_status: u16,
    headers: HashMap<String, String>,
}

struct TestRunner {
    client: Client,
    base_url: String,
    timeout_duration: Duration,
    verbose: bool,
}

impl TestRunner {
    fn new(base_url: String, timeout_seconds: u64, verbose: bool) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(timeout_seconds))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            base_url,
            timeout_duration: Duration::from_secs(timeout_seconds),
            verbose,
        }
    }

    fn create_test_suite(&self) -> Vec<ApiTest> {
        vec![
            // Product Management API Tests
            ApiTest {
                id: "UT-API-001".to_string(),
                name: "商品検索API".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/products?q=プレミアム".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-002".to_string(),
                name: "商品検索API(空文字)".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/products?q=".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-003".to_string(),
                name: "商品検索API(存在しない商品)".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/products?q=存在しない商品".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-004".to_string(),
                name: "TestTable全取得".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/TestTable".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-005".to_string(),
                name: "TestTable新規作成".to_string(),
                method: "POST".to_string(),
                endpoint: "/api/TestTable".to_string(),
                body: Some(json!({
                    "id": 9999,
                    "name": "テスト商品",
                    "price": 1000
                })),
                expected_status: 200,
                headers: {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    headers
                },
            },
            ApiTest {
                id: "UT-API-006".to_string(),
                name: "TestTable更新".to_string(),
                method: "PUT".to_string(),
                endpoint: "/api/TestTable/9999".to_string(),
                body: Some(json!({
                    "name": "更新商品",
                    "price": 1500
                })),
                expected_status: 200,
                headers: {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    headers
                },
            },
            ApiTest {
                id: "UT-API-007".to_string(),
                name: "TestTable削除".to_string(),
                method: "DELETE".to_string(),
                endpoint: "/api/TestTable/9999".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            // Order Management API Tests (Extended)
            ApiTest {
                id: "UT-API-008".to_string(),
                name: "注文一覧取得".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/orders".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-009".to_string(),
                name: "注文一覧取得(フィルタ)".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/orders?status=pending".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-010".to_string(),
                name: "注文新規作成".to_string(),
                method: "POST".to_string(),
                endpoint: "/api/orders".to_string(),
                body: Some(json!({
                    "customer_id": 1,
                    "products": [{"product_id": 1, "quantity": 2}],
                    "total_amount": 2000
                })),
                expected_status: 200,
                headers: {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    headers
                },
            },
            ApiTest {
                id: "UT-API-011".to_string(),
                name: "注文ステータス更新".to_string(),
                method: "PUT".to_string(),
                endpoint: "/api/orders/1".to_string(),
                body: Some(json!({"status": "confirmed"})),
                expected_status: 200,
                headers: {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    headers
                },
            },
            // Payment Management API Tests
            ApiTest {
                id: "UT-API-012".to_string(),
                name: "支払い一覧取得".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/payments".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-013".to_string(),
                name: "支払いステータス更新".to_string(),
                method: "PUT".to_string(),
                endpoint: "/api/payments/1".to_string(),
                body: Some(json!({"status": "completed"})),
                expected_status: 200,
                headers: {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    headers
                },
            },
            // Shipping Management API Tests
            ApiTest {
                id: "UT-API-014".to_string(),
                name: "発送一覧取得".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/shipments".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-015".to_string(),
                name: "発送ステータス更新".to_string(),
                method: "PUT".to_string(),
                endpoint: "/api/shipments/1".to_string(),
                body: Some(json!({"status": "in_transit"})),
                expected_status: 200,
                headers: {
                    let mut headers = HashMap::new();
                    headers.insert("Content-Type".to_string(), "application/json".to_string());
                    headers
                },
            },
            // Statistics API Tests
            ApiTest {
                id: "UT-API-016".to_string(),
                name: "統計情報取得".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/stats".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            // Health Check Tests
            ApiTest {
                id: "UT-API-018".to_string(),
                name: "ヘルスチェック".to_string(),
                method: "GET".to_string(),
                endpoint: "/health".to_string(),
                body: None,
                expected_status: 200,
                headers: HashMap::new(),
            },
            // Error Handling Tests
            ApiTest {
                id: "UT-API-019".to_string(),
                name: "存在しないエンドポイント".to_string(),
                method: "GET".to_string(),
                endpoint: "/api/nonexistent".to_string(),
                body: None,
                expected_status: 404,
                headers: HashMap::new(),
            },
            ApiTest {
                id: "UT-API-020".to_string(),
                name: "不正なメソッド".to_string(),
                method: "PATCH".to_string(),
                endpoint: "/api/products".to_string(),
                body: None,
                expected_status: 405,
                headers: HashMap::new(),
            },
        ]
    }

    async fn execute_test(&self, test: &ApiTest) -> TestResult {
        let start_time = Instant::now();
        let full_url = format!("{}{}", self.base_url, test.endpoint);
        
        if self.verbose {
            println!("{}Executing: {} {} {}", 
                "🔧 ".blue(),
                test.id.yellow(),
                test.method.green(),
                full_url.cyan()
            );
        }

        let mut request = match test.method.as_str() {
            "GET" => self.client.get(&full_url),
            "POST" => self.client.post(&full_url),
            "PUT" => self.client.put(&full_url),
            "DELETE" => self.client.delete(&full_url),
            "PATCH" => self.client.patch(&full_url),
            _ => {
                return TestResult {
                    test_id: test.id.clone(),
                    test_name: test.name.clone(),
                    method: test.method.clone(),
                    endpoint: test.endpoint.clone(),
                    status_code: None,
                    response_time_ms: 0,
                    success: false,
                    error_message: Some("Unsupported HTTP method".to_string()),
                    timestamp: Utc::now(),
                    response_size: 0,
                };
            }
        };

        // Add headers
        for (key, value) in &test.headers {
            request = request.header(key, value);
        }

        // Add body if present
        if let Some(body) = &test.body {
            request = request.json(body);
        }

        // Execute request with timeout
        let response_result = timeout(self.timeout_duration, request.send()).await;
        let response_time = start_time.elapsed().as_millis() as u64;

        match response_result {
            Ok(Ok(response)) => {
                let status_code = response.status().as_u16();
                let response_size = response.content_length().unwrap_or(0) as usize;
                let success = status_code == test.expected_status;
                
                let error_message = if !success {
                    Some(format!("Expected status {}, got {}", test.expected_status, status_code))
                } else {
                    None
                };

                if self.verbose {
                    let status_color = if success { "✅".green() } else { "❌".red() };
                    println!("  {} Status: {} ({}ms)", 
                        status_color, 
                        status_code.to_string().cyan(), 
                        response_time.to_string().yellow()
                    );
                }

                TestResult {
                    test_id: test.id.clone(),
                    test_name: test.name.clone(),
                    method: test.method.clone(),
                    endpoint: test.endpoint.clone(),
                    status_code: Some(status_code),
                    response_time_ms: response_time,
                    success,
                    error_message,
                    timestamp: Utc::now(),
                    response_size,
                }
            }
            Ok(Err(e)) => {
                if self.verbose {
                    println!("  {} Network error: {}", "❌".red(), e.to_string().red());
                }
                TestResult {
                    test_id: test.id.clone(),
                    test_name: test.name.clone(),
                    method: test.method.clone(),
                    endpoint: test.endpoint.clone(),
                    status_code: None,
                    response_time_ms: response_time,
                    success: false,
                    error_message: Some(e.to_string()),
                    timestamp: Utc::now(),
                    response_size: 0,
                }
            }
            Err(_) => {
                if self.verbose {
                    println!("  {} Timeout after {}ms", "⏰".yellow(), response_time);
                }
                TestResult {
                    test_id: test.id.clone(),
                    test_name: test.name.clone(),
                    method: test.method.clone(),
                    endpoint: test.endpoint.clone(),
                    status_code: None,
                    response_time_ms: response_time,
                    success: false,
                    error_message: Some("Request timeout".to_string()),
                    timestamp: Utc::now(),
                    response_size: 0,
                }
            }
        }
    }

    async fn run_all_tests(&self) -> Vec<TestResult> {
        let tests = self.create_test_suite();
        println!("{}Starting API tests with {} test cases...", 
            "🚀 ".green(), 
            tests.len().to_string().yellow()
        );

        // Execute all tests concurrently for maximum speed
        let test_futures: Vec<_> = tests.iter().map(|test| self.execute_test(test)).collect();
        let results = join_all(test_futures).await;

        results
    }

    fn write_csv_results(&self, results: &[TestResult], filename: &str) -> Result<(), Box<dyn std::error::Error>> {
        let file = File::create(filename)?;
        let mut writer = Writer::from_writer(file);

        // Write header
        writer.write_record(&[
            "test_id",
            "test_name", 
            "method",
            "endpoint",
            "status_code",
            "response_time_ms",
            "success",
            "error_message",
            "timestamp",
            "response_size_bytes"
        ])?;

        // Write data
        for result in results {
            writer.write_record(&[
                &result.test_id,
                &result.test_name,
                &result.method,
                &result.endpoint,
                &result.status_code.map_or("NULL".to_string(), |s| s.to_string()),
                &result.response_time_ms.to_string(),
                &result.success.to_string(),
                result.error_message.as_deref().unwrap_or(""),
                &result.timestamp.to_rfc3339(),
                &result.response_size.to_string(),
            ])?;
        }

        writer.flush()?;
        Ok(())
    }

    fn print_summary(&self, results: &[TestResult]) {
        let total_tests = results.len();
        let passed_tests = results.iter().filter(|r| r.success).count();
        let failed_tests = total_tests - passed_tests;
        
        let total_time: u64 = results.iter().map(|r| r.response_time_ms).sum();
        let avg_time = if total_tests > 0 { total_time / total_tests as u64 } else { 0 };
        
        println!("\n{}", "=".repeat(60).blue());
        println!("{}TEST SUMMARY", "📊 ".blue());
        println!("{}", "=".repeat(60).blue());
        
        println!("Total Tests:    {}", total_tests.to_string().cyan());
        println!("Passed:         {}", passed_tests.to_string().green());
        println!("Failed:         {}", failed_tests.to_string().red());
        println!("Success Rate:   {:.1}%", 
            (passed_tests as f64 / total_tests as f64 * 100.0).to_string().yellow()
        );
        println!("Total Time:     {}ms", total_time.to_string().yellow());
        println!("Average Time:   {}ms", avg_time.to_string().yellow());
        
        if failed_tests > 0 {
            println!("\n{}FAILED TESTS:", "❌ ".red());
            for result in results.iter().filter(|r| !r.success) {
                println!("  {} {} - {}", 
                    result.test_id.red(),
                    result.test_name.red(),
                    result.error_message.as_deref().unwrap_or("Unknown error").red()
                );
            }
        }
        
        println!("{}", "=".repeat(60).blue());
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    
    println!("{}API Test Runner Starting...", "🔧 ".green());
    println!("Base URL: {}", args.base_url.cyan());
    println!("Output File: {}", args.output.cyan());
    println!("Timeout: {}s", args.timeout.to_string().cyan());
    println!();

    let runner = TestRunner::new(args.base_url, args.timeout, args.verbose);
    
    let start_time = Instant::now();
    let results = runner.run_all_tests().await;
    let total_execution_time = start_time.elapsed();
    
    // Write results to CSV
    match runner.write_csv_results(&results, &args.output) {
        Ok(_) => println!("{}Results written to: {}", "💾 ".green(), args.output.cyan()),
        Err(e) => eprintln!("{}Failed to write CSV: {}", "❌ ".red(), e.to_string().red()),
    }
    
    // Print summary
    runner.print_summary(&results);
    
    println!("\n{}Total execution time: {:.2}s", 
        "⏱️  ".blue(), 
        total_execution_time.as_secs_f64().to_string().yellow()
    );
    
    Ok(())
}