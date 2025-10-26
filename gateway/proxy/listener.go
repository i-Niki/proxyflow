package proxy

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"
)

// Listener is HTTP CONNECT proxy listener
type Listener struct {
	addr     string
	handler  *Handler
	listener net.Listener
	wg       sync.WaitGroup
	stopChan chan struct{}
}

// NewListener creates a new proxy listener
func NewListener(addr string, handler *Handler) *Listener {
	return &Listener{
		addr:     addr,
		handler:  handler,
		stopChan: make(chan struct{}),
	}
}

// Start starts the listener
func (l *Listener) Start() error {
	listener, err := net.Listen("tcp", l.addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", l.addr, err)
	}

	l.listener = listener
	log.Printf("INFO: Gateway listening on %s", l.addr)

	go l.acceptLoop()

	return nil
}

// acceptLoop accepts incoming connections
func (l *Listener) acceptLoop() {
	for {
		select {
		case <-l.stopChan:
			return
		default:
		}

		conn, err := l.listener.Accept()
		if err != nil {
			select {
			case <-l.stopChan:
				return
			default:
				log.Printf("ERROR: Failed to accept connection: %v", err)
				continue
			}
		}

		l.wg.Add(1)
		go func() {
			defer l.wg.Done()
			l.handler.HandleConnection(conn)
		}()
	}
}

// Stop gracefully stops the listener
func (l *Listener) Stop(ctx context.Context) error {
	close(l.stopChan)

	if l.listener != nil {
		l.listener.Close()
	}

	// Wait for all connections to finish or timeout
	done := make(chan struct{})
	go func() {
		l.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		log.Printf("INFO: All connections closed gracefully")
		return nil
	case <-ctx.Done():
		log.Printf("WARN: Shutdown timeout, some connections may be aborted")
		return ctx.Err()
	}
}
