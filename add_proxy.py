#!/usr/bin/env python3
"""Скрипт для добавления прокси"""

import psycopg2
import sys

def add_proxy(proxy_type, ip, port, country="US", city="", max_users=10, proxy_username="", proxy_password=""):
    conn = psycopg2.connect(
        dbname="proxyflow",
        user="proxyuser",
        password="proxypass123",
        host="localhost",
        port="5432"
    )

    cur = conn.cursor()

    cur.execute("""
        INSERT INTO proxy_pools (proxy_type, ip_address, port, country, city, is_active, success_rate, max_users, current_users, proxy_username, proxy_password)
        VALUES (%s, %s, %s, %s, %s, true, 100.0, %s, 0, %s, %s)
    """, (proxy_type, ip, port, country, city, max_users, proxy_username, proxy_password))

    conn.commit()
    cur.close()
    conn.close()

    auth_info = f" (auth: {proxy_username})" if proxy_username else " (no auth)"
    print(f"✅ Прокси добавлен: {ip}:{port} ({proxy_type}, max_users={max_users}){auth_info}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Использование: python add_proxy.py <type> <ip> <port> [country] [city] [max_users] [proxy_username] [proxy_password]")
        print("Пример: python add_proxy.py residential 192.168.1.100 8080 US 'New York' 10 squid_user squid_pass")
        print("max_users: максимальное кол-во пользователей на прокси (по умолчанию 10)")
        print("proxy_username/proxy_password: креды для аутентификации на оригинальном прокси (опционально)")
        sys.exit(1)

    proxy_type = sys.argv[1]
    ip = sys.argv[2]
    port = int(sys.argv[3])
    country = sys.argv[4] if len(sys.argv) > 4 else "US"
    city = sys.argv[5] if len(sys.argv) > 5 else ""
    max_users = int(sys.argv[6]) if len(sys.argv) > 6 else 10
    proxy_username = sys.argv[7] if len(sys.argv) > 7 else ""
    proxy_password = sys.argv[8] if len(sys.argv) > 8 else ""

    add_proxy(proxy_type, ip, port, country, city, max_users, proxy_username, proxy_password)
