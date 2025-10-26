package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

// ProxyAllocation represents a user's allocated proxy
type ProxyAllocation struct {
	UserID          int
	Username        string
	APIKey          string
	GatewayPort     int
	ProxyIP         string
	ProxyPort       int
	ProxyType       string
	ProxyCountry    string
	AllocatedAt     string
}

// Client is PostgreSQL client
type Client struct {
	db *sql.DB
}

// NewClient creates a new PostgreSQL client
func NewClient(dsn string) (*Client, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	return &Client{db: db}, nil
}

// Close closes the database connection
func (c *Client) Close() error {
	return c.db.Close()
}

// GetAllocationByVPort gets proxy allocation by username, api_key, and virtual port
func (c *Client) GetAllocationByVPort(username string, apiKey string, vport int) (*ProxyAllocation, error) {
	query := `
		SELECT
			u.id,
			u.username,
			u.api_key,
			uap.gateway_port,
			pp.ip_address,
			pp.port,
			pp.proxy_type,
			pp.country,
			uap.allocated_at
		FROM user_allocated_proxies uap
		JOIN users u ON u.id = uap.user_id
		JOIN proxy_pools pp ON pp.id = uap.proxy_pool_id
		WHERE u.username = $1
		  AND u.api_key = $2
		  AND uap.gateway_port = $3
		  AND u.is_active = true
		LIMIT 1
	`

	alloc := &ProxyAllocation{}
	err := c.db.QueryRow(query, username, apiKey, vport).Scan(
		&alloc.UserID,
		&alloc.Username,
		&alloc.APIKey,
		&alloc.GatewayPort,
		&alloc.ProxyIP,
		&alloc.ProxyPort,
		&alloc.ProxyType,
		&alloc.ProxyCountry,
		&alloc.AllocatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Not found
	}

	if err != nil {
		return nil, fmt.Errorf("failed to query allocation: %w", err)
	}

	return alloc, nil
}

// UpdateDataUsage updates user's data usage in subscriptions table
func (c *Client) UpdateDataUsage(userID int, bytesUsed int64) error {
	query := `
		UPDATE subscriptions
		SET data_used_gb = data_used_gb + $1
		WHERE user_id = $2
	`

	gbUsed := float64(bytesUsed) / (1024 * 1024 * 1024)
	_, err := c.db.Exec(query, gbUsed, userID)
	if err != nil {
		return fmt.Errorf("failed to update data usage: %w", err)
	}

	return nil
}
