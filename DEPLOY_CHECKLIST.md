# SalonFlowAI Deploy Checklist

## Frontend
- [ ] app.json extra.apiBaseUrlWeb is set for production backend
- [ ] app.json extra.apiBaseUrlNative is set for device-accessible backend
- [ ] No broken hardcoded local dev URLs remain outside config
- [ ] Login, logout, clients, services, appointments, analytics, reports tested

## Backend
- [ ] .env contains production Mongo URL
- [ ] .env contains strong JWT secret
- [ ] CORS origins are set correctly
- [ ] Backend runs on 0.0.0.0:8000
- [ ] /auth/login works
- [ ] protected routes work with Bearer token

## Security
- [ ] change default admin password
- [ ] change jwt secret
- [ ] confirm no secrets committed to git
- [ ] confirm debug/dev values are removed for production

## Release smoke test
- [ ] login
- [ ] logout
- [ ] create client
- [ ] create service
- [ ] create appointment
- [ ] complete/cancel/delete appointment
- [ ] reports pdf export
