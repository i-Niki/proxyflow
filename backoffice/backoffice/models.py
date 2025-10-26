from django.db import models
from django.utils import timezone


# Models matching the FastAPI database structure
class User(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, unique=True)
    hashed_password = models.CharField(max_length=255)
    api_key = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'users'
        managed = True
    
    def __str__(self):
        return f"{self.username} ({self.email})"


class ProxyPool(models.Model):
    """Maps to FastAPI's proxy_pools table"""
    # Values must match DB enum names (uppercase) for compatibility with SQLAlchemy Enum names
    PROXY_TYPES = [
		('RESIDENTIAL', 'RESIDENTIAL'),
		('DATACENTER', 'DATACENTER'),
		('MOBILE', 'MOBILE'),
		('ISP', 'ISP')
    ]
    
    proxy_type = models.CharField(max_length=20, choices=PROXY_TYPES)
    ip_address = models.CharField(max_length=255)
    port = models.IntegerField()
    country = models.CharField(max_length=10, blank=True)
    city = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)
    success_rate = models.FloatField(default=100.0)
    
    # Shared proxies support
    max_users = models.IntegerField(default=10, help_text="Max users that can use this proxy. Set to 1 for dedicated.")
    current_users = models.IntegerField(default=0, help_text="Current number of users assigned to this proxy")
    
    class Meta:
        db_table = 'proxy_pools'
        managed = True
        verbose_name = 'Proxy Pool'
        verbose_name_plural = 'Proxy Pools'
    
    def __str__(self):
        return f"{self.proxy_type} - {self.ip_address}:{self.port} ({self.country})"
    
    @property
    def is_available(self):
        """Check if proxy can accept more users"""
        return self.is_active and self.current_users < self.max_users


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=50)  # enum: starter/professional/enterprise
    
    # Data limits (for future Proxy Gateway)
    data_limit_gb = models.FloatField()
    data_used_gb = models.FloatField(default=0.0)
    
    # Proxy allocation limits (MVP - shared proxies)
    allocated_proxies_limit = models.IntegerField(default=10, help_text="How many proxies user can allocate")
    allocated_proxies_count = models.IntegerField(default=0, help_text="How many proxies currently allocated")
    
    concurrent_connections = models.IntegerField()
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscriptions'
        managed = True
    
    def __str__(self):
        return f"{self.user.username} - {self.plan}"
    
    @property
    def proxy_usage_percent(self):
        if self.allocated_proxies_limit == 0:
            return 0
        return (self.allocated_proxies_count / self.allocated_proxies_limit) * 100
    
    @property
    def remaining_proxies(self):
        return max(0, self.allocated_proxies_limit - self.allocated_proxies_count)


class UserAllocatedProxy(models.Model):
    """Tracks which proxies are allocated to which users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='allocated_proxies')
    proxy_pool = models.ForeignKey(ProxyPool, on_delete=models.CASCADE, related_name='allocations')
    gateway_port = models.IntegerField(help_text="Port on Gateway server for this user's proxy")
    allocated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_allocated_proxies'
        managed = True
        unique_together = [['user', 'gateway_port']]  # Each user has unique ports
        indexes = [
            models.Index(fields=['user', 'gateway_port']),
            models.Index(fields=['gateway_port']),
        ]
    
    def __str__(self):
        return f"{self.user.username} → Port {self.gateway_port} → {self.proxy_pool}"


class UsageLog(models.Model):
    """Maps to FastAPI's usage_logs table"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='usage_logs')
    proxy_id = models.IntegerField()  # FK to proxy_pools
    data_used_mb = models.FloatField(default=0.0)
    request_count = models.IntegerField(default=1)
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'usage_logs'
        managed = True
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"User {self.user.username} - {self.timestamp}"