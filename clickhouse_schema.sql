-- ClickHouse Analytics Database Schema
-- For high-performance analytics and logging

-- Create database
CREATE DATABASE IF NOT EXISTS proxyflow_analytics;

USE proxyflow_analytics;

-- Request logs table (for detailed analytics)
CREATE TABLE IF NOT EXISTS request_logs (
    id UInt64,
    user_id UInt32,
    user_email String,
    proxy_id UInt32,
    proxy_type Enum8('residential' = 1, 'datacenter' = 2, 'mobile' = 3, 'isp' = 4),
    proxy_ip String,
    proxy_country String,
    data_used_mb Float32,
    request_duration_ms UInt32,
    status_code UInt16,
    success UInt8,
    error_message String,
    user_agent String,
    target_domain String,
    timestamp DateTime,
    date Date DEFAULT toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (user_id, timestamp)
TTL date + INTERVAL 90 DAY;

-- Daily aggregated statistics
CREATE TABLE IF NOT EXISTS daily_stats (
    date Date,
    user_id UInt32,
    total_requests UInt32,
    successful_requests UInt32,
    failed_requests UInt32,
    total_data_mb Float32,
    avg_duration_ms Float32,
    unique_proxies UInt32,
    unique_domains UInt32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id);

-- Proxy performance table
CREATE TABLE IF NOT EXISTS proxy_performance (
    date Date,
    proxy_id UInt32,
    proxy_type Enum8('residential' = 1, 'datacenter' = 2, 'mobile' = 3, 'isp' = 4),
    proxy_ip String,
    proxy_country String,
    total_requests UInt32,
    successful_requests UInt32,
    failed_requests UInt32,
    avg_duration_ms Float32,
    total_data_mb Float32,
    success_rate Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, proxy_id);

-- Country statistics
CREATE TABLE IF NOT EXISTS country_stats (
    date Date,
    country String,
    proxy_type Enum8('residential' = 1, 'datacenter' = 2, 'mobile' = 3, 'isp' = 4),
    total_requests UInt32,
    successful_requests UInt32,
    total_data_mb Float32,
    avg_duration_ms Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, country, proxy_type);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UInt64,
    user_id UInt32,
    proxy_id UInt32,
    error_type String,
    error_message String,
    error_code String,
    stack_trace String,
    timestamp DateTime,
    date Date DEFAULT toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (timestamp, user_id)
TTL date + INTERVAL 30 DAY;

-- Materialized view for automatic daily stats aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_stats_mv
TO daily_stats
AS SELECT
    toDate(timestamp) as date,
    user_id,
    count() as total_requests,
    countIf(success = 1) as successful_requests,
    countIf(success = 0) as failed_requests,
    sum(data_used_mb) as total_data_mb,
    avg(request_duration_ms) as avg_duration_ms,
    uniq(proxy_id) as unique_proxies,
    uniq(target_domain) as unique_domains
FROM request_logs
GROUP BY date, user_id;

-- Materialized view for proxy performance
CREATE MATERIALIZED VIEW IF NOT EXISTS proxy_performance_mv
TO proxy_performance
AS SELECT
    toDate(timestamp) as date,
    proxy_id,
    proxy_type,
    proxy_ip,
    proxy_country,
    count() as total_requests,
    countIf(success = 1) as successful_requests,
    countIf(success = 0) as failed_requests,
    avg(request_duration_ms) as avg_duration_ms,
    sum(data_used_mb) as total_data_mb,
    (countIf(success = 1) * 100.0) / count() as success_rate
FROM request_logs
GROUP BY date, proxy_id, proxy_type, proxy_ip, proxy_country;

-- Materialized view for country statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS country_stats_mv
TO country_stats
AS SELECT
    toDate(timestamp) as date,
    proxy_country as country,
    proxy_type,
    count() as total_requests,
    countIf(success = 1) as successful_requests,
    sum(data_used_mb) as total_data_mb,
    avg(request_duration_ms) as avg_duration_ms
FROM request_logs
GROUP BY date, country, proxy_type;

-- Query examples for analytics:

-- Top users by data usage (last 30 days)
-- SELECT 
--     user_email,
--     sum(total_data_mb) as total_data_gb,
--     sum(total_requests) as total_requests
-- FROM daily_stats
-- JOIN users ON daily_stats.user_id = users.id
-- WHERE date >= today() - 30
-- GROUP BY user_email
-- ORDER BY total_data_gb DESC
-- LIMIT 10;

-- Proxy success rates
-- SELECT 
--     proxy_ip,
--     proxy_country,
--     avg(success_rate) as avg_success_rate,
--     sum(total_requests) as total_requests
-- FROM proxy_performance
-- WHERE date >= today() - 7
-- GROUP BY proxy_ip, proxy_country
-- ORDER BY avg_success_rate DESC;

-- Hourly request volume
-- SELECT 
--     toStartOfHour(timestamp) as hour,
--     count() as requests,
--     countIf(success = 1) as successful
-- FROM request_logs
-- WHERE date = today()
-- GROUP BY hour
-- ORDER BY hour;

-- Most popular target domains
-- SELECT 
--     target_domain,
--     count() as requests,
--     sum(data_used_mb) as total_mb
-- FROM request_logs
-- WHERE date >= today() - 7
-- GROUP BY target_domain
-- ORDER BY requests DESC
-- LIMIT 20;
