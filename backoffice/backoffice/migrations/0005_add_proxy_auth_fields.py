# Generated manually for proxy authentication support
# Adds proxy_username and proxy_password fields to ProxyPool model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backoffice', '0004_proxypool_password_proxypool_scheme_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='proxypool',
            name='proxy_username',
            field=models.CharField(blank=True, default='', help_text='Username for original proxy auth', max_length=255),
        ),
        migrations.AddField(
            model_name='proxypool',
            name='proxy_password',
            field=models.CharField(blank=True, default='', help_text='Password for original proxy auth', max_length=255),
        ),
    ]
