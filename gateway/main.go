package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/i-Niki/proxyflow/gateway/config"
	"github.com/i-Niki/proxyflow/gateway/db"
	"github.com/i-Niki/proxyflow/gateway/proxy"
	"github.com/i-Niki/proxyflow/gateway/tracker"

	// Register ClickHouse driver
	_ "github.com/ClickHouse/clickhouse-go/v2"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("INFO: ProxyFlow Gateway starting...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("FATAL: Failed to load config: %v", err)
	}

	log.Printf("INFO: Configuration loaded")
	log.Printf("INFO: Listen address: %s:%d", cfg.ListenAddr, cfg.ListenPort)
	log.Printf("INFO: PostgreSQL: %s:%d/%s", cfg.PostgresHost, cfg.PostgresPort, cfg.PostgresDB)
	log.Printf("INFO: ClickHouse: %s:%d/%s", cfg.ClickHouseHost, cfg.ClickHousePort, cfg.ClickHouseDB)

	// Connect to PostgreSQL
	dbClient, err := db.NewClient(cfg.PostgresDSN())
	if err != nil {
		log.Fatalf("FATAL: Failed to connect to PostgreSQL: %v", err)
	}
	defer dbClient.Close()
	log.Printf("INFO: Connected to PostgreSQL")

	// Create traffic tracker
	trafficTracker, err := tracker.NewTracker(dbClient, cfg.ClickHouseDSN(), cfg.TrafficFlushInterval)
	if err != nil {
		log.Fatalf("FATAL: Failed to create tracker: %v", err)
	}
	defer trafficTracker.Close()
	log.Printf("INFO: Traffic tracker initialized (flush interval: %ds)", cfg.TrafficFlushInterval)

	// Create proxy handler
	handler := proxy.NewHandler(dbClient, trafficTracker)

	// Create and start listener
	listenAddr := fmt.Sprintf("%s:%d", cfg.ListenAddr, cfg.ListenPort)
	listener := proxy.NewListener(listenAddr, handler)

	if err := listener.Start(); err != nil {
		log.Fatalf("FATAL: Failed to start listener: %v", err)
	}

	log.Printf("INFO: Gateway is ready to accept connections")

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigChan

	log.Printf("INFO: Received signal: %v, shutting down...", sig)

	// Graceful shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.ShutdownTimeout)*time.Second)
	defer cancel()

	if err := listener.Stop(shutdownCtx); err != nil {
		log.Printf("WARN: Shutdown error: %v", err)
	}

	log.Printf("INFO: Gateway stopped")
}
