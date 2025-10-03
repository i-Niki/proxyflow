from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import User, Proxy, ProxyUsage, ApiKey


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'api_key', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email', 'api_key']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('username', 'email', 'is_active')
        }),
        ('Security', {
            'fields': ('hashed_password', 'api_key')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Proxy)
class ProxyAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'host_port', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'user']
    search_fields = ['name', 'host', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Proxy Information', {
            'fields': ('name', 'user', 'is_active')
        }),
        ('Connection Details', {
            'fields': ('host', 'port', 'username', 'password')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def host_port(self, obj):
        return f"{obj.host}:{obj.port}"
    host_port.short_description = 'Host:Port'


@admin.register(ProxyUsage)
class ProxyUsageAdmin(admin.ModelAdmin):
    list_display = ['proxy', 'requests_count', 'bytes_sent', 'bytes_received', 'timestamp']
    list_filter = ['timestamp', 'proxy__user']
    search_fields = ['proxy__name', 'proxy__user__username']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Usage Information', {
            'fields': ('proxy', 'requests_count', 'bytes_sent', 'bytes_received')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )


@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'key_display', 'is_active', 'created_at', 'last_used']
    list_filter = ['is_active', 'created_at', 'last_used']
    search_fields = ['name', 'key', 'user__username']
    readonly_fields = ['created_at', 'last_used']
    ordering = ['-created_at']
    
    fieldsets = (
        ('API Key Information', {
            'fields': ('name', 'user', 'is_active')
        }),
        ('Key Details', {
            'fields': ('key',)
        }),
        ('Usage', {
            'fields': ('last_used',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def key_display(self, obj):
        if obj.key:
            return f"{obj.key[:8]}...{obj.key[-4:]}"
        return "No key"
    key_display.short_description = 'API Key'


# Customize admin site
admin.site.site_header = "ProxyFlow Backoffice"
admin.site.site_title = "ProxyFlow Admin"
admin.site.index_title = "Welcome to ProxyFlow Administration"
