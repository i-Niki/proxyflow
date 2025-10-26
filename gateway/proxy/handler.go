package proxy

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/i-Niki/proxyflow/gateway/auth"
	"github.com/i-Niki/proxyflow/gateway/db"
	"github.com/i-Niki/proxyflow/gateway/tracker"
)

// AllocationInfo holds information about allocated proxy
type AllocationInfo struct {
	UserID       int
	ProxyID      int
	ProxyIP      string
	ProxyPort    int
	ProxyType    string
	ProxyCountry string
}

// Handler handles proxy connections
type Handler struct {
	dbClient *db.Client
	tracker  *tracker.Tracker
}

// NewHandler creates a new connection handler
func NewHandler(dbClient *db.Client, tracker *tracker.Tracker) *Handler {
	return &Handler{
		dbClient: dbClient,
		tracker:  tracker,
	}
}

// HandleConnection handles a single client connection
func (h *Handler) HandleConnection(clientConn net.Conn) {
	defer clientConn.Close()

	clientAddr := clientConn.RemoteAddr().String()
	log.Printf("INFO: New connection from %s", clientAddr)

	// Set read timeout for initial handshake
	clientConn.SetReadDeadline(time.Now().Add(30 * time.Second))

	// Read HTTP CONNECT request
	reader := bufio.NewReader(clientConn)
	req, err := http.ReadRequest(reader)
	if err != nil {
		log.Printf("ERROR: Failed to read request from %s: %v", clientAddr, err)
		return
	}

	// Only support CONNECT method
	if req.Method != http.MethodConnect {
		log.Printf("WARN: Unsupported method %s from %s", req.Method, clientAddr)
		h.sendError(clientConn, "405 Method Not Allowed")
		return
	}

	targetHost := req.Host
	log.Printf("DEBUG: CONNECT request to %s from %s", targetHost, clientAddr)

	// Parse and verify credentials
	authHeader := req.Header.Get("Proxy-Authorization")
	if authHeader == "" {
		log.Printf("WARN: Missing Proxy-Authorization from %s", clientAddr)
		h.sendError(clientConn, "407 Proxy Authentication Required")
		return
	}

	creds, err := auth.ParseProxyAuth(authHeader)
	if err != nil {
		log.Printf("WARN: Failed to parse auth from %s: %v", clientAddr, err)
		h.sendError(clientConn, "407 Proxy Authentication Required")
		return
	}

	log.Printf("DEBUG: Auth: username=%s, vport=%d", creds.Username, creds.VPort)

	// Authenticate and get proxy allocation
	allocation, err := auth.Authenticate(h.dbClient, creds)
	if err != nil {
		log.Printf("WARN: Authentication failed from %s: %v", clientAddr, err)
		h.sendError(clientConn, "407 Proxy Authentication Required")
		return
	}

	log.Printf("INFO: Authenticated user=%s, proxy=%s:%d",
		allocation.Username, allocation.ProxyIP, allocation.ProxyPort)

	// Connect to original proxy
	proxyAddr := fmt.Sprintf("%s:%d", allocation.ProxyIP, allocation.ProxyPort)
	targetConn, err := net.DialTimeout("tcp", proxyAddr, 10*time.Second)
	if err != nil {
		log.Printf("ERROR: Failed to connect to proxy %s: %v", proxyAddr, err)
		h.sendError(clientConn, "502 Bad Gateway")
		return
	}
	defer targetConn.Close()

	log.Printf("INFO: Connected to original proxy %s", proxyAddr)

	// Send CONNECT request to original proxy
	connectReq := fmt.Sprintf("CONNECT %s HTTP/1.1\r\nHost: %s\r\n\r\n", targetHost, targetHost)
	if _, err := targetConn.Write([]byte(connectReq)); err != nil {
		log.Printf("ERROR: Failed to send CONNECT to proxy: %v", err)
		h.sendError(clientConn, "502 Bad Gateway")
		return
	}

	// Read response from original proxy
	proxyReader := bufio.NewReader(targetConn)
	proxyResp, err := http.ReadResponse(proxyReader, req)
	if err != nil {
		log.Printf("ERROR: Failed to read proxy response: %v", err)
		h.sendError(clientConn, "502 Bad Gateway")
		return
	}

	if proxyResp.StatusCode != 200 {
		log.Printf("ERROR: Proxy returned status %d", proxyResp.StatusCode)
		h.sendError(clientConn, fmt.Sprintf("%d %s", proxyResp.StatusCode, proxyResp.Status))
		return
	}

	// Send success response to client
	clientConn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	// Remove read timeout for data transfer
	clientConn.SetReadDeadline(time.Time{})

	log.Printf("INFO: Tunnel established for %s via %s", targetHost, proxyAddr)

	// Create allocation info for stats
	allocInfo := &AllocationInfo{
		UserID:       allocation.UserID,
		ProxyID:      0, // TODO: get proxy_pool.id
		ProxyIP:      allocation.ProxyIP,
		ProxyPort:    allocation.ProxyPort,
		ProxyType:    allocation.ProxyType,
		ProxyCountry: allocation.ProxyCountry,
	}

	// Start bidirectional tunnel with traffic tracking
	result := Tunnel(clientConn, targetConn)

	// Record statistics
	RecordStats(result, allocInfo, h.tracker, true)

	log.Printf("INFO: Connection closed: %s (up=%d, down=%d)",
		clientAddr, result.BytesUp, result.BytesDown)
}

// sendError sends an HTTP error response to client
func (h *Handler) sendError(conn net.Conn, message string) {
	response := fmt.Sprintf("HTTP/1.1 %s\r\n\r\n", message)
	conn.Write([]byte(response))
}

// parseConnectHost extracts host from CONNECT request
func parseConnectHost(host string) string {
	// Remove port if present
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		return host[:idx]
	}
	return host
}
