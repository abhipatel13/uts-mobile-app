// Centralized service exports - single import point for all API services

// Core API client
export { api } from '../lib/api-client';

// Domain-specific services
export { AuthService } from './AuthService';
export { AssetHierarchyApi } from './AssetHierarchyApi';
export { TacticsApi } from './TacticsApi';
export { TaskHazardApi } from './TaskHazardApi';
export { RiskAssessmentApi } from './RiskAssessmentApi';
export { UserApi } from './UserApi';

// Re-export commonly used services for convenience
export { AuthService as Auth } from './AuthService';
export { AssetHierarchyApi as AssetApi } from './AssetHierarchyApi';
export { TacticsApi as TacticApi } from './TacticsApi';
export { TaskHazardApi as TaskHazardService } from './TaskHazardApi';
export { RiskAssessmentApi as RiskAssessmentService } from './RiskAssessmentApi';
export { UserApi as UserService } from './UserApi';
