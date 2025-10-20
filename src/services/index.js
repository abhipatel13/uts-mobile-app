// Centralized service exports - single import point for all API services

// Core API client
export { api } from '../lib/api-client';

// Domain-specific services
export { AuthService } from './AuthService';
export { AssetHierarchyApi } from './AssetHierarchyApi';
export { AssetHierarchyService } from './AssetHierarchyService';
export { TaskHazardApi } from './TaskHazardApi';
export { TaskHazardService } from './TaskHazardService';
export { RiskAssessmentApi } from './RiskAssessmentApi';
export { UserApi } from './UserApi';
export { UserService } from './UserService';
export { default as DatabaseService } from './DatabaseService';
export { default as LocationService } from './LocationService';
export { default as SyncService } from './SyncService';

// Re-export commonly used services for convenience
export { AuthService as Auth } from './AuthService';
export { AssetHierarchyApi as AssetApi } from './AssetHierarchyApi';
export { default as RiskAssessmentService } from './RiskAssessmentService';
export { default as DB } from './DatabaseService';
