package tracker

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/i-Niki/proxyflow/gateway/db"
)

// ConnectionStats holds traffic statistics for a single connection
type ConnectionStats struct {
	UserID       int
	ProxyID      int
	BytesUp      int64 // Client -> Proxy
	BytesDown    int64 // Proxy -> Client
	StartTime    time.Time
	EndTime      time.Time
	ProxyType    string
	ProxyIP      string
	ProxyCountry string
	Success      bool
}

// Tracker manages traffic statistics
type Tracker struct {
	mu           sync.Mutex
	pending      []*ConnectionStats
	dbClient     *db.Client
	clickHouseDB *sql.DB
	flushTicker  *time.Ticker
	stopChan     chan struct{}
}

// NewTracker creates a new traffic tracker
func NewTracker(dbClient *db.Client, clickHouseDSN string, flushInterval int) (*Tracker, error) {
	// Connect to ClickHouse
	chDB, err := sql.Open("clickhouse", clickHouseDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to clickhouse: %w", err)
	}

	if err := chDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping clickhouse: %w", err)
	}

	tracker := &Tracker{
		pending:      make([]*ConnectionStats, 0, 1000),
		dbClient:     dbClient,
		clickHouseDB: chDB,
		flushTicker:  time.NewTicker(time.Duration(flushInterval) * time.Second),
		stopChan:     make(chan struct{}),
	}

	// Start background flusher
	go tracker.periodicFlush()

	return tracker, nil
}

// RecordConnection records connection statistics
func (t *Tracker) RecordConnection(stats *ConnectionStats) {
	t.mu.Lock()
	defer t.mu.Unlock()

	stats.EndTime = time.Now()
	t.pending = append(t.pending, stats)
}

// periodicFlush periodically flushes pending stats
func (t *Tracker) periodicFlush() {
	for {
		select {
		case <-t.flushTicker.C:
			if err := t.Flush(); err != nil {
				log.Printf("ERROR: Failed to flush stats: %v", err)
			}
		case <-t.stopChan:
			return
		}
	}
}

// Flush flushes pending stats to ClickHouse and PostgreSQL
func (t *Tracker) Flush() error {
	t.mu.Lock()
	pending := t.pending
	t.pending = make([]*ConnectionStats, 0, 1000)
	t.mu.Unlock()

	if len(pending) == 0 {
		return nil
	}

	log.Printf("INFO: Flushing %d connection stats", len(pending))

	// Flush to ClickHouse
	if err := t.flushToClickHouse(pending); err != nil {
		log.Printf("ERROR: Failed to flush to ClickHouse: %v", err)
		// Continue to flush PostgreSQL anyway
	}

	// Update data usage in PostgreSQL
	if err := t.updatePostgresUsage(pending); err != nil {
		log.Printf("ERROR: Failed to update PostgreSQL usage: %v", err)
		return err
	}

	return nil
}

// flushToClickHouse inserts stats into ClickHouse
func (t *Tracker) flushToClickHouse(stats []*ConnectionStats) error {
	if len(stats) == 0 {
		return nil
	}

	ctx := context.Background()
	tx, err := t.clickHouseDB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO request_logs (
			id, user_id, user_email, proxy_id, proxy_type, proxy_ip, proxy_country,
			data_used_mb, request_duration_ms, status_code, success,
			error_message, user_agent, target_domain, timestamp, date
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, stat := range stats {
		dataUsedMB := float32(stat.BytesUp+stat.BytesDown) / (1024 * 1024)
		durationMS := uint32(stat.EndTime.Sub(stat.StartTime).Milliseconds())
		successFlag := uint8(0)
		if stat.Success {
			successFlag = 1
		}

		_, err := stmt.ExecContext(
			ctx,
			time.Now().UnixNano(), // id
			stat.UserID,
			"",                 // user_email (TODO: pass from allocation)
			stat.ProxyID,
			stat.ProxyType,
			stat.ProxyIP,
			stat.ProxyCountry,
			dataUsedMB,
			durationMS,
			200,                // status_code (TODO: capture real status)
			successFlag,
			"",                 // error_message
			"",                 // user_agent (TODO: capture if needed)
			"",                 // target_domain (TODO: parse from CONNECT)
			stat.StartTime,
			stat.StartTime,     // date
		)
		if err != nil {
			return fmt.Errorf("failed to insert stat: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("INFO: Flushed %d stats to ClickHouse", len(stats))
	return nil
}

// updatePostgresUsage updates data_used_gb in subscriptions table
func (t *Tracker) updatePostgresUsage(stats []*ConnectionStats) error {
	// Aggregate by user_id
	usageByUser := make(map[int]int64)
	for _, stat := range stats {
		usageByUser[stat.UserID] += stat.BytesUp + stat.BytesDown
	}

	// Update each user
	for userID, bytesUsed := range usageByUser {
		if err := t.dbClient.UpdateDataUsage(userID, bytesUsed); err != nil {
			return fmt.Errorf("failed to update usage for user %d: %w", userID, err)
		}
	}

	log.Printf("INFO: Updated data usage for %d users", len(usageByUser))
	return nil
}

// Close stops the tracker and flushes pending stats
func (t *Tracker) Close() error {
	close(t.stopChan)
	t.flushTicker.Stop()

	// Final flush
	if err := t.Flush(); err != nil {
		log.Printf("ERROR: Failed final flush: %v", err)
	}

	if t.clickHouseDB != nil {
		t.clickHouseDB.Close()
	}

	return nil
}
