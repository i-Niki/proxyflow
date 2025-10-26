from django.contrib import admin
from django.utils.html import format_html
from .models import User, Subscription, ProxyPool, UsageLog, UserAllocatedProxy


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'api_key_display', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email', 'api_key']
    readonly_fields = ['created_at', 'api_key']
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
    
    def api_key_display(self, obj):
        if obj.api_key:
            return f"{obj.api_key[:8]}...{obj.api_key[-4:]}"
        return "No key"
    api_key_display.short_description = 'API Key'


@admin.register(ProxyPool)
class ProxyPoolAdmin(admin.ModelAdmin):
    list_display = ['proxy_type', 'ip_port', 'country', 'city', 'usage_display', 'is_active', 'success_rate', 'last_used']
    list_filter = ['proxy_type', 'is_active', 'country']
    search_fields = ['ip_address', 'country', 'city']
    readonly_fields = ['last_used', 'current_users']
    ordering = ['-last_used']
    
    fieldsets = (
        ('Proxy Information', {
            'fields': ('proxy_type', 'is_active')
        }),
        ('Connection Details', {
            'fields': ('ip_address', 'port', 'country', 'city')
        }),
        ('Shared Proxy Settings', {
            'fields': ('max_users', 'current_users'),
            'description': 'For dedicated proxies, set max_users=1. For shared, set 10+.'
        }),
        ('Performance', {
            'fields': ('success_rate', 'last_used')
        }),
    )
    
    def ip_port(self, obj):
        return f"{obj.ip_address}:{obj.port}"
    ip_port.short_description = 'IP:Port'
    
    def usage_display(self, obj):
        percent = int(round((obj.current_users / obj.max_users * 100))) if obj.max_users > 0 else 0
        return f"{obj.current_users} / {obj.max_users} users ({percent}%)"
    usage_display.short_description = 'Usage'


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'plan', 'proxy_allocation_display', 
        'is_active', 'expires_at'
    ]
    list_filter = ['plan', 'is_active', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'proxy_usage_percent_display', 'remaining_proxies']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Subscription Info', {
            'fields': ('user', 'plan', 'is_active', 'expires_at')
        }),
        ('Proxy Allocation (MVP - Shared)', {
            'fields': (
                'allocated_proxies_limit', 
                'allocated_proxies_count',
                'remaining_proxies',
                'proxy_usage_percent_display',
            ),
            'description': 'Shared proxies - multiple users can use same proxy'
        }),
        ('Data Limits (Future Gateway)', {
            'fields': ('data_limit_gb', 'data_used_gb'),
            'classes': ('collapse',),
            'description': 'Will be used when Proxy Gateway is implemented'
        }),
        ('Connection Limits', {
            'fields': ('concurrent_connections',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def proxy_allocation_display(self, obj):
        percent = float(obj.proxy_usage_percent)
        return f"{obj.allocated_proxies_count} / {obj.allocated_proxies_limit} ({percent:.1f}%)"
    proxy_allocation_display.short_description = 'Allocated Proxies'
    
    def proxy_usage_percent_display(self, obj):
        return f"{float(obj.proxy_usage_percent):.1f}%"
    proxy_usage_percent_display.short_description = 'Usage %'
    
    def remaining_proxies(self, obj):
        return obj.remaining_proxies
    remaining_proxies.short_description = 'Remaining'


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'proxy_id', 'request_count', 'data_used_mb', 'success', 'timestamp']
    list_filter = ['success', 'timestamp']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Usage Information', {
            'fields': ('user', 'proxy_id', 'request_count', 'data_used_mb', 'success')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )


@admin.register(UserAllocatedProxy)
class UserAllocatedProxyAdmin(admin.ModelAdmin):
    list_display = ['user', 'proxy_pool', 'gateway_port', 'allocated_at']
    list_filter = ['allocated_at', 'user']
    search_fields = ['user__username', 'user__email', 'gateway_port']
    readonly_fields = ['allocated_at']
    ordering = ['-allocated_at']
    
    fieldsets = (
        ('Allocation Info', {
            'fields': ('user', 'proxy_pool', 'gateway_port')
        }),
        ('Timestamp', {
            'fields': ('allocated_at',)
        }),
    )


# Customize admin site
admin.site.site_header = "ProxyFlow Backoffice"
admin.site.site_title = "ProxyFlow Admin"
admin.site.index_title = "Welcome to ProxyFlow Administration"