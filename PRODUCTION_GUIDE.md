# 🚀 Production Deployment & Security Guide

This guide provides comprehensive security hardening and deployment recommendations for the 5S Audit application.

## 📋 Pre-Deployment Checklist

### 🔐 Environment Variables
Copy `.env.example` to `.env` and configure all required values:

```bash
cp .env.example .env
```

**Critical Variables to Set:**
- `JWT_SECRET` - 32+ character random string
- `JWT_REFRESH_SECRET` - Different 32+ character random string  
- `DATABASE_URL` - Production database connection string
- `NODE_ENV=production`
- `CORS_ORIGIN` - Your frontend domain(s)

### 🛡️ Security Hardening

#### 1. Database Security
- [ ] Use connection pooling
- [ ] Enable SSL/TLS for database connections
- [ ] Implement database user with minimal required permissions
- [ ] Regular database backups
- [ ] Database encryption at rest

#### 2. Application Security
- [ ] Enable HTTPS with valid TLS certificates
- [ ] Configure secure session cookies
- [ ] Implement proper logging and monitoring
- [ ] Set up intrusion detection
- [ ] Configure firewall rules

#### 3. Secrets Management
- [ ] Never commit secrets to version control
- [ ] Use environment variables or secrets management service
- [ ] Rotate JWT secrets regularly
- [ ] Implement key rotation strategy

### 📊 Monitoring & Logging

#### Required Monitoring
- [ ] Application uptime monitoring
- [ ] Error rate monitoring  
- [ ] Response time monitoring
- [ ] Database performance monitoring
- [ ] Security event logging

#### Recommended Tools
- **APM**: New Relic, DataDog, or AppSignal
- **Logging**: ELK Stack, Splunk, or CloudWatch
- **Monitoring**: Prometheus + Grafana
- **Uptime**: StatusPage, Pingdom

### 🔄 CI/CD Pipeline

#### Automated Checks
```yaml
# Example GitHub Actions workflow
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    steps:
      - name: Run tests
        run: npm run test:ci
      - name: Security audit
        run: npm run audit:security
      - name: Type checking
        run: npm run check
      - name: Build application
        run: npm run build
```

### 🏗️ Infrastructure Recommendations

#### Container Deployment (Docker)
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
USER node
CMD ["npm", "start"]
```

#### Load Balancer Configuration
- Enable health checks on `/health` endpoint
- Configure session affinity if needed
- Set up SSL termination
- Configure rate limiting at load balancer level

#### Database
- Use managed database service (AWS RDS, Google Cloud SQL)
- Enable automated backups
- Set up read replicas for scaling
- Configure connection pooling

### 🚨 Security Headers

The application automatically sets security headers via Helmet.js:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)
- Content Security Policy (CSP)

### 📈 Performance Optimization

#### Application Level
- [ ] Enable compression middleware
- [ ] Implement caching strategy
- [ ] Optimize database queries
- [ ] Use CDN for static assets
- [ ] Enable HTTP/2

#### Code Optimization
- [ ] Bundle optimization
- [ ] Tree shaking
- [ ] Code splitting
- [ ] Image optimization

### 🔧 Production Environment Setup

#### Required Environment Variables
```bash
# Production .env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?ssl=true

# JWT Configuration (use strong random values)
JWT_SECRET=your-32-plus-character-secret-here
JWT_REFRESH_SECRET=different-32-plus-character-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
HELMET_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
```

#### Deployment Commands
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start application
npm start
```

### 🔍 Security Audit Commands

```bash
# Security audit
npm run audit:security

# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Fix vulnerabilities
npm run audit:fix
```

### 📊 Performance Monitoring

#### Key Metrics to Monitor
- Response time (95th percentile < 500ms)
- Error rate (< 1%)
- Memory usage (< 80% of available)
- CPU usage (< 70% average)
- Database connection pool usage
- Active user sessions

#### Health Check Endpoint
The application provides a health check at `/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### 🚨 Incident Response

#### Log Locations
- Application logs: `stdout/stderr`
- Error logs: Captured by error handling middleware
- Access logs: Express request logging middleware

#### Common Issues & Solutions

**High Memory Usage:**
- Check for memory leaks
- Monitor database connection pooling
- Review file upload handling

**High CPU Usage:**  
- Check for infinite loops
- Review database query performance
- Monitor password hashing operations

**Authentication Issues:**
- Verify JWT secret configuration
- Check token expiration settings
- Review rate limiting configuration

### 🔄 Maintenance Tasks

#### Daily
- [ ] Monitor application health
- [ ] Review error logs
- [ ] Check resource usage

#### Weekly  
- [ ] Review security alerts
- [ ] Update dependencies
- [ ] Database maintenance

#### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Backup testing
- [ ] Rotate secrets (if needed)

### 📞 Emergency Contacts

- **DevOps Team**: [contact-info]
- **Security Team**: [contact-info]  
- **Database Admin**: [contact-info]
- **On-call Engineer**: [contact-info]

---

## 🧪 Testing in Production

### Smoke Tests
```bash
# Health check
curl https://yourdomain.com/health

# Authentication test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-admin-password"}'

# Protected endpoint test
curl -H "Authorization: Bearer <token>" \
  https://yourdomain.com/api/auth/me
```

### Load Testing
Use tools like Artillery, k6, or JMeter to test:
- Authentication endpoints
- File upload functionality
- Database-heavy operations
- Concurrent user scenarios

---

**⚠️ Remember: Security is an ongoing process, not a one-time setup. Regularly review and update your security measures.**