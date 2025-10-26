# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy everything
COPY . .

# Download dependencies and build in one step
# This allows go.sum to be created and used in the same layer
RUN go mod download && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o gateway main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/gateway .

# Expose port
EXPOSE 8080

CMD ["./gateway"]
