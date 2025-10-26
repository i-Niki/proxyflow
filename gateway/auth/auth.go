package auth

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"

	"github.com/i-Niki/proxyflow/gateway/db"
)

// Credentials represents parsed proxy credentials
type Credentials struct {
	Username string
	APIKey   string
	VPort    int // Virtual port
}

// ParseProxyAuth parses Proxy-Authorization header
// Format: "Basic base64(username_vport:api_key)"
// Example: "Basic YWxpY2VfMTAwMDE6cGtfYWJjMTIz" (alice_10001:pk_abc123)
func ParseProxyAuth(authHeader string) (*Credentials, error) {
	// Remove "Basic " prefix
	if !strings.HasPrefix(authHeader, "Basic ") {
		return nil, fmt.Errorf("invalid auth header format")
	}

	encoded := strings.TrimPrefix(authHeader, "Basic ")
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("failed to decode auth: %w", err)
	}

	// Split by ":"
	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid credentials format")
	}

	usernamePart := parts[0]
	apiKey := parts[1]

	// Parse username_vport
	username, vport, err := parseUsernameVPort(usernamePart)
	if err != nil {
		return nil, fmt.Errorf("failed to parse username_vport: %w", err)
	}

	return &Credentials{
		Username: username,
		APIKey:   apiKey,
		VPort:    vport,
	}, nil
}

// parseUsernameVPort parses "username_vport" into username and virtual port
// Example: "alice_10001" -> ("alice", 10001)
func parseUsernameVPort(input string) (string, int, error) {
	// Find last underscore
	lastIdx := strings.LastIndex(input, "_")
	if lastIdx == -1 {
		return "", 0, fmt.Errorf("invalid format: missing underscore")
	}

	username := input[:lastIdx]
	vportStr := input[lastIdx+1:]

	vport, err := strconv.Atoi(vportStr)
	if err != nil {
		return "", 0, fmt.Errorf("invalid vport number: %w", err)
	}

	if username == "" {
		return "", 0, fmt.Errorf("username is empty")
	}

	return username, vport, nil
}

// Authenticate verifies credentials and returns proxy allocation
func Authenticate(dbClient *db.Client, creds *Credentials) (*db.ProxyAllocation, error) {
	alloc, err := dbClient.GetAllocationByVPort(creds.Username, creds.APIKey, creds.VPort)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}

	if alloc == nil {
		return nil, fmt.Errorf("invalid credentials or proxy not found")
	}

	return alloc, nil
}
