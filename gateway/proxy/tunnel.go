package proxy

import (
	"io"
	"log"
	"net"
	"sync"
	"time"

	"github.com/i-Niki/proxyflow/gateway/tracker"
)

// TunnelResult holds the result of tunneling
type TunnelResult struct {
	BytesUp   int64
	BytesDown int64
	Duration  time.Duration
	Error     error
}

// Tunnel creates a bidirectional tunnel between client and target
// Returns total bytes transferred (up, down)
func Tunnel(client net.Conn, target net.Conn) TunnelResult {
	startTime := time.Now()

	var bytesUp, bytesDown int64
	var mu sync.Mutex
	var wg sync.WaitGroup
	wg.Add(2)

	// Client -> Target (upload)
	go func() {
		defer wg.Done()
		n, err := io.Copy(target, client)
		mu.Lock()
		bytesUp = n
		mu.Unlock()

		if err != nil && err != io.EOF {
			log.Printf("DEBUG: Upload tunnel error: %v", err)
		}

		// Close write side to signal end of upload
		if tcpConn, ok := target.(*net.TCPConn); ok {
			tcpConn.CloseWrite()
		}
	}()

	// Target -> Client (download)
	go func() {
		defer wg.Done()
		n, err := io.Copy(client, target)
		mu.Lock()
		bytesDown = n
		mu.Unlock()

		if err != nil && err != io.EOF {
			log.Printf("DEBUG: Download tunnel error: %v", err)
		}

		// Close write side to signal end of download
		if tcpConn, ok := client.(*net.TCPConn); ok {
			tcpConn.CloseWrite()
		}
	}()

	wg.Wait()
	duration := time.Since(startTime)

	return TunnelResult{
		BytesUp:   bytesUp,
		BytesDown: bytesDown,
		Duration:  duration,
	}
}

// RecordStats records connection statistics
func RecordStats(result TunnelResult, alloc *AllocationInfo, t *tracker.Tracker, success bool) {
	stats := &tracker.ConnectionStats{
		UserID:       alloc.UserID,
		ProxyID:      alloc.ProxyID,
		BytesUp:      result.BytesUp,
		BytesDown:    result.BytesDown,
		StartTime:    time.Now().Add(-result.Duration),
		ProxyType:    alloc.ProxyType,
		ProxyIP:      alloc.ProxyIP,
		ProxyCountry: alloc.ProxyCountry,
		Success:      success,
	}

	t.RecordConnection(stats)

	log.Printf("INFO: Connection stats: user=%d, up=%d, down=%d, duration=%s, success=%v",
		alloc.UserID, result.BytesUp, result.BytesDown, result.Duration, success)
}
