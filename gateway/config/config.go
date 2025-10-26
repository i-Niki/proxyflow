package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the gateway
type Config struct {
	// Server
	ListenAddr      string
	ListenPort      int
	ShutdownTimeout int // seconds

	// PostgreSQL
	PostgresHost     string
	PostgresPort     int
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string

	// ClickHouse
	ClickHouseHost string
	ClickHousePort int
	ClickHouseDB   string
	ClickHouseUser string
	ClickHousePass string

	// Traffic tracking
	TrafficFlushInterval int // seconds
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		ListenAddr:           getEnv("GATEWAY_LISTEN_ADDR", "0.0.0.0"),
		ListenPort:           getEnvInt("GATEWAY_LISTEN_PORT", 8080),
		ShutdownTimeout:      getEnvInt("GATEWAY_SHUTDOWN_TIMEOUT", 30),
		PostgresHost:         getEnv("POSTGRES_HOST", "postgres"),
		PostgresPort:         getEnvInt("POSTGRES_PORT", 5432),
		PostgresUser:         getEnv("POSTGRES_USER", "proxyuser"),
		PostgresPassword:     getEnv("POSTGRES_PASSWORD", "proxypass123"),
		PostgresDB:           getEnv("POSTGRES_DB", "proxyflow"),
		ClickHouseHost:       getEnv("CLICKHOUSE_HOST", "clickhouse"),
		ClickHousePort:       getEnvInt("CLICKHOUSE_PORT", 9000),
		ClickHouseDB:         getEnv("CLICKHOUSE_DB", "proxyflow_analytics"),
		ClickHouseUser:       getEnv("CLICKHOUSE_USER", "default"),
		ClickHousePass:       getEnv("CLICKHOUSE_PASS", ""),
		TrafficFlushInterval: getEnvInt("TRAFFIC_FLUSH_INTERVAL", 60),
	}

	return cfg, nil
}

// PostgresDSN returns PostgreSQL connection string
func (c *Config) PostgresDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		c.PostgresHost, c.PostgresPort, c.PostgresUser, c.PostgresPassword, c.PostgresDB,
	)
}

// ClickHouseDSN returns ClickHouse connection string
func (c *Config) ClickHouseDSN() string {
	return fmt.Sprintf(
		"tcp://%s:%d?database=%s&username=%s&password=%s",
		c.ClickHouseHost, c.ClickHousePort, c.ClickHouseDB, c.ClickHouseUser, c.ClickHousePass,
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
