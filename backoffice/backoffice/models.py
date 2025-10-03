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
        managed = False
    
    def __str__(self):
        return f"{self.username} ({self.email})"


class Proxy(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proxies')
    name = models.CharField(max_length=200)
    host = models.CharField(max_length=255)
    port = models.IntegerField()
    username = models.CharField(max_length=100, blank=True)
    password = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'proxies'
        managed = False
        verbose_name_plural = 'proxies'
    
    def __str__(self):
        return f"{self.name} ({self.host}:{self.port})"


class ProxyUsage(models.Model):
    proxy = models.ForeignKey(Proxy, on_delete=models.CASCADE, related_name='usage_logs')
    bytes_sent = models.BigIntegerField(default=0)
    bytes_received = models.BigIntegerField(default=0)
    requests_count = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'proxy_usage'
        managed = False
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.proxy.name} - {self.timestamp}"


class ApiKey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'api_keys'
        managed = False
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"
