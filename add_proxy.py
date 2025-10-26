#!/usr/bin/env python3
"""Скрипт для добавления прокси"""

import psycopg2
import sys

def add_proxy(proxy_type, ip, port, country="US", city="", max_users=10):
    conn = psycopg2.connect(
        dbname="proxyflow",
        user="proxyuser",
        password="proxypass123",
        host="localhost",
        port="5432"
    )

    cur = conn.cursor()

    cur.execute("""
        INSERT INTO proxy_pools (proxy_type, ip_address, port, country, city, is_active, success_rate, max_users, current_users)
        VALUES (%s, %s, %s, %s, %s, true, 100.0, %s, 0)
    """, (proxy_type, ip, port, country, city, max_users))

    conn.commit()
    cur.close()
    conn.close()

    print(f"✅ Прокси добавлен: {ip}:{port} ({proxy_type}, max_users={max_users})")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Использование: python add_proxy.py <type> <ip> <port> [country] [city] [max_users]")
        print("Пример: python add_proxy.py residential 192.168.1.100 8080 US 'New York' 10")
        print("max_users: максимальное кол-во пользователей на прокси (по умолчанию 10)")
        sys.exit(1)

    proxy_type = sys.argv[1]
    ip = sys.argv[2]
    port = int(sys.argv[3])
    country = sys.argv[4] if len(sys.argv) > 4 else "US"
    city = sys.argv[5] if len(sys.argv) > 5 else ""
    max_users = int(sys.argv[6]) if len(sys.argv) > 6 else 10

    add_proxy(proxy_type, ip, port, country, city, max_users)
